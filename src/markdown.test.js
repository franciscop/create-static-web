const { abs, dir, exists, join, name, read, remove, stat, walk, write } = require('fs-array');
const markdown = require('./markdown');

describe('markdown.js', () => {
  it('works', async () => {
    const dest = abs('./demo/content/index.html');
    await remove(dest);
    expect(await exists(dest)).toBe(false);

    const res = await markdown();

    expect(await exists(dest)).toBe(true);
    expect(res).toContain(dest);
  });
});
