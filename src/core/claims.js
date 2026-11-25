// Who has hold of a body. Legacy kept this in scattered flags (grab.o, claw.o, o.tug, o.sq, a.prey, o.root); every
// place that read them to ask "may I take this one?" asks claims instead (sevFood, shelfSnack, the catch scan, panic).
// Claims stack: the pointer and the arm can both hold a card during the tug of war. holder() is the newest claim.
//
// claim(body, owner, why) -> release()   owner: 'pointer' | 'hand' | 'sev' | 'root' ...; why: 'drag' | 'tug' | 'crush' | 'target' ...
// holder(body) -> owner | null;  holders(body) -> [{ owner, why }];  isFree(body);  heldBy(body, owner, why?)

export function createClaims() {
  const map = new WeakMap();   // body -> [{ owner, why }]
  function claim(body, owner, why = '') {
    let a = map.get(body); if (!a) map.set(body, a = []);
    const c = { owner, why };
    a.push(c);
    return () => { const l = map.get(body); if (!l) return; const i = l.indexOf(c); if (i >= 0) l.splice(i, 1); };
  }
  const holders = (body) => (map.get(body) || []).map((c) => ({ ...c }));
  const holder = (body) => { const a = map.get(body); return a && a.length ? a[a.length - 1].owner : null; };
  const isFree = (body) => { const a = map.get(body); return !a || !a.length; };
  const heldBy = (body, owner, why) => (map.get(body) || []).some((c) => c.owner === owner && (why == null || c.why === why));
  /** drop every claim on body (it left the world) */
  const clear = (body) => { map.delete(body); };
  return { claim, holder, holders, isFree, heldBy, clear };
}

export const claims = createClaims();
export const { claim, holder, holders, isFree, heldBy, clear } = claims;
export function install() {}
