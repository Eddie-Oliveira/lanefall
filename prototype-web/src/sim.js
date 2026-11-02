const fs = require('fs');
const src = fs.readFileSync(__dirname + '/engine.js', 'utf8') + '\n' + fs.readFileSync(__dirname + '/ai.js', 'utf8') +
  '\nmodule.exports={newLobby,setTeamSize,startGame,doAction,aiStep,heroes,alive,HEROES,HERO_KEYS};';
const m = { exports: {} }; new Function('module', src)(m);
const E = m.exports;
function run(size, lanes, seedHeroes) {
  const G = E.newLobby('local'); E.setTeamSize(G, size); G.cfg.lanes = lanes;
  G.slots.forEach((s, i) => { s.ctrl = 'ai'; s.hero = seedHeroes[i % seedHeroes.length]; });
  E.startGame(G);
  let steps = 0, errs = 0;
  while (G.phase === 'play' && G.round < 120 && steps < 200000) {
    const h = E.heroes(G, G.turnTeam).find(h => !h.dead && !h.done);
    if (!h) { console.log('stuck?'); break; }
    const a = E.aiStep(G, h); const e = E.doAction(G, a);
    if (e) { errs++; h._e = (h._e || 0) + 1; if (h._e > 2) { E.doAction(G, { t: 'end', id: h.id }); h._e = 0; } if (errs < 6) console.log('err', e, JSON.stringify(a)); }
    steps++;
  }
  const hs = E.heroes(G).map(h => `${E.HEROES[h.hero].n}[${h.team}] L${h.lvl} ${h.kills}/${h.deaths}/${h.assists} items:${h.items.length} g${h.gold}`);
  console.log(`${size}v${size} lanes${lanes}: winner=${G.winner} round=${G.round} steps=${steps} errs=${errs} kills=${G.kills} tlost=${G.tlost} size=${JSON.stringify(G).length}`);
  console.log('  ' + hs.join('\n  '));
}
const H = E.HERO_KEYS;
run(1, 3, ['blademaster', 'pyra']);
run(1, 1, ['frostbow', 'butcher']);
run(2, 3, ['bulwark', 'pyra', 'shade', 'lumen']);
run(3, 3, ['quake', 'frostbow', 'lumen', 'butcher', 'shade', 'pyra']);
run(4, 3, H);
run(4, 1, H);
