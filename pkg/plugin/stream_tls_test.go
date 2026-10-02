package plugin

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// newClientCertificate returns a self-signed TLS client certificate and key, in PEM.
func newClientCertificate(t *testing.T) (certPEM, keyPEM []byte) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "grafana"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	keyDER, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}),
		pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})
}

// The WebSocket connection uses the TLS settings of the datasource, like its HTTP requests: the CA certificate of a
// self-signed PI Web API ("Add self-signed certificate") and the client certificate ("TLS Client Authentication").
func TestWebsocketTLSSettings(t *testing.T) {
	clientCert, clientKey := newClientCertificate(t)
	clientCAs := x509.NewCertPool()
	clientCAs.AppendCertsFromPEM(clientCert)

	upgrader := websocket.Upgrader{}
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err == nil {
			_ = conn.Close()
		}
	}))
	server.TLS = &tls.Config{ClientAuth: tls.RequireAndVerifyClientCert, ClientCAs: clientCAs, MinVersion: tls.VersionTLS12}
	server.StartTLS()
	t.Cleanup(server.Close)
	serverCA := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})

	instance, err := NewPIWebAPIDatasource(context.Background(), backend.DataSourceInstanceSettings{
		UID: t.Name(), URL: server.URL + "/piwebapi",
		JSONData: []byte(`{"useStreaming":true,"tlsAuthWithCACert":true,"tlsAuth":true}`),
		DecryptedSecureJSONData: map[string]string{
			"tlsCACert": string(serverCA), "tlsClientCert": string(clientCert), "tlsClientKey": string(clientKey),
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	d := instance.(*Datasource)
	t.Cleanup(d.Dispose)

	conn, err := d.createWebsocketConnection(context.Background(), []string{"W1"})
	if err != nil {
		t.Fatalf("WebSocket connection failed: %v", err)
	}
	_ = conn.Close()
}

// The credentials of a datasource URL (https://user:password@host/piwebapi) authenticate the WebSocket connection
// like the datasource's HTTP requests, and are not logged.
func TestWebsocketURLCredentials(t *testing.T) {
	logs := captureBackendLogs(t)
	upgrader := websocket.Upgrader{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if user, password, _ := r.BasicAuth(); user != "piuser" || password != "s3cret" {
			http.Error(w, "denied", http.StatusUnauthorized)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err == nil {
			_ = conn.Close()
		}
	}))
	t.Cleanup(server.Close)
	d := newTestDatasource()
	d.settings = backend.DataSourceInstanceSettings{URL: strings.Replace(server.URL, "http://", "http://piuser:s3cret@", 1) + "/piwebapi"}
	conn, err := d.createWebsocketConnection(context.Background(), []string{"W1"})
	if err != nil {
		t.Fatalf("WebSocket connection failed: %v", err)
	}
	_ = conn.Close()

	d.settings.URL = strings.Replace(d.settings.URL, "s3cret", "wrong-s3cret", 1)
	if _, err := d.createWebsocketConnection(context.Background(), []string{"W1"}); err == nil {
		t.Fatal("expected an error")
	}
	logs.mu.Lock()
	defer logs.mu.Unlock()
	if len(logs.entries) == 0 {
		t.Fatal("the failure was not logged")
	}
	for _, entry := range logs.entries {
		if strings.Contains(fmt.Sprint(entry.msg, entry.args), "s3cret") {
			t.Errorf("the password was logged: %s %v", entry.msg, entry.args)
		}
	}
}
