/**
 * render.js — renderiza os slides de um ou mais posts em JPEG 1080x1350.
 *
 * Entrada: variável de ambiente PAYLOAD (JSON), no formato:
 *   { "posts": [ { "id": "post-2026-07-13", "slides": [ {...}, {...} ] }, ... ] }
 *
 * Saída: posts/<id>/slide-<k>.jpg  (k começa em 1)
 *
 * Uso local:  PAYLOAD='{"posts":[...]}'  node render.js
 * No CI:      o workflow injeta PAYLOAD a partir do client_payload do dispatch.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUT_ROOT = path.join(__dirname, '..', 'posts'); // repo/posts/<id>/slide-k.jpg
const RENDER_HTML = 'file://' + path.join(__dirname, 'render.html');
const W = 1080, H = 1350;
const JPEG_QUALITY = 90;

function readPayload() {
  const raw = process.env.PAYLOAD;
  if (!raw) throw new Error('PAYLOAD vazio. Passe o JSON via variável de ambiente PAYLOAD.');
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { throw new Error('PAYLOAD não é JSON válido: ' + e.message); }
  const posts = Array.isArray(data) ? data : data.posts;
  if (!Array.isArray(posts) || !posts.length) throw new Error('PAYLOAD sem posts.');
  for (const p of posts) {
    if (!p.id || !/^[A-Za-z0-9._-]+$/.test(p.id)) throw new Error('id inválido: ' + p.id);
    if (!Array.isArray(p.slides) || !p.slides.length) throw new Error('post sem slides: ' + p.id);
  }
  return posts;
}

async function renderPost(browser, post) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(RENDER_HTML, { waitUntil: 'networkidle0' });

  // injeta os slides e renderiza
  const count = await page.evaluate((slides) => {
    window.__POST__ = { slides };
    return window.renderPost();
  }, post.slides);

  // garante fontes carregadas antes do screenshot
  await page.evaluate(async () => { await document.fonts.ready; });
  await new Promise(r => setTimeout(r, 250));

  const dir = path.join(OUT_ROOT, post.id);
  fs.mkdirSync(dir, { recursive: true });

  const handles = await page.$$('#render-root .slide');
  if (handles.length !== count) {
    console.warn(`[${post.id}] esperava ${count} slides, achei ${handles.length}`);
  }

  const urls = [];
  for (let i = 0; i < handles.length; i++) {
    const file = path.join(dir, `slide-${i + 1}.jpg`);
    await handles[i].screenshot({ path: file, type: 'jpeg', quality: JPEG_QUALITY });
    urls.push(`posts/${post.id}/slide-${i + 1}.jpg`);
    console.log('  ->', file);
  }
  await page.close();
  return urls;
}

(async () => {
  const posts = readPayload();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb']
  });
  try {
    const manifest = {};
    for (const post of posts) {
      console.log('Renderizando', post.id, `(${post.slides.length} slides)`);
      manifest[post.id] = await renderPost(browser, post);
    }
    fs.writeFileSync(path.join(OUT_ROOT, 'last-render.json'),
      JSON.stringify(manifest, null, 2));
    console.log('OK. Manifesto em posts/last-render.json');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error('FALHOU:', err.message); process.exit(1); });
