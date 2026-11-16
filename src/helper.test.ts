import {
  buildQueryString,
  expandVariableValues,
  firstVariableValue,
  formatVariableValue,
  removeServerPrefix,
} from './helper';

describe('formatVariableValue', () => {
  it('keeps single values unchanged', () => {
    expect(formatVariableValue('SiteA')).toBe('SiteA');
    expect(formatVariableValue(['SiteA'])).toBe('SiteA');
    expect(formatVariableValue(42)).toBe('42');
    expect(formatVariableValue(undefined)).toBe('');
  });

  it('formats multiple values as a group', () => {
    expect(formatVariableValue(['SiteA', 'SiteB'])).toBe('{SiteA,SiteB}');
  });

  it('encodes characters that would break the group', () => {
    expect(formatVariableValue(['Pump 1, North', '50% {max}'])).toBe('{Pump 1%2C North,50%25 %7Bmax%7D}');
  });
});

describe('firstVariableValue', () => {
  it('uses the first value of every group', () => {
    expect(firstVariableValue('\\\\AF\\DB\\{S1,S2}\\{U1,U2}')).toBe('\\\\AF\\DB\\S1\\U1');
  });

  it('decodes the first value', () => {
    expect(firstVariableValue(formatVariableValue(['Pump 1, North', 'Pump 2']))).toBe('Pump 1, North');
  });

  it('keeps single-value groups intact', () => {
    expect(firstVariableValue('{SiteA}')).toBe('SiteA');
  });

  it('keeps paths without groups', () => {
    expect(firstVariableValue('\\\\AF\\DB\\Site')).toBe('\\\\AF\\DB\\Site');
  });
});

describe('expandVariableValues', () => {
  it('gives every combination of the values of the groups', () => {
    expect(expandVariableValues('{A,B}-{1,2}*')).toEqual(['A-1*', 'A-2*', 'B-1*', 'B-2*']);
  });

  it('decodes the values and keeps texts without groups', () => {
    expect(expandVariableValues(formatVariableValue(['T-101.Level', 'Pump 1, North']) + '*')).toEqual([
      'T-101.Level*',
      'Pump 1, North*',
    ]);
    expect(expandVariableValues('SINUSOID')).toEqual(['SINUSOID']);
  });

  it('keeps at most the given number of combinations', () => {
    expect(expandVariableValues('{A,B,C}{1,2,3}', 4)).toEqual(['A1', 'A2', 'A3', 'B1']);
  });
});

describe('buildQueryString', () => {
  it('encodes AF paths so they are not cut at # or &', () => {
    const qs = buildQueryString({ path: '\\\\PIServer\\AFName\\Location\\Machine#1&2 + 50%' });
    expect(qs).toBe('?path=%5C%5CPIServer%5CAFName%5CLocation%5CMachine%231%262%20%2B%2050%25');
    expect(new URLSearchParams(qs).get('path')).toBe('\\\\PIServer\\AFName\\Location\\Machine#1&2 + 50%');
  });

  it('skips empty values', () => {
    expect(buildQueryString({ nameFilter: undefined, maxCount: 100, selectedFields: '' })).toBe('?maxCount=100');
    expect(buildQueryString({})).toBe('');
  });
});

describe('removeServerPrefix', () => {
  it('removes the leading backslashes of a UNC-style target', () => {
    expect(removeServerPrefix('\\\\AFSIM\\DB\\E;Level')).toBe('AFSIM\\DB\\E;Level');
    expect(removeServerPrefix('\\\\PISIM;T-101.Level')).toBe('PISIM;T-101.Level');
  });

  it('keeps targets without the prefix', () => {
    expect(removeServerPrefix('AFSIM\\DB\\E;Level')).toBe('AFSIM\\DB\\E;Level');
    expect(removeServerPrefix('')).toBe('');
  });
});
