# Next version

Known issues and improvements found while preparing 6.0.0 (audit of the release branch, verified with tests and the
PI Web API simulator). Each item says where the change goes and what it brings.

## Known issues (low severity)

### Backend

- **Target with a trailing `;` is rejected** although its attributes are valid (`pkg/plugin/timeseries_query.go`,
  target validation). Validate by content (non-empty base path and at least one attribute) instead of by suffix.
- **Regex replace with an empty replacement is ignored** (`timeseries_query.go`, `isRegexQuery`). Require only a
  non-empty Search; an empty Replace is valid.
- **A query that expands to no target gets no response**: no frames and no error, e.g. a calculation without
  attributes sent through the API (`variables.go` / `processQuery`). Return an explicit error such as "no attributes
  selected". Element calculations without attributes (the expression evaluated on the element) could also be
  implemented then.
- **`$__interval` / `$__interval_ms` are not resolved for backend-only queries** (alert rules) in Interpolate Period,
  Summary Period and Sample Interval (`timeseries_query_models.go`). Replace them in the backend from `q.Interval`.
- **Health check discards the underlying error** (`datasource.go`, `CheckHealth`), and **does not verify the configured
  PI server, AF server and database**: resolve them and name the missing object.
- **Resource proxy turns every PI Web API failure into `404 {}`** without logging (`datasource.go`, `CallResource`).
  Forward the upstream status and error message (transport errors as 502). The frontend's "not found" messages for
  variable queries then work too (`src/datasource.ts`, `found()`).
- **Open event frames** reach the frontend as an overflowed end time (year 1816) and are recognised as open only by the
  `timeEnd < 0` check (`annotation_query.go`, `src/datasource.ts`). Make the end time nullable for open event frames.
- **Event frame search is capped at PI Web API's default `maxCount` (1000)** without a warning
  (`annotation_query.go`). Page through `Links.Next` or add a configurable maximum and a notice when truncated.
- **Every failing target is logged at Error level**, also with "Ignore API Error?" on (`processBatchtoFrames`). Log
  hidden errors at Debug and one line per query otherwise.
- **The call-rate limiter divides by zero** in the first second and sleeps while holding the datasource lock
  (`datasource.go`, `updateRate`). Replace it with `golang.org/x/time/rate` before the request, outside the lock, or
  remove it (it counts QueryData calls, not PI Web API requests).
- **Time series tracing span is named like the annotation span** ("New annotation query recieved"); rename both and
  add attributes (query count, expanded targets, sub-requests, cache hits).

### Frontend

- **Annotation title regex** throws on an invalid pattern, ignores an empty Replace and replaces only the first match,
  unlike series names (`src/datasource.ts`, `eventFrameToAnnotation`). Use try/catch and the `g` flag.
- **An empty variable query fails with "Unexpected end of JSON input"** (`metricFindQuery`). Return no values.
- **Variable query parser**: template variables are rejected in boolean options and `sortOrder`, and a quoted target
  containing `=` is read as an option (`src/variableQuery.ts`). Validate after interpolation; treat quoted words as
  the target.
- **A variable query saved as a JSON object** (not a string), which 5.x accepted, runs as an empty query
  (`src/query/VariableQueryEditor.tsx`, `variableQueryText`). Serialize legacy objects with `path`/`type`/`filter`.
- **Query editor**:
  - after removing elements up to the database, the attribute picker still offers the old element's attributes;
  - opening an AF query writes `queryVersion`/`pluginVersion` and summary defaults, so the dashboard counts as modified;
  - a custom value in Summary Basis deletes the basis (the backend then returns raw values);
  - a Boundary Type chosen while Recorded Values is off is ignored and reset;
  - the "Streaming variable" input runs the query on every keystroke (use `onChange` + run on blur).

## Improvements

### Variables and queries

- **Variable values are names only** (`src/helper.ts`, `metricQueryTransform`): results of
  `elements ... searchFullHierarchy=true` at different depths cannot be used in a query path. Return the path relative
  to the query target as `value` (text stays the name), or add an option such as `valueField=Path|Name`.
- **Missing combinations of multi-value variables** (an element without the attribute, 404) are reported as a query
  error unless "Ignore API Error?" is on. Report them as a warning notice listing the skipped combinations, and keep
  the error only when nothing exists, when the path was typed explicitly, or for other failures (401, 500, ...).
- **Static (non time series) AF attributes** return one value dated 1970 (PI Web API behaviour). Show them as a flat
  line over the time range (value at the start and end), which is how limits and setpoints are usually drawn.
- **Old data format frames have no labels**, so multi-series alert rules cannot tell series apart. Add at least
  `name`/`path`/`element` labels (always, or for alerting requests), or document that alerting needs the new format.
- **Legacy series names repeat the element** when the variable is the last path element (`T-101|T-101|Volume`, 5.x
  naming). Consider dropping the prefix when it equals the element (changes existing series names).

### Performance

- **One PI Web API sub-request per target**: a 1000-target expansion sends 2000 sub-requests on the first run. Use the
  `*/multiple` lookup endpoints for uncached WebIDs and group data requests into multi-WebID stream set requests.
- **Batch responses are decoded three times** (map, re-marshal, typed struct; about 3.4x CPU and 3.6x memory). Decode
  `Content` as `json.RawMessage`, probe the shape with a small struct and decode once.
- **WebID cache**: used entries never expire (`getWebIDEntry` extends the expiry), and a cached WebID is not
  invalidated on a 400/404 data response. Use absolute expiry and drop entries that fail.
- **Response cache** (experimental) is unbounded and keyed by a base64 copy of the whole query sent with every
  request (`hashCode`). Compute a hash in the backend only when the cache is on; add an LRU limit and TTL. Also stop
  sending fields the backend never reads (`segments`, `webid`, `startTime`, `endTime`, `scopedVars`).
- **Frontend server lookups** in the datasource constructor are not retried and the query editor loads twice; resolve
  the configured servers lazily with a memoized promise.

### Streaming

- **No read deadline or heartbeat on the channel WebSocket**: a half-open connection (NAT/firewall timeout, host power
  loss) stalls live panels forever. Use PI Web API's `heartbeatRate` with a read deadline, or ping/pong.
- **Reconnect is not single-flight**: every channel of a lost connection dials on its own (N handshakes per attempt).
  Use a per-key in-flight dial.
- **All streamable WebIDs of a request go into one channel URL**; large expansions can exceed the HTTP.sys request
  line limit (16 KB). Split into connections of at most ~100 WebIDs.
- **Channel paths only work in the plugin process that served the query** (Grafana HA, plugin restart; a new
  instance after saving the settings takes over the channels). Encode the WebID and stream settings in the channel
  path so any instance can rebuild the stream.
- **One channel per query result**: a refresh or a new time range creates new channels; the old ones close when
  Grafana unsubscribes and are removed after 2 minutes. A dashboard with many live panels and frequent refreshes can
  reach Grafana Live's per-connection channel limit (128 by default). Consider a stable channel per panel with a
  frame that resets the buffer.

### Security

- **Response cache with forwarded identity**: the experimental response cache is keyed by the query only, so with
  "Forward OAuth Identity" or forwarded cookies one user can be shown another user's cached response (documented in
  the README). Key the cache by user (or by a hash of the forwarded headers), or disable it when forwarding is on.
- **Streaming does not use the forwarded identity**: channels are opened with the datasource credentials only, as
  `RunStream` has no user headers. Pass the subscriber's forwarded headers (or refuse streaming with forwarding).

- **Resource proxy allow-list** checks only the first path segment. Match the exact paths the editors use
  (collection, optional WebID, allowed child collection).

### Editors

- **Query editor layout**: replace the four exclusive switches (Use Last Value, Interpolate, Recorded Values, Summary)
  with one "Values" selector (`Plot | Recorded | Interpolated | Summary | Last value`) showing only the fields of the
  chosen mode; Live updates (`Off | On | From variable`) under Plot; a collapsible `QueryOptionGroup` for the other
  options with a one-line summary; Combobox/MultiCombobox instead of the legacy Segment pickers; labels above the
  fields (`EditorField`). The saved query format can stay the same.

### Tests and CI

- **Behaviour without tests**: annotations backend (`processAnnotationQuery`, `convertAnnotationResponseToFrame`),
  summary frames (`PiBatchDataSummaryItems`), the response cache and the health check. Extend the fake PI Web API.
- **Test datasource constructors are copied in six places** and have drifted; keep one constructor.
- **CI does not run the race detector**; add `go test -race ./pkg/...`.
- **CI e2e Grafana versions** are resolved automatically (6 versions, currently without 12.4). Consider a fixed matrix
  of the oldest supported, latest 12.x and latest 13.x, plus nightly.

### Maintenance

- **Duplicated code**: `convertSliceToPointers` repeats one loop for 14 kinds (one generic helper); `sendBatch` repeats
  the error extraction; rename `steam.go` to `stream.go`.
- **CHANGELOG** lists versions oldest first, so the catalog shows 1.0.0 at the top; list newest first.
