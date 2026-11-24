// Builds projects.json: every fun or useful repo of the owner, CA excluded.
// - repo whose Pages site has a *.kiripad.dev domain -> that subdomain
// - repo with Pages but no own domain -> https://kiripad.dev/<repo>/
// - public repo without Pages -> its GitHub page
// Private repos without a site are skipped (the list is public).
// Needs KIRIPAD_TOKEN (fine-grained PAT: all repos, Metadata + Pages read) to see private repos
// and custom domains; without it, entries it can't see are kept from the previous run.
import { writeFileSync, readFileSync } from 'node:fs';

const OWNER = '1vogada';
const DOMAIN = 'kiripad.dev';
// Not projects: the directory itself, internal plumbing, the old copy of Cybertale,
// and repos Ivo asked to hide (24 Nov 2026: sde-project, testzavalkata, hakaton2025).
const SKIP = new Set(['1vogada.github.io', 'hive-plugins', 'test', 'claude-skills', 'claude-handoff', 'DSH-Test',
  'sde-project', 'testzavalkata', 'hakaton2025']);
// Descriptions for repos whose GitHub description is empty or unhelpful.
const DESCRIPTIONS = {
  apiTest: 'League of Legends match history lookup on the Riot API (bring your own API key)',
};
const token = process.env.KIRIPAD_TOKEN;
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
  const list = token
    ? await gh(`/user/repos?affiliation=owner&per_page=100&page=${page}`)
    : await gh(`/users/${OWNER}/repos?per_page=100&page=${page}`);
  if (!list || !list.length) break;
  repos.push(...list);
}

const found = [];
for (const repo of repos) {
  if (repo.owner.login !== OWNER || repo.fork || repo.archived || SKIP.has(repo.name) || isCa(repo.name)) continue;
  let url = null;
  if (repo.has_pages) {
    const pages = token ? await gh(`/repos/${OWNER}/${repo.name}/pages`) : null;
    const cname = pages?.cname?.toLowerCase();
    if (cname && isCa(cname)) continue;
    url = cname && cname.endsWith(DOMAIN) ? `https://${cname}/` : `https://${DOMAIN}/${repo.name}/`;
  } else if (!repo.private) {
    url = repo.html_url;
  }
  if (!url) continue;
  found.push({ name: repo.name, url, description: repo.description || '', code: repo.private ? null : repo.html_url });
}

// Keep entries this run could not see (private repos without a token, or hand-added ones).
const prev = JSON.parse(readFileSync('projects.json', 'utf8'));
const seen = new Set(repos.map((r) => r.name));
for (const p of prev.projects) {
  if (!found.some((f) => f.name === p.name) && (!seen.has(p.name) || !token) && !isCa(p.name) && !SKIP.has(p.name)) found.push(p);
}

for (const f of found) if (DESCRIPTIONS[f.name]) f.description = DESCRIPTIONS[f.name];
found.sort((a, b) => a.name.localeCompare(b.name));
if (JSON.stringify(prev.projects) === JSON.stringify(found)) {
  console.log('no change');
} else {
  writeFileSync('projects.json', JSON.stringify({ updated: new Date().toISOString(), projects: found }, null, 2) + '\n');
  console.log('updated', found.map((f) => f.url));
}
