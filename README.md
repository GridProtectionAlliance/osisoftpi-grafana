# PI Web API Datasource for Grafana

This data source provides access to OSIsoft PI and PI-AF data through PI Web API.

Requires Grafana 11.6.0 or later. The plugin is tested against Grafana 11.6, 12.x and 13.x.

![display](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/system_overview.png)

# Usage

## Datasource Configuration

Create a new instance of the data source from the Grafana Data Sources administration page.

![configuration](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/configuration.png)

- **URL**: the PI Web API endpoint, e.g. `https://server/piwebapi`.
- **Authentication**: PI Web API usually needs "Basic" authentication enabled; enter its credentials here. Custom HTTP
  headers (e.g. a static `Authorization` header) and TLS client certificates are also supported, and "Forward OAuth
  Identity" and "Allowed cookies" pass the Grafana user's token or cookies to PI Web API. Kerberos and NTLM are not
  supported. **Timeout** applies to every PI Web API request.
- **Max Cache Time**: how long the WebIDs of PI points and attributes are cached (12 hours by default).
- **Enable PI Points in Query**: allows queries of PI points (PI Data Archive) in addition to AF attributes.
- **Enable New Data Format**: series are named after the attribute or point, with `element`, `database`, `path`,
  `type`, `description`, `units` (and `summaryType`) labels.
- **Enable Unit From Data**: adds the units defined in PI to the series (and the "Use unit from datapoints" query option).
- **Enable Streaming Support**: allows live streaming (see [Live streaming](#live-streaming)).
- **PI Server, AF Server, AF Database**: the defaults of the query editor. They are pre-selected, and cannot be
  changed, in annotations, and are used by variable queries without a server or database.
- **Enable Experimental Features > Enable Response Cache**: when a PI Web API request fails, the last successful
  response of the same query is shown instead of the error, with its last value extended to the end of the time range.
  The cache is shared by all users of the datasource: do not enable it with "Forward OAuth Identity" or forwarded
  cookies when users may see different PI data, as one user could then be shown another user's cached response.

NOTE: If you are using PI Vision (PI-Coresight), it is recommended to create a separate instance of PI Web API for use
with this plugin. See the [PI Web API documentation](https://docs.aveva.com/bundle/pi-web-api) for more information on
configuring PI Web API.

## Querying via the PI Asset Framework

![elements_and_attributes.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/elements_and_attributes.png)

1. Leave `Is Pi Point?` off.
2. In `AF Elements`, select the database and then the elements, one level at a time. The AF server and database of the
   datasource configuration are selected by default. The pencil button edits the path as text
   (`AFSERVER\Database\Element;Attribute`), where template variables can be used.
3. In `Attributes`, click `+` to list the attributes of the element and select one. Type to filter long lists. Repeat
   to add more attributes.

Query options:

| Option | Description |
| --- | --- |
| Calculation | PI Web API expression applied to every attribute, e.g. `'.' * 2` (`'.'` is the attribute or point). |
| Use Last Value | Only the value at the end of the time range. `Ignore end time` returns the last value of the stream instead. |
| Digital States | Shows digital state names instead of their codes. |
| Replace Bad Data | Replacement of bad values (e.g. `Shutdown`, `Calc Failed`): `Null`, `Drop`, `Previous`, `0` or `Keep` (the bad value itself: the state name in text series and with Digital States, its code in numeric series). |
| Use unit from datapoints | Adds the unit of the point or attribute to the series (requires "Enable Unit From Data"). |
| Interpolate | Interpolated values every `Interpolate Period` (default: time range / panel width). |
| Recorded Values | Values as recorded in PI, up to `Max Recorded Values` (default 1000), with the given `Boundary Type` (default `Inside`). |
| Summary | Summary values (`Average`, `Maximum`, ...) per `Summary Period`, with the `Summary Basis` of PI Web API. |
| Enable Streaming | Live values, see [Live streaming](#live-streaming). |
| Display Name | Name of the series; multi-value variables are replaced with the values of each series, e.g. `${element} ${attribute}`. With `Enable Regex Replace`, the name is changed with a regular expression (`Search`, `Replace`). |
| Ignore API Error? | Errors of PI Web API are not shown in the panel. |

Without Interpolate, Recorded Values or Summary, the plot values of PI Web API are returned, sized to the panel width
(with a calculation: the calculated values at each recorded event).

Interpolate Period, Summary Period and Sample Interval are PI Web API time spans, sent as entered: e.g. `30s`, `5m`,
`1h30m`, `1.5d`, `2 hours`. An invalid value returns PI Web API's error.

## Querying via the PI Dataserver (PI Points)

![pi_point_query.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/pi_point_query.png)

1. Turn `Is Pi Point?` on (requires "Enable PI Points in Query" in the datasource).
2. The PI server of the datasource configuration is selected in `PI Server`.
3. In `Pi Points`, click `+` and type the name of the point (not case sensitive). Repeat to add more points.

The query options are the same as for AF attributes.

## Live streaming

Panels can be updated with new values as soon as PI Web API receives them, using PI Web API channels (WebSocket):

1. Turn on "Enable Streaming Support" in the datasource configuration.
2. Turn on "Enable Streaming" in the query. Optionally, set "Streaming variable" to a dashboard variable
   (e.g. `$live`) that resolves to `true` or `false` to turn streaming on and off from the dashboard.

The query returns the values of the time range, and new values are then added to the panel as they arrive.

- PI Web API channels send raw values, so "Enable Streaming" is only offered for queries without a calculation,
  "Use Last Value", "Interpolate", "Recorded Values" or a summary. While streaming is enabled, these options are hidden.
- The WebSocket connection uses the datasource's authentication (basic authentication, custom HTTP headers), TLS
  settings and "Timeout" (30 seconds when not set).
- Live values are added only when the time range ends at "now" (e.g. "Last 6 hours"). Each query result has its own
  live channel, so a refresh or a new time range starts from the new result, and saving the datasource settings does
  not stop running panels.
- When PI Web API is unavailable, streaming resumes by itself once it is back. With "Fill gaps after reconnect" (on by
  default), the values recorded in the meantime are then added to the panel, up to the query's maximum data points;
  when it is off, or for attributes without recorded values, they are shown at the next refresh of the panel.

# Template Variables

Query variables list AF servers, databases, elements, attributes, PI servers and PI points. The query is written as

```
<type> [target] [option=value ...]
```

![variable_query.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/variable_query.png)

| Type | Target | Options (PI Web API query parameters) |
| --- | --- | --- |
| `servers` | | AF servers |
| `databases` | AF server (default: the AF server of the datasource) | |
| `elements` | AF path of a database or element (default: the AF database of the datasource) | `nameFilter`, `descriptionFilter`, `categoryName`, `templateName`, `elementType`, `searchFullHierarchy`, `sortField`, `sortOrder`, `startIndex`, `maxCount` |
| `attributes` | AF path of an element | `nameFilter`, `categoryName`, `templateName`, `valueType`, `searchFullHierarchy`, `showExcluded`, `showHidden`, `sortField`, `sortOrder`, `startIndex`, `maxCount` |
| `dataservers` | | PI servers |
| `points` | point name filter | `server` (default: the PI server of the datasource), `nameFilter`, `startIndex`, `maxCount` |

- `elements` returns the child elements of the target, or all the elements below it with `searchFullHierarchy=true`.
- Filters accept the PI Web API wildcards `*` and `?`. `sortOrder` is `Ascending` or `Descending`; `startIndex` and
  `maxCount` page through long lists.
- Values with spaces are quoted: `categoryName="Rotating Equipment"`.
- Template variables can be used in the target and in the values, e.g. `elements AFSERVER\Database\$site`.

Examples:

| Query | Values |
| --- | --- |
| `points PIT-*` | PI points of the PI server of the datasource whose name starts with `PIT-` |
| `points server=PISRV nameFilter=*.PV maxCount=100` | the first 100 `.PV` points of another PI server |
| `elements AFSERVER\Database` | root elements of a database |
| `elements AFSERVER\Database\Plant searchFullHierarchy=true templateName=Pump sortOrder=Descending` | every pump below `Plant`, sorted from Z to A |
| `elements AFSERVER\Database categoryName="Rotating Equipment" nameFilter=P-*` | root elements of a category |
| `elements AFSERVER\Database\$site startIndex=0 maxCount=20` | the first 20 child elements of the selected site |
| `attributes AFSERVER\Database\Plant\T-101 valueType=Double` | numeric attributes of an element |

Variable queries of earlier versions, as JSON (`{"path": "AFSERVER\\Database\\ElementNameWithChildren"}`), keep
working and return the child elements of the path.

## Using variables in queries

Variables can be used in the AF element path, in attributes and in PI point names.
Multi-value variables (and the `All` option) are expanded into one series for every selected value:

- Several variables can be used in the element path, e.g. `AFSERVER\DB\${site}\${unit}`.
  Every combination of the selected values is queried.
- A variable used as an attribute (e.g. `${attribute}`) or as a PI point name expands into one attribute or point per value.
- Element and attribute variables are combined, so `${site}` (2 values) x `${unit}` (2 values) x `${attribute}` (2 values) returns 8 series.
- Without "Enable New Data Format", when the element path uses more than one variable, series are named after the element path below the database and the attribute, e.g. `SiteA\Unit2\Pump|Temperature`. With "Enable New Data Format", series keep the attribute name and have `database` and `path` (element path below the database) labels; use them in the legend, e.g. `{{path}}`.
- A single query can expand into at most 1000 element/attribute combinations; larger expansions return an error.

Variables with a custom `All` value are sent as that value and are not expanded.

# Event Frames and Annotations

**AF Event Frames** can be shown as annotations:

![overview](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/overview.png)

Add an annotation query with this datasource:

![annotation_query](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/annotation_query.png)

- **AF Server** and **Database**: where the event frames are searched. When they are set in the datasource
  configuration, they are pre-selected and cannot be changed.
- **Event Frames**: the event frame template.
- **Category**: optional, only event frames with this category (the element categories of the database).
- **Name Filter**: optional, only event frames whose name matches, e.g. `*Trip*`.
- **Show Start and End Time**: shows the event frames as time regions instead of their start time only.
- **Enable Name Regex Replacement**: changes the annotation title with a regular expression (`Search`, `Replace`).
- **Enable Attribute Usage**: adds the values of the given event frame attributes (comma separated) to the annotation
  text.

# Installation

Install the plugin from the Grafana plugin catalog (Administration > Plugins and data > Plugins), or with the Grafana
CLI:

```
grafana cli plugins install gridprotectionalliance-osisoftpi-datasource
```

The signed plugin zip is also attached to each [GitHub release](https://github.com/GridProtectionAlliance/osisoftpi-grafana/releases):
unzip it into the Grafana plugins directory. To build the plugin from source, see [CONTRIBUTING.md](https://github.com/GridProtectionAlliance/osisoftpi-grafana/blob/master/CONTRIBUTING.md).

# Trademarks

All product names, logos, and brands are property of their respective owners.
All company, product and service names used in this website are for identification purposes only.
Use of these names, logos, and brands does not imply endorsement.

OSIsoft, the OSIsoft logo and logotype, and PI Web API are all trademarks of [AVEVA Group plc](https://www.aveva.com/en/legal/osisoft-terms-and-conditions/).
