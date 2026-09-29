package plugin

import (
	"errors"
	"fmt"
	"math"
	"strings"
)

// maxExpandedTargets limits how many element/attribute (or PI point) combinations a single query
// can expand into when multi-value template variables are used.
const maxExpandedTargets = 1000

// errTooManyTargets is returned when a query expands into more than maxExpandedTargets targets.
var errTooManyTargets = errors.New("too many targets")

// expandedValue is one combination produced by expandVariables.
type expandedValue struct {
	// Value is the text with every {a,b,...} group replaced by one of its values.
	Value string
	// Variables holds the value chosen from each group, in order of appearance.
	Variables []string
}

// variableValueDecoder decodes the characters the frontend escapes inside a multi-value group
// so that values containing commas or braces do not break the group.
var variableValueDecoder = strings.NewReplacer("%2C", ",", "%7B", "{", "%7D", "}", "%25", "%")

// splitVariableGroups splits text into its literal parts and the options of each {a,b,...} group, in order:
// literals has one more element than groups. Unbalanced braces are kept as literal text.
func splitVariableGroups(text string) (literals []string, groups [][]string) {
	rest := text
	for {
		start := strings.Index(rest, "{")
		if start == -1 {
			break
		}
		end := strings.Index(rest[start:], "}")
		if end == -1 {
			break
		}
		end += start
		literals = append(literals, rest[:start])
		options := strings.Split(rest[start+1:end], ",")
		for i, option := range options {
			options[i] = variableValueDecoder.Replace(strings.TrimSpace(option))
		}
		groups = append(groups, options)
		rest = rest[end+1:]
	}
	return append(literals, rest), groups
}

// countExpansions returns how many values expandVariables would produce for text, without building them.
// The count saturates at math.MaxInt.
func countExpansions(text string) int {
	_, groups := splitVariableGroups(text)
	return productOf(groups, func(g []string) int { return len(g) })
}

func productOf[T any](items []T, size func(T) int) int {
	product := 1
	for _, item := range items {
		n := size(item)
		if n != 0 && product > math.MaxInt/n {
			return math.MaxInt
		}
		product *= n
	}
	return product
}

// expandVariables expands every {a,b,...} group in text into all combinations (cartesian product).
// Grafana formats multi-value template variables as {value1,value2,...}, so a path such as
// `\\AF\DB\{SiteA,SiteB}\{Unit1,Unit2}` expands into four paths.
func expandVariables(text string) []expandedValue {
	literals, groups := splitVariableGroups(text)
	results := []expandedValue{{Value: literals[0], Variables: []string{}}}
	for i, options := range groups {
		next := make([]expandedValue, 0, len(results)*len(options))
		for _, result := range results {
			for _, option := range options {
				variables := make([]string, len(result.Variables), len(result.Variables)+1)
				copy(variables, result.Variables)
				next = append(next, expandedValue{
					Value:     result.Value + option + literals[i+1],
					Variables: append(variables, option),
				})
			}
		}
		results = next
	}
	return results
}

// expandedTarget is one element (or PI server) path combined with one attribute (or PI point).
type expandedTarget struct {
	BasePath  string
	Attribute string
	// Variable is the label prefix for the legacy data format: the values chosen for the
	// multi-value variables of the element path, joined with a backslash.
	Variable string
	// MultiVariable is true when the element path used more than one multi-value variable.
	MultiVariable bool
}

// getExpandedTargets returns every element/attribute combination of the query after expanding
// multi-value template variables in the element path and in each attribute.
func (q *PIWebAPIQuery) getExpandedTargets() ([]expandedTarget, error) {
	if q.Target == nil {
		return []expandedTarget{}, nil
	}
	// check the limit before building the combinations: "All" on several large variables can be millions
	basePathCount := countExpansions(q.getBasePath())
	names := q.getAttributeNames()
	attributeCount := 0
	for _, name := range names {
		if n := countExpansions(name); n > math.MaxInt-attributeCount {
			attributeCount = math.MaxInt
		} else {
			attributeCount += n
		}
	}
	total := productOf([]int{basePathCount, attributeCount}, func(n int) int { return n })
	if total > maxExpandedTargets {
		return nil, fmt.Errorf("%w: the template variables expand this query into %d targets (%d element paths x %d attributes), the limit is %d",
			errTooManyTargets, total, basePathCount, attributeCount, maxExpandedTargets)
	}

	basePaths := expandVariables(q.getBasePath())
	attributes := make([]string, 0, attributeCount)
	for _, name := range names {
		for _, expanded := range expandVariables(name) {
			attributes = append(attributes, expanded.Value)
		}
	}

	targets := make([]expandedTarget, 0, total)
	for _, basePath := range basePaths {
		for _, attribute := range attributes {
			targets = append(targets, expandedTarget{
				BasePath:      basePath.Value,
				Attribute:     attribute,
				Variable:      strings.Join(basePath.Variables, `\`),
				MultiVariable: len(basePath.Variables) > 1,
			})
		}
	}
	return targets, nil
}

// getAttributeNames returns the attribute (or PI point) names of the query. The query editor sends them in the
// attributes array; queries written by hand or sent to the API may only list them in the target after the
// element path, separated by semicolons (e.g. `Server\Database\Element;Attribute1;Attribute2`).
func (q *PIWebAPIQuery) getAttributeNames() []string {
	names := make([]string, 0, len(q.Attributes))
	for _, attribute := range q.Attributes {
		names = append(names, attribute.Value.Value)
	}
	if len(names) > 0 || q.Target == nil {
		return names
	}
	parts := strings.Split(*q.Target, ";")
	for _, part := range parts[1:] {
		if part = strings.TrimSpace(part); part != "" {
			names = append(names, part)
		}
	}
	return names
}
