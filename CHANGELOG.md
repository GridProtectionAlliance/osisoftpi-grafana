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
