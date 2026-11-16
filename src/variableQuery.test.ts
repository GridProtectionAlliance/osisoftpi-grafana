import { isVariableQueryLanguage, parseVariableQuery } from './variableQuery';

describe('parseVariableQuery', () => {
  it('parses element searches with options', () => {
    expect(
      parseVariableQuery(
        'elements \\\\AFSIM\\TankControlSim\\SimPlant nameFilter=P* categoryName="Rotating Equipment" ' +
          'searchFullHierarchy=TRUE sortField=Name sortOrder=descending startIndex=0 maxCount=10'
      )
    ).toEqual({
      type: 'elements',
      target: 'AFSIM\\TankControlSim\\SimPlant',
      options: {
        nameFilter: 'P*',
        categoryName: 'Rotating Equipment',
        searchFullHierarchy: 'true',
        sortField: 'Name',
        sortOrder: 'Descending',
        startIndex: '0',
        maxCount: '10',
      },
    });
  });

  it('accepts option names in any case and quoted paths with spaces', () => {
    expect(parseVariableQuery("Attributes 'AF\\DB\\My Unit' NAMEFILTER=Fl* valuetype=Double")).toEqual({
      type: 'attributes',
      target: 'AF\\DB\\My Unit',
      options: { nameFilter: 'Fl*', valueType: 'Double' },
    });
  });

  it('uses the word after points as the name filter', () => {
    expect(parseVariableQuery('points PIT-* maxCount=50')).toEqual({
      type: 'points',
      options: { nameFilter: 'PIT-*', maxCount: '50' },
    });
    expect(parseVariableQuery('points server=PISRV nameFilter=*')).toEqual({
      type: 'points',
      options: { server: 'PISRV', nameFilter: '*' },
    });
  });

  it('keeps template variables', () => {
    expect(parseVariableQuery('attributes AF\\DB\\$unit nameFilter=${attr} maxCount=$max')).toEqual({
      type: 'attributes',
      target: 'AF\\DB\\$unit',
      options: { nameFilter: '${attr}', maxCount: '$max' },
    });
  });

  it('parses queries without target or options', () => {
    expect(parseVariableQuery('servers')).toEqual({ type: 'servers', options: {} });
    expect(parseVariableQuery('databases AFSIM')).toEqual({ type: 'databases', target: 'AFSIM', options: {} });
    expect(parseVariableQuery('elements')).toEqual({ type: 'elements', options: {} });
  });

  it.each([
    ['', 'Empty query'],
    ['tags x', 'Unknown query type "tags"'],
    ['elements AF\\DB color=red', 'Unknown option "color" for elements'],
    ['elements AF\\DB descriptionFilter=x valueType=Double', 'Unknown option "valueType" for elements'],
    ['servers nameFilter=x', 'Unknown option "nameFilter" for servers: it has no options'],
    ['elements AF\\DB searchFullHierarchy=yes', 'searchFullHierarchy must be true or false'],
    ['elements AF\\DB maxCount=ten', 'maxCount must be a number'],
    ['elements AF\\DB sortOrder=up', 'sortOrder must be Ascending or Descending'],
    ['elements AF\\DB nameFilter=x extra', 'Unexpected "extra"'],
    ['elements "AF\\DB', 'Missing closing quote'],
    ['attributes nameFilter=x', 'attributes need the path of an element'],
    ['points A* nameFilter=B*', 'not both'],
  ])('rejects %p', (query, message) => {
    expect(() => parseVariableQuery(query)).toThrow(message);
  });
});

describe('isVariableQueryLanguage', () => {
  it('tells the query language from the JSON queries saved before 6.0', () => {
    expect(isVariableQueryLanguage('elements AF\\DB')).toBe(true);
    expect(isVariableQueryLanguage('{"path": "AF\\\\DB\\\\Element"}')).toBe(false);
    expect(isVariableQueryLanguage('  ')).toBe(false);
    expect(isVariableQueryLanguage({ path: '' })).toBe(false);
  });
});
