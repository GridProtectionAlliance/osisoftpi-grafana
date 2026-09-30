# Changelog

## 1.0.0

- Initial release.

## 2.0.0

- Move to React based framework.

## 3.1.0

- Added calculation to PI Points
- Added PI point configuration (thanks to @TheFern2)
- Added option to use last value from PiWebAPI
- Updated to Grafana plugin SDK v9.3.6

## 4.0.0

- Added a new dataframe label format. It can be disabled in the configuration page for backward compatibility
- Added engineering units to Dataframe field. This can be globaly disabled in the configuration page
- Optimized queries using PIWebAPI batch endpoint
- Improved raw query processing
- Added variable support in raw query
- Fixed annotations support
- Updated to Grafana plugin SDK v9.4.7
- Fixed PI AF calculation
- Added plugin screenshots

## 4.1.0

- Modified the PI Webapi controller endpoints used when calculation is selected
- Allow calculation when last value option is selected
- When calculation is selected, change label from Interpolated to Interval
- Fixed issue with variable in Element Path

## 4.2.0

- Fixed issue that only odd attributes were been shown
- Fixed issue when fetching afServerWebId

## 5.0.0

- Migrated backend to Go language
- Changed the query editor layout
- Support Grafana version 11
- Drop support for Grafana 8.x and 9.x

## 5.1.0

- Add units and description to new format - issue #154
- Fixed digital state - issue #159
- Fixed summary data - issue #160
- Fixed an error in recorded max number of points - issue #162
- Fix issue with summary when migrating from previous versions - issue $160

- Updated the query editor layout
- Added boundary type support in recorded values
- Recognize partial usage of variables in elements
- Added configuration to hide API errors in panel
- Truncate time from grafana date time picker to seconds
- Fixed warnings during deploy
- Fixed LICENSE file

### 5.2.0

- Improved query performance to PiWebAPI by joing all queries in Panel into one batch request only
- Change the Query Editor layout
- Increased WebID cache from 1 hour to 12 hours and made it configurable

- Added experimental feature to cache latest response in case of request failure to PiWebAPI

## 6.0.0

- Added live streaming of PI point and AF attribute values through PI Web API channels (WebSocket) - issue GridProtectionAlliance/osisoftpi-grafana#206 (thanks to Michael Bohan, @mbtx2)
  - enabled with "Enable Streaming Support" in the datasource configuration and "Enable Streaming" in the query, optionally controlled by a dashboard variable
  - streamed values follow the query settings (Replace Bad Data, Digital States, units); queries with a calculation, a summary, "Use Last Value", "Interpolate" or "Recorded Values" are not streamed, and the query editor only offers streaming, as the last option row, when none is selected
  - streaming resumes by itself after PI Web API was unavailable, and "Fill gaps after reconnect" (on by default) adds the values recorded in the meantime; connections time out after the datasource "Timeout"
- Annotation query editor: the AF server is selected in a new dropdown, and the category is a dropdown of the database categories (element categories, also used by event frames); the AF server and database set in the datasource configuration are pre-selected and cannot be changed
- Variable queries use a query language: `points PIT-*`, `elements AFSERVER\Database\Plant searchFullHierarchy=true templateName=Pump`, `attributes AFSERVER\Database\Element nameFilter=Fl*` with the PI Web API filters (`nameFilter`, `descriptionFilter`, `categoryName`, `templateName`, `elementType`, `valueType`) and paging (`sortField`, `sortOrder`, `startIndex`, `maxCount`), shown with its help in a new variable query editor; JSON queries of earlier versions keep working
- Rebuilt the plugin with current Grafana tooling to fix it failing to load on Grafana 12.3 and later - issue GridProtectionAlliance/osisoftpi-grafana#197
- Fixed units from PI not being added to data frames when "Enable Unit From Data" and "Use unit from datapoints" are enabled - issue GridProtectionAlliance/osisoftpi-grafana#208
- Improved template variables support - issue GridProtectionAlliance/osisoftpi-grafana#187
  - more than one multi-value variable can be used in the element path; every combination is queried
  - multi-value variables in attributes and PI points expand into one attribute or point per value
  - a query can expand into at most 1000 element/attribute combinations
  - series of a path with several variables are named after the element path below the database (e.g. `SiteA\Unit2\Pump|Flow`); with the new data format, AF series have `database` and `path` labels
  - fixed the query editor dropping attributes that use a multi-value variable
  - fixed queries overwriting the template variables saved in the panel (attributes, elements and summary settings)
- Fixed backend panics on queries without the optional `recordedValues` or `summary` settings, and on an invalid regex - issue GridProtectionAlliance/osisoftpi-grafana#209
- Attributes and PI points are read from the query target when the query has no attributes list (API calls, hand-written queries) - issue GridProtectionAlliance/osisoftpi-grafana#209
- Fixed AF elements, attributes and PI points with `#`, `&`, `+`, `%` or spaces in their names not returning data; calculation expressions and event frame filters are encoded too - issue GridProtectionAlliance/osisoftpi-grafana#186
  - calculation expressions are now sent URL-encoded: an expression that was hand-encoded to work around the old behaviour (e.g. `%2B` instead of `+`) must be changed back to the plain character
- The backend resource proxy only forwards the PI Web API collections used by the query editor and configuration page (asset servers, databases, elements, attributes, data servers and points); other paths, including path traversal such as `elements/../batch`, return 403
- Fixed one failing element or attribute in a query (e.g. an element of a multi-value variable without the attribute) dropping the data of the other targets of the query
- Connection and authentication errors (e.g. a wrong password, 401) are shown on the panel instead of an empty "No data"
- Units of AF attributes use the abbreviation returned by PI Web API (e.g. `m3/h` instead of `cubic meter per hour`), as for PI points; the full name is used when no abbreviation is returned
- AF attributes with the value type `<Anything>` (e.g. AF links) or a type unknown to the plugin take the type of their values, instead of being read as text ("Data is missing a number field") - issue GridProtectionAlliance/osisoftpi-grafana#173
- Queries saved by versions 4.x and 5.0 keep their summary and "Replace Bad Data" settings - issue GridProtectionAlliance/osisoftpi-grafana#194
  - their summary (enabled by selecting summary types, with the old "interval" period) was ignored since 5.1, returning raw values
  - "Replace Bad Data" saved inside the summary is moved to the query; opening such a panel in the query editor saves it in the current format
- Saved queries now record their format version (`queryVersion`) and the plugin version that saved them (`pluginVersion`), so future format changes are converted reliably; see CONTRIBUTING.md
- Opening a panel in the query editor no longer writes the editor defaults (e.g. "Replace Bad Data" = Null) into the saved query
- Fixed "Replace Bad Data" = Previous failing the whole request (integer points, or a bad first value), and bad values of DateTime attributes being dropped instead of replaced
- Fixed calculations returning text or boolean values being dropped, and failed calculations ("Calc Failed") being shown in 1754
- Fixed "Digital States" failing the whole request when a bad value (e.g. Shutdown) was returned; bad values now follow "Replace Bad Data", and numeric points whose last value is bad are no longer shown as digital states
- An invalid query (e.g. a target without attribute) reports its error instead of silently dropping the queries after it in the same request
- In PI point mode, the PI server set in the datasource configuration is preselected and is the only server offered
- With the new data format, summary series have a `summaryType` label; the summary type was added to the `type` label instead (e.g. `Double" summaryType="Average`)
- Targets written with a leading `\\` (e.g. `\\AFServer\Database\Element;Attribute`) in raw queries or saved dashboards are sent without it, as the backend adds it; with the new data format, their PI points had an empty `element` label
- Each failing target is logged once with its RefID, target, status, error and the PI Web API requests sent for it (the raw error response is logged at debug level)
- Fewer lookups and allocations per query: no batch request is sent when every query is invalid, and the WebID metadata is read once per series
- Minimum supported Grafana version is now 11.6.0; tested against Grafana 11.6, 12.x and 13.x
- Updated plugin scaffolding to `@grafana/create-plugin` 7.11 (dynamic public path, subresource integrity, ESLint 9)
- Updated frontend packages to `@grafana/*` 12.x
- Updated backend to `grafana-plugin-sdk-go` v0.296.5 (requires Go 1.26)
- Replaced deprecated `LegacyForms` fields in the configuration page
- Replaced deprecated `DataSourceHttpSettings` with `@grafana/plugin-ui` connection, authentication and advanced HTTP settings
- Replaced deprecated `AsyncSelect` with `Combobox` in the annotations editor
- Removed the committed `dist` build output from the repository
- Added Playwright end-to-end tests that run in CI against every supported Grafana version
- CI lints the backend with golangci-lint; releases are signed with a build provenance attestation
