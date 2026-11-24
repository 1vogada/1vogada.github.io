// Applies the site editor artifact's layout to the repo (run by Claude, not by CI).
//   node scripts/apply-editor.mjs <layout.json>
// layout.json is the editor's db doc `site/layout` (as saved by ArtifactData get with out_dir).
// - writes site.json (categories, items with pages, posts)
// - copies p/page.html to p/<slug>/index.html for every page Ivo writes himself
// - deletes p/<slug>/ folders made from the template whose page is gone
// - prints the "Claude builds it" pages that still need building (custom p/<slug>/index.html)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const L = raw.data || raw;
const projects = new Set(JSON.parse(readFileSync('projects.json', 'utf8')).projects.map((p) => p.name));
const posts = (L.posts || []).map(({ id, title, date, body, draft }) => ({ id, title, date, body, draft: !!draft }));
const postIds = new Set(posts.map((p) => p.id));
const SLUG = /^[a-z0-9][a-z0-9-]{0,60}$/;

const items = [];
for (const it of L.items || []) {
  const [kind, ...rest] = it.key.split(':'); const id = rest.join(':');
  if (kind === 'project' ? !projects.has(id) : !postIds.has(id)) continue;
  const out = { key: it.key, category: it.category || '', pinned: !!it.pinned };
  if (kind === 'project' && it.page && SLUG.test(it.page.slug || '')) {
    out.page = it.page.mode === 'claude' ? { slug: it.page.slug, mode: 'claude' } : { slug: it.page.slug, mode: 'write', body: it.page.body || '' };
  }
  items.push(out);
}
const prev = existsSync('site.json') ? JSON.parse(readFileSync('site.json', 'utf8')) : {};
writeFileSync('site.json', JSON.stringify({ note: prev.note, categories: L.categories || [], items, posts }, null, 2) + '\n');

const template = readFileSync('p/page.html', 'utf8');
const marker = 'Template for pages written in the site editor';
const keep = new Set(items.filter((i) => i.page).map((i) => i.page.slug));
for (const i of items) if (i.page && i.page.mode === 'write') {
  mkdirSync(`p/${i.page.slug}`, { recursive: true });
  writeFileSync(`p/${i.page.slug}/index.html`, template);
}
for (const d of readdirSync('p', { withFileTypes: true })) {
  if (!d.isDirectory() || keep.has(d.name)) continue;
  const f = `p/${d.name}/index.html`;
  if (existsSync(f) && readFileSync(f, 'utf8').includes(marker)) { rmSync(`p/${d.name}`, { recursive: true }); console.log('removed page', d.name); }
  else console.log('left alone (custom page no longer linked):', d.name);
}
for (const it of L.items || []) if (it.page && it.page.mode === 'claude' && keep.has(it.page.slug)) {
  const f = `p/${it.page.slug}/index.html`;
  const custom = existsSync(f) && !readFileSync(f, 'utf8').includes(marker);
  if (!custom || !it.page.built) console.log(`BUILD ${it.key} -> ${f}\n  brief: ${it.page.brief || '(empty)'}`);
}
console.log('site.json written:', items.length, 'items,', posts.length, 'posts');
