// cut-off hand behaviour "walk": walking: looks around 4x a second for food (hunt) and the blade (flee); crawl / run / sneak / scuttle / stroll; crush when on a card; rest when tired.
// STUB: legacy SEV.walk. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'walk', {
  pose: 'walk',
  up: true,
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
