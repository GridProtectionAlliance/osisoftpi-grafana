# PI Web API Datasource for Grafana

This data source provides access to OSIsoft PI and PI-AF data through PI Web API.

Requires Grafana 11.6.0 or later. The plugin is tested against Grafana 11.6, 12.x and 13.x.

![display](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/system_overview.png)

# Usage

## Datasource Configuration

Create a new instance of the data source from the Grafana Data Sources
administration page.

It is recommended to use "proxy" access settings.
You may need to add "Basic" authentication to your PIWebAPI
server configuration and add credentials to the data source settings.

NOTE: If you are using PI-Coresight, it is recommended to create a new
instance of PI Web API for use with this plugin.

See [PI Web API Documentation](https://docs.osisoft.com/bundle/pi-web-api)
for more information on configuring PI Web API.


## Querying via the PI Asset Framework

![elements_and_attributes.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/elements_and_attributes.png)

1. Verify that the `PI Point Search` toggle is greyed off
2. In `Element` click `Select AF Database` and choose desired database in list
    * A new ui segment should appear: `Select AF Element`
    * A known bug currently exists where this new ui segment fails. In this case select the `+` in `Attributes` and it will force create the ui segment
3. Click `Select AF Element` and select the desired AF element
4. Repeat step 3 until the desired element is reached
5. Under `Attributes` click the `+` icon to list attributes found in selected element; select attribute from dropdown
    * If list of attributes does not appear begin typing attribute name and attributes should appear
    * This method can also be used to filter through long lists of attributes
6. Repeat step 5 as many times as desired


## Querying via the PI Dataserver (PI Points)

![pi_point_query.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/pi_point_query.png)

1. Toggle the `Pi Point Search` on
2. Under `Data Server` click `Select Dataserver` and select desired PI Dataserver
3. Under `PI Points` click the `+` icon to open a text entry field
4. Type the exact name of the desired PI Point; it is NOT case sensitive (`sinusoid` === `SINUSOID` === `sInUsOiD`)
5. Repeat steps 3 - 4 for as many PI Points as desired


# Template Variables

Child elements are the only supported template variables.
Currently, the query interface requires a json query.

An example config is shown below.  
`{"path": "PISERVER\\DatabaseName\\ElementNameWithChildren"}`

![template_setup_1.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/template_setup_1.png)

## Using variables in queries

Variables can be used in the AF element path, in attributes and in PI point names.
Multi-value variables (and the `All` option) are expanded into one series for every selected value:

- Several variables can be used in the element path, e.g. `AFSERVER\DB\${site}\${unit}`.
  Every combination of the selected values is queried.
- A variable used as an attribute (e.g. `${attribute}`) or as a PI point name expands into one attribute or point per value.
- Element and attribute variables are combined, so `${site}` (2 values) x `${unit}` (2 values) x `${attribute}` (2 values) returns 8 series.
- When the element path uses more than one variable, series are named after the element path below the database and the attribute, e.g. `SiteA\Unit2\Pump|Temperature`. With "Enable New Data Format", AF series have `database` and `path` (element path below the database) labels.
- A single query can expand into at most 1000 element/attribute combinations; larger expansions return an error.

Variables with a custom `All` value are sent as that value and are not expanded.

## Live streaming

Panels can be updated with new values as soon as PI Web API receives them, using PI Web API channels (WebSocket):

1. Turn on "Enable Streaming Support" in the datasource configuration.
2. Turn on "Enable Streaming" in the query. Optionally, set "Streaming variable" to a dashboard variable
   (e.g. `$live`) that resolves to `true` or `false` to turn streaming on and off from the dashboard.

The query returns the values of the time range, and new values are then added to the panel as they arrive.

- Calculations and summaries are not streamed, as PI Web API channels send raw values.
- The WebSocket connection uses the datasource's basic authentication and custom HTTP headers, and its "Timeout"
  (30 seconds when not set). Other authentication methods (e.g. Kerberos) are not supported for streaming.
- When PI Web API is unavailable, streaming resumes by itself once it is back. With "Fill gaps after reconnect" (on by
  default), the values recorded in the meantime are then added to the panel, up to the query's maximum data points;
  when it is off, or for attributes without recorded values, they are shown at the next refresh of the panel.


# Event Frames and Annotations

This datasource can use **AF Event Frames** as annotations.

![event-frame](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/event_frame.png)

Creating an annotation query and use the Event Frame category as the query string.
Color and regex replacement strings for the name are supported.

For example:  
![annotations](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/annotations.png)


# Installation

Install using the grafana-cli or clone the repository directly
into your Grafana plugin directory.

```
grafana-cli plugins install gridprotectionalliance-osisoftpi-datasource
```


# Trademarks

All product names, logos, and brands are property of their respective owners.
All company, product and service names used in this website are for identification purposes only.
Use of these names, logos, and brands does not imply endorsement.

OSIsoft, the OSIsoft logo and logotype, and PI Web API are all trademarks of [AVEVA Group plc](https://www.aveva.com/en/legal/osisoft-terms-and-conditions/).
