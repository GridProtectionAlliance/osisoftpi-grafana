/**
 * Variable query language.
 *
 *   <type> [<target>] [option=value ...]
 *
 * e.g. `elements AFSERVER\Database\Plant nameFilter=Pump* searchFullHierarchy=true sortOrder=Descending`.
 * Values with spaces are quoted with "" or ''. Template variables can be used in the target and in the values.
 * Queries saved before 6.0 are JSON objects (`{"path": "..."}`) and are handled by metricFindQuery.
 */

export type VariableQueryType = 'servers' | 'databases' | 'elements' | 'attributes' | 'dataservers' | 'points';

export interface VariableQuery {
  type: VariableQueryType;
  // AF path (elements, attributes), AF server (databases) or point name filter (points)
  target?: string;
  // PI Web API query parameters, with their names as in PI Web API
  options: Record<string, string>;
}

const PAGING = ['sortField', 'sortOrder', 'startIndex', 'maxCount'];

/** The options of every query type, named as the PI Web API query parameters. */
export const VARIABLE_QUERY_OPTIONS: Record<VariableQueryType, string[]> = {
  servers: [],
  databases: [],
  dataservers: [],
  elements: [
    'nameFilter',
    'descriptionFilter',
    'categoryName',
    'templateName',
    'elementType',
    'searchFullHierarchy',
    ...PAGING,
  ],
  attributes: [
    'nameFilter',
    'categoryName',
    'templateName',
    'valueType',
    'searchFullHierarchy',
    'showExcluded',
    'showHidden',
    ...PAGING,
  ],
  points: ['server', 'nameFilter', 'startIndex', 'maxCount'],
};

const BOOLEAN_OPTIONS = ['searchFullHierarchy', 'showExcluded', 'showHidden'];
const INTEGER_OPTIONS = ['startIndex', 'maxCount'];

/** Returns true when the variable query is written in the query language (not a JSON object). */
export function isVariableQueryLanguage(query: unknown): query is string {
  return typeof query === 'string' && query.trim() !== '' && !query.trim().startsWith('{');
}

/** Splits the query into words; quoted parts ("a b" or 'a b') keep their spaces. */
function tokenize(query: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote = '';
  let inToken = false;
  for (const char of query) {
    if (quote) {
      if (char === quote) {
        quote = '';
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
      inToken = true;
    } else if (/\s/.test(char)) {
      if (inToken) {
        tokens.push(current);
        current = '';
        inToken = false;
      }
    } else {
      current += char;
      inToken = true;
    }
  }
  if (quote) {
    throw new Error(`Missing closing quote (${quote})`);
  }
  if (inToken) {
    tokens.push(current);
  }
  return tokens;
}

/**
 * Parses a variable query. Throws an error, shown in the variable editor, when the query is invalid.
 */
export function parseVariableQuery(query: string): VariableQuery {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    throw new Error('Empty query');
  }
  const type = tokens[0].toLowerCase() as VariableQueryType;
  const allowed = VARIABLE_QUERY_OPTIONS[type];
  if (!allowed) {
    throw new Error(`Unknown query type "${tokens[0]}". Use one of: ${Object.keys(VARIABLE_QUERY_OPTIONS).join(', ')}`);
  }

  const result: VariableQuery = { type, options: {} };
  for (const token of tokens.slice(1)) {
    const equals = token.indexOf('=');
    // a word without "=" before the options is the target; "=" can be part of a quoted target
    if (equals <= 0 || !/^[A-Za-z]+$/.test(token.slice(0, equals))) {
      if (result.target !== undefined || Object.keys(result.options).length > 0) {
        throw new Error(`Unexpected "${token}": options are written as name=value`);
      }
      result.target = token;
      continue;
    }
    const name = allowed.find((option) => option.toLowerCase() === token.slice(0, equals).toLowerCase());
    if (!name) {
      throw new Error(
        `Unknown option "${token.slice(0, equals)}" for ${type}` +
          (allowed.length ? `. Use one of: ${allowed.join(', ')}` : ': it has no options')
      );
    }
    let value = token.slice(equals + 1);
    if (BOOLEAN_OPTIONS.includes(name)) {
      if (!/^(true|false)$/i.test(value)) {
        throw new Error(`${name} must be true or false`);
      }
      value = value.toLowerCase();
    } else if (INTEGER_OPTIONS.includes(name) && !/^(\d+|\$\w+|\$\{[^}]+\})$/.test(value)) {
      throw new Error(`${name} must be a number`);
    } else if (name === 'sortOrder') {
      if (!/^(ascending|descending)$/i.test(value)) {
        throw new Error('sortOrder must be Ascending or Descending');
      }
      value = value[0].toUpperCase() + value.slice(1).toLowerCase();
    }
    result.options[name] = value;
  }

  // elements default to the database of the datasource, attributes need an element
  if (type === 'attributes' && !result.target) {
    throw new Error('attributes need the path of an element, e.g. attributes AFSERVER\\Database\\Element');
  }
  if (type === 'points' && result.target !== undefined) {
    if (result.options.nameFilter !== undefined) {
      throw new Error('Set the point name filter either after "points" or with nameFilter=, not both');
    }
    result.options.nameFilter = result.target;
    result.target = undefined;
  }
  if (result.target !== undefined) {
    result.target = result.target.replace(/^\\+/, '');
  }
  return result;
}
