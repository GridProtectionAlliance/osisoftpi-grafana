package plugin

import "strings"

// queryVersion is the format version of the saved query. Raise it when a change makes queries saved by earlier
// versions read differently (a field renamed, moved or given another meaning), and in the same change:
//   - add the conversion step to queryMigrations, and to queryMigrations in src/queryVersion.ts
//   - raise QUERY_VERSION in src/queryVersion.ts
//   - add an example of the current format to testdata/queries (see CONTRIBUTING.md)
const queryVersion = 1

// queryMigrations[N] converts a query saved with format version N-1 to version N.
var queryMigrations = map[int]func(q *PIWebAPIQuery){
	1: (*PIWebAPIQuery).migrateLegacySummary,
}

// migrate converts a query saved with an earlier format version to the current one.
func (q *PIWebAPIQuery) migrate() {
	for version := q.QueryVersion + 1; version <= queryVersion; version++ {
		queryMigrations[version](q)
		q.QueryVersion = version
	}
}

// migrateLegacySummary converts the summary settings saved by versions 4.x and 5.0 (issue GridProtectionAlliance/osisoftpi-grafana#194): the summary was
// enabled by selecting summary types, its duration was "interval", and "nodata" (Replace Bad Data) was part of the
// summary. Versions 5.1 and 5.2 kept these fields when re-saving the query, with the summary disabled.
func (q *PIWebAPIQuery) migrateLegacySummary() {
	s := q.Summary
	if s == nil || (s.Interval == nil && s.Nodata == nil) {
		return
	}
	// "Null" is the default the query editor writes when it opens a query, so it does not override the saved value
	if s.Nodata != nil && *s.Nodata != "" && (q.Nodata == nil || *q.Nodata == "" || *q.Nodata == "Null") {
		q.Nodata = s.Nodata
	}
	if s.Interval != nil && strings.TrimSpace(*s.Interval) != "" && (s.Duration == nil || *s.Duration == "") {
		duration := strings.TrimSpace(*s.Interval)
		s.Duration = &duration
	}
	enable := s.Types != nil && len(*s.Types) > 0
	s.Enable = &enable
	s.Interval, s.Nodata = nil, nil
}
