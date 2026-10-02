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

Query variables list AF servers, databases, elements, attributes, PI servers and PI points with a short query language:

```
<type> [target] [option=value ...]
```

![variable_query.png](https://github.com/GridProtectionAlliance/osisoftpi-grafana/raw/master/docs/img/variable_query.png)

| Example | Values |
| --- | --- |
| `points PIT-*` | PI points whose name starts with `PIT-` |
| `elements AFSERVER\Database\Plant searchFullHierarchy=true templateName=Pump` | every pump below `Plant` |
| `attributes AFSERVER\Database\Plant\$tank valueType=Double` | numeric attributes of the selected tank |

The types are `servers`, `databases`, `elements`, `attributes`, `dataservers` and `points`; the options are the PI Web
API search parameters (name, category and template filters, sorting and paging). JSON variable queries of earlier
versions keep working.

Variables can be used in the element path, attributes, PI point names, calculation, periods and display name.
Multi-value variables are expanded into one series per value, and every combination when several are used (at most
1000 per query); the display name, e.g. `${unit} ${attribute}`, names each series with its own values.

See [Template variables](https://github.com/GridProtectionAlliance/osisoftpi-grafana/blob/master/docs/template-variables.md)
for every query type and option, chained variables, series names and labels, annotations and more examples.

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
