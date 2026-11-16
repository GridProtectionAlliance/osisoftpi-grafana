# Logs

The plugin backend writes its logs to the Grafana server log, with `logger=plugin.gridprotectionalliance-osisoftpi-datasource`.
Each line has a fixed event name (`msg`) and one field per value, so that the logs can be filtered and counted, for
example in Loki.

## Grafana settings

Use the text (logfmt) or JSON format, so that a log collector can read the fields:

```ini
[log.console]
format = text
```

Set the same under `[log.file]` when Grafana writes log files. The default console format adds colors when Grafana
writes to a terminal. Use `level = debug` under `[log]` to also get the debug lines listed below.

With Loki, keep the labels to few values (`app`, `level`, `logger`) and read the other fields with `| logfmt` (or
`| json`): a label per dashboard, target or error would create a stream per value.

## Errors and warnings

Every error and warning has an `errorType` and an `errorSource` field. `errorSource` is `plugin` for failures of the
plugin, and `downstream` for PI Web API and for problems of the query or the configuration: the error sources
Grafana uses for the requests of a datasource. The same source is set on the error of the query response.

| `errorType` | `errorSource` | Level | Meaning |
|---|---|---|---|
| `invalid_query` | downstream | warn | The saved query cannot be read, or its target is empty or invalid |
| `template_variable` | downstream | warn | The template variables cannot be expanded, or expand into more than 1000 targets |
| `not_found` | downstream | warn | PI Web API returned 404: the PI point or AF path does not exist |
| `piwebapi_bad_request` | downstream | warn | PI Web API returned 400, e.g. an invalid time range or calculation expression |
| `auth` | downstream | error | PI Web API returned 401 or 403 |
| `piwebapi_error` | downstream | error | PI Web API returned another error status (5xx, 409, …) |
| `piwebapi_unreachable` | downstream | error | No response from PI Web API: connection refused, DNS, TLS or timeout |
| `response_decode` | plugin | error | PI Web API answered, but the plugin cannot read the response |
| `value_conversion` | plugin | warn | A value returned by PI Web API does not fit the type of the series |
| `path_not_allowed` | downstream | warn | The resource proxy refused a path |
| `invalid_setting` | downstream | warn | A datasource setting is invalid and its default is used |
| `stream_connect` | downstream | error | The WebSocket connection of live streaming failed or was lost |
| `stream_fill` | downstream | warn | Filling the gap of a live stream after a reconnect failed |
| `stream_send` | plugin | error | Sending live values to Grafana failed |
| `internal` | plugin | error | An unexpected error in the plugin |

Each failing query target is logged once with `query_target_failed` (`annotation_query_failed` for annotation
queries): count these lines to get the failures per error type, dashboard or target. The other lines add details
of the same failure (e.g. the start of an unreadable response).

## Messages

| `msg` | Level | Fields |
|---|---|---|
| `query_target_failed` | by error type | `refId`, `target`, `status`, `error`, `hideError`, `queryType`, `nodata`, `startTime`, `endTime`, `webId`, `request`, `webIdRequest`, `savedByPluginVersion` |
| `query_canceled` | debug | as `query_target_failed`: Grafana cancelled the query (the panel was refreshed or closed) |
| `query_unreadable` | warn | `refId`, `error`, `query` (start of the saved query) |
| `batch_request_failed` | by error type | `status`, `error`, `targets` |
| `piwebapi_response_unreadable` | error | `reason`, `status`, `bodySize`, `body` (start of the response), `error`, `refId`, `target` |
| `value_conversion_failed` | warn | `refId`, `target`, `webId`, `valueType`, `seriesType`, `timestamp`, `value`, `valueKind`, `good`, `questionable`, `substituted`, `nodata`, `error` |
| `display_regex_invalid` | warn | `refId`, `target`, `search`, `error` |
| `annotation_query_failed` | by error type | `refId`, `status`, `error` |
| `annotation_attribute_failed` | by error type | `refId`, `status`, `error` |
| `resource_path_not_allowed` | warn | `path` |
| `resource_request_failed` | by error type | `path`, `status`, `error` |
| `invalid_setting` | warn | `setting`, `value`, `default`, `error` |
| `response_body_close_failed` | error | `error` |
| `stream_connect_failed` | error | `url`, `status`, `error` |
| `stream_connection_lost` | warn | `connectionKey`, `error`: the streams of the connection reconnect |
| `stream_reconnect_failed` | warn | `path`, `webId`, `attempt`, `error` |
| `stream_reconnect_exhausted` | error | `path`, `webId`, `attempts` |
| `stream_fill_failed` | warn | `path`, `webId`, `requestErrorType`, `status`, `error` (`bodySize`, `body` when the values cannot be read) |
| `stream_message_unreadable` | error | `connectionKey`, `bodySize`, `body`, `error` |
| `stream_send_failed` | error | `path`, `webId`, `error` (`keepalive=true` for a keepalive) |
| `stream_values_dropped` | warn | `connectionKey`, `webId`, `error` |
| `datasource_created`, `stream_connection_opened`, `stream_connection_orphan_closed`, `stream_gap_filled`, `stream_reconnecting`, `stream_reconnected`, `stream_stopped`, `webid_cache_cleaned` | info | |
| `value_missing`, `value_converted`, `bad_value_replaced`, `frame_built`, `response_cache_hit`, `response_cache_set`, `calculation_request`, `webid_cache_hit`, `webid_cache_expired`, `stream_*` | debug | |

`status` is the HTTP status returned by PI Web API (0 when it did not answer). `queryType` is `plot`, `recorded`,
`interpolated`, `summary`, `lastValue` or `calculation`, and `nodata` the "Replace Bad Data" option. `value` is cut
to 200 characters and `body` to 512 bytes, so that lines stay a few KB: Loki drops lines over its `max_line_size`
(256 KB by default), and the Docker log driver splits lines over 16 KB.

The lines of a query also have the datasource and the user (`dsName`, `dsUid`, `uname`) and, for the queries of a
dashboard panel, the dashboard and the panel (`dashboardUID`, `dashboardTitle`, `panelID`, `panelTitle`). Queries
from Explore and alert rules have no dashboard. A live stream logs the dashboard and panel of the query that
started it.

## Loki queries

Failures per error type:

```logql
sum by (errorType) (count_over_time({app="grafana"} | logfmt | logger="plugin.gridprotectionalliance-osisoftpi-datasource" | msg="query_target_failed" [1h]))
```

The 10 panels with the most failing queries:

```logql
topk(10, sum by (dashboardTitle, panelTitle) (count_over_time({app="grafana"} | logfmt | logger="plugin.gridprotectionalliance-osisoftpi-datasource" | msg="query_target_failed" [24h])))
```

PI points and AF attributes that do not exist, by panel:

```logql
{app="grafana"} | logfmt | logger="plugin.gridprotectionalliance-osisoftpi-datasource" | errorType="not_found" | line_format "{{.dashboardTitle}} / {{.panelTitle}}: {{.target}}"
```

Failures of PI Web API and of the plugin only (without the problems of queries):

```logql
{app="grafana"} | logfmt | logger="plugin.gridprotectionalliance-osisoftpi-datasource" | level="error"
```
