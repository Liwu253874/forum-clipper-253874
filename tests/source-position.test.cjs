const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../content.js'), 'utf8');

async function render(position, clipOverrides = {}) {
  const clip = { pageTitle: 'Example article', pageUrl: 'https://www.zhihu.com/question/1/answer/2',
    extractedFullText: 'Article body', extractedMeta: { siteName: 'Zhihu', byline: 'Author' }, ...clipOverrides };
  const fields = Object.fromEntries(['#postForm', 'input[name="title"]', '#messageTextArea', 'input[name="about_link"]'].map(key => [key, { value: '' }]));
  let removed = false;
  const context = vm.createContext({ URL, console, setTimeout,
    location: { origin: 'https://www.253874.net', pathname: '/post', href: 'https://www.253874.net/post' },
    document: { querySelector: selector => fields[selector] || null },
    chrome: { storage: {
      sync: { get: async defaults => ({ ...defaults, ...(position === undefined ? {} : { sourceInfoPosition: position }) }) },
      local: { get: async () => ({ lastClip: clip }), remove: async () => { removed = true; } },
      onChanged: { addListener() {} }
    }, runtime: { onMessage: { addListener() {} } } }
  });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(removed, true);
  return { body: fields['#messageTextArea'].value, link: fields['input[name="about_link"]'].value };
}

test('default and invalid preferences keep source and URL above the article', async () => {
  for (const position of [undefined, 'top', 'invalid']) {
    const { body } = await render(position);
    assert.ok(body.indexOf('Example article') < body.indexOf('Article body'));
    assert.ok(body.includes('https://www.zhihu.com/question/1/answer/2'));
  }
});

test('bottom retains attribution, omits source URL and preserves related link', async () => {
  const { body, link } = await render('bottom');
  assert.ok(body.startsWith('Article body\n\n'));
  assert.ok(body.includes('Example article'));
  assert.ok(body.includes('Zhihu'));
  assert.ok(body.endsWith('Author'));
  assert.ok(!body.includes('https://'));
  assert.equal(link, 'https://www.zhihu.com/question/1/answer/2');
});

test('selection takes priority and its own links are preserved', async () => {
  const { body } = await render('bottom', { selectionText: 'Selected https://example.org' });
  assert.ok(body.startsWith('Selected https://example.org\n\n'));
  assert.ok(!body.includes('Article body'));
});

test('missing body and metadata do not introduce a URL or undefined fields', async () => {
  const { body } = await render('bottom', { extractedFullText: '', extractedMeta: {} });
  assert.ok(!body.includes('https://'));
  assert.ok(!body.includes('undefined'));
  assert.ok(body.endsWith('Example article'));
});

test('video content is unchanged in both modes', async () => {
  for (const position of ['top', 'bottom']) {
    const { body } = await render(position, { isVideo: true, videoEmbedCode: '<embed src="video">' });
    assert.equal(body, '<embed src="video">');
  }
});
