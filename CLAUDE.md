## Project knowledge

This repository contains a **Grafana data source plugin** for the OSIsoft PI Web API: a React/TypeScript frontend in
`src/` and a Go backend in `pkg/` built with `grafana-plugin-sdk-go`. See `CONTRIBUTING.md` for the development and
release commands.

## Git

- The author of every commit is `Paulo Vitor Magacho <pvmagacho@gmail.com>`: commit with
  `--author="Paulo Vitor Magacho <pvmagacho@gmail.com>"`. Leave the committer as the environment's signing identity
  (Claude) and keep commits signed, so that GitHub shows them as verified. Do not set `user.name` or `user.email`,
  and do not rewrite commits in a way that drops their signatures (e.g. `git filter-branch`).
- End commit messages with `Co-Authored-By: Claude <noreply@anthropic.com>` only. Do not add `Claude-Session:` or
  other session links.
- Work on `release/v6.0.0` and push directly to it; do not open pull requests unless asked.

## Tooling

- Node 24 (`.nvmrc`) and npm 11 (`packageManager` in `package.json`). Install with `npm ci`; run scripts with
  `npm run <script>`. Do not use Yarn.
- `.npmrc` is the one of clickhouse-datasource (no install scripts, no git dependencies, a minimum release age,
  exact versions, `engine-strict`). Keep it.
- Go as declared by the `go` directive in `go.mod`. `.github/workflows/release.yml` sets `go-version` separately:
  keep it on the same minor version.
- Backend builds use mage: `mage -v build:linux build:linuxARM64 build:windows build:darwin build:darwinARM64`.
- `dist/` is a build output and is not committed.

## Checks before pushing

- Frontend: `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`
- Backend: `gofmt -l pkg/`, `go vet ./pkg/...`, `go test ./pkg/...`, `golangci-lint run ./pkg/...` (CI runs the
  latest golangci-lint; its `errcheck` reports values received from an error channel and then discarded)
- End-to-end: CI runs the Playwright tests (`tests/`) against every Grafana version resolved from
  `grafanaDependency`, from 11.6 to nightly. Grafana 11.6 must keep working.

## Dependencies

- Follow clickhouse-datasource for the `go` directive, `grafana-plugin-sdk-go`, the `@grafana/data`, `ui`, `runtime`
  and `schema` versions and `grafanaDependency`; check the other Grafana-maintained data source plugins before
  changing tooling.
- `@grafana/plugin-ui` stays on 0.17.4. It is the only Grafana package bundled into `module.js`; `@grafana/data`, `ui`
  and `runtime` are webpack externals provided by Grafana at runtime.
- Ask before changing the package manager, the supported Grafana versions or other build tooling.

## Changelog

- Add user-facing changes to the top section of `CHANGELOG.md` (the plugin catalog shows it); development-only tooling
  changes do not go there.
