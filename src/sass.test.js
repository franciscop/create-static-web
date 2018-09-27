const { abs, dir, exists, join, name, read, remove, stat, walk, write } = require('fs-array');
const sass = require('./sass');

describe('sass.js', () => {
  it('works', async () => {
    const dest = abs('./demo/stylesheet/style.min.css');
    await remove(dest);
    expect(await exists(dest)).toBe(false);

    const res = await sass();

    expect(await exists(dest)).toBe(true);
    expect(res).toContain(dest);
  });
});
