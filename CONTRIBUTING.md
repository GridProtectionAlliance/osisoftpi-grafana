# Contributing

## Development

- Frontend: `yarn install`, `yarn dev` (watch) or `yarn build`; checks: `yarn typecheck`, `yarn lint`, `yarn test:ci`
- Backend: `mage -v build:linux` (or `mage -v` for every platform); checks: `golangci-lint run ./pkg/...`, `go test ./pkg/...`
- End-to-end tests: `yarn server` starts Grafana with the plugin, then `yarn e2e`

## Releasing

Pushing a `v*` tag (e.g. `v6.0.0`, matching the version in `package.json`) runs `.github/workflows/release.yml`: it
builds and signs the plugin, creates a build provenance attestation and a draft GitHub release. Publish the draft,
then submit the update in the grafana.com plugin catalog. Signing needs the `GRAFANA_ACCESS_POLICY_TOKEN` repository
secret.

## Changing how queries are saved

Panel queries are saved in dashboards and alert rules and must keep working after an upgrade. Every saved query
carries two fields:

- `queryVersion`: the format version of the saved query. Queries saved before 6.0 have none (version 0).
- `pluginVersion`: the version of the plugin that last saved the query. It is for information only (it is logged
  with query errors) and must not be used to decide how to read a query.

Raise the format version when a change makes queries saved by earlier versions read differently: a field is renamed,
moved or removed, its values change format, or its meaning or default changes. Adding an optional field whose
absence keeps the previous behaviour does not need a new version.

When raising it, in the same change:

1. Raise `QUERY_VERSION` in `src/queryVersion.ts` and `queryVersion` in `pkg/plugin/query_version.go`.
2. Add the conversion step from the previous version to the new one to `queryMigrations` in both files. The
   frontend converts dashboard queries and the query editor saves them in the new format; the backend converts
   alert rules and API queries, which do not go through the frontend.
3. Add `testdata/queries/v<new version>.json` with examples of the new format, and add examples of the previous
   format to `testdata/queries/v<previous version>.json` if needed. Each example has the saved query and the
   expected fields after conversion; both the Go and the Jest tests convert them.
4. Describe the change in `CHANGELOG.md`.

The tests fail when the two versions differ, when a conversion step is missing or when a version has no examples.
