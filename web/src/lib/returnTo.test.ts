import {describe, expect, it} from 'vitest';

import {safeReturnTo} from './returnTo';

describe('safeReturnTo', () => {
  it('accepts a local bookmark deep link', () => {
    expect(safeReturnTo('/bookmarks/abc123')).toBe('/bookmarks/abc123');
  });

  it.each([
    ['https://evil.example', '/graph'],
    ['//evil.example/path', '/graph'],
    ['/\\evil.example', '/graph'],
    ['javascript:alert(1)', '/graph'],
    ['', '/graph'],
    [null, '/graph'],
  ])('rejects unsafe return path %s', (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
