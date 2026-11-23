// Finds every repo of the owner whose GitHub Pages site has a *.kiripad.dev
// custom domain, skips CA ones, and writes projects.json.
// Needs KIRIPAD_TOKEN (fine-grained PAT: all repos, Metadata + Pages read) to see private repos.
import { writeFileSync, readFileSync } from 'node:fs';

const OWNER = '1vogada';
const DOMAIN = 'kiripad.dev';
const token = process.env.KIRIPAD_TOKEN || process.env.GITHUB_TOKEN;
const hasPat = Boolean(process.env.KIRIPAD_TOKEN);
const isCa = (s) => /(^|[-_.])ca($|[-_.])|ca-?reborn/i.test(s);

async function gh(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (r.status === 404 || r.status === 403) return null;
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

const repos = [];
for (let page = 1; ; page++) {
  const list = hasPat
    ? await gh(`/user/repos?affiliation=owner&per_page=100&page=${page}`)
    : await gh(`/users/${OWNER}/repos?per_page=100&page=${page}`);
  if (!list || !list.length) break;
  repos.push(...list);
}

const found = [];
for (const repo of repos) {
  if (repo.owner.login !== OWNER || !repo.has_pages || repo.archived || isCa(repo.name)) continue;
  const pages = await gh(`/repos/${OWNER}/${repo.name}/pages`);
  const cname = pages?.cname?.toLowerCase();
  if (!cname || cname === DOMAIN || !cname.endsWith(`.${DOMAIN}`) || isCa(cname)) continue;
  found.push({ name: repo.name, url: `https://${cname}/`, description: repo.description || '' });
}

// Without a PAT, private repos are invisible: keep what was listed before instead of dropping it.
if (!hasPat) {
  const old = JSON.parse(readFileSync('projects.json', 'utf8')).projects;
  for (const p of old) if (!found.some((f) => f.url === p.url) && !isCa(p.name)) found.push(p);
}

found.sort((a, b) => a.name.localeCompare(b.name));
const prev = JSON.parse(readFileSync('projects.json', 'utf8'));
if (JSON.stringify(prev.projects) === JSON.stringify(found)) {
  console.log('no change');
} else {
  writeFileSync('projects.json', JSON.stringify({ updated: new Date().toISOString(), projects: found }, null, 2) + '\n');
  console.log('updated', found.map((f) => f.url));
}
