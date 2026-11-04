const fs=require('fs');const d=require('path').join(__dirname,'../src/');
const src=fs.readFileSync(d+'engine.js','utf8')+'\n'+fs.readFileSync(d+'ai.js','utf8')+'\nmodule.exports={canBasic,newLobby,setTeamSize,startGame,startDraft,draftSlot,draftPick,botDraftHero,doAction,aiStep,heroes,HEROES,HERO_KEYS,setMap,abHits,applyAbility,byId,fresh,MAPS};';
const m={exports:{}};new Function('module',src)(m);const E=m.exports;let ok=0,bad=0;const T=(c,n)=>{c?ok++:(bad++,console.log('FAIL',n))};
// draft 4v4: sequence of teams picking and uniqueness, bot roles
for (const n of [1,2,3,4]) {
  const G=E.newLobby('local');E.setTeamSize(G,n);G.slots.forEach(s=>s.ctrl='ai');E.startDraft(G);
  const seq=[];let guard=0;
  while(G.phase==='draft'&&guard++<20){const i=E.draftSlot(G);seq.push(G.slots[i].team);T(!E.draftPick(G,i,E.botDraftHero(G,i)),'pick ok');}
  T(G.phase==='play','game started '+n);
  const hs=G.slots.map(s=>s.hero);T(new Set(hs).size===hs.length,'unique '+n);
  if(n===4){T(seq.join('')==='01100110','4v4 order '+seq.join(''));
    for(const t of [0,1]){const roles=G.slots.filter(s=>s.team===t).map(s=>E.HEROES[s.hero].role);T(new Set(roles).size===4,'distinct roles '+roles)}}
}
{ const G=E.newLobby('local');E.setTeamSize(G,2);E.startDraft(G);const i=E.draftSlot(G);
  T(E.draftPick(G,i===0?1:0,'pyra')!==null,'wrong seat rejected'); E.draftPick(G,i,'pyra'); const j=E.draftSlot(G);
  T(E.draftPick(G,j,'pyra')!==null,'taken rejected'); T(G.slots[j].team===1,'ember picks second'); }
// new hero mechanics smoke: bot games with all 14 heroes
for (const map of ['rift','hollow','bridge']) for (let g=0; g<4; g++) {
  const G=E.newLobby('local');G.cfg.map=map;G.cfg.pick='draft';E.setTeamSize(G,4);G.slots.forEach(s=>s.ctrl='ai');E.startDraft(G);
  while(G.phase==='draft'){const i=E.draftSlot(G);E.draftPick(G,i,E.botDraftHero(G,i));}
  let errs=0,steps=0;const used=new Set();
  while(G.phase==='play'&&G.round<60&&steps<60000){const h=E.heroes(G,G.turnTeam).find(h=>!h.dead&&!h.done);const a=E.aiStep(G,h);if(a.t==='ab')used.add(h.hero+':'+a.k);const e=E.doAction(G,a);if(e){errs++;h._e=(h._e||0)+1;if(h._e>2){E.doAction(G,{t:'end',id:h.id});h._e=0}}steps++}
  T(errs<5,'few errors '+map+' '+errs); T(G.phase==='over','ended '+map+' r'+G.round);
}
// direct mechanic tests
const G=E.newLobby('local');E.setTeamSize(G,2);G.slots[0].hero='stormcaller';G.slots[1].hero='tidesinger';G.slots[2].hero='bramblehorn';G.slots[3].hero='ravager';G.slots.forEach(s=>s.ctrl='human');E.startGame(G);
G.units=G.units.filter(u=>u.kind!=='minion'&&u.kind!=='neutral');
const [St,Ti]=E.heroes(G,0),[Br,Ra]=E.heroes(G,1);
St.x=7;St.y=9;Br.x=8;Br.y=9;Ra.x=9;Ra.y=9;Ti.x=7;Ti.y=11;
G.turnTeam=0;[St,Ti].forEach(h=>{h.done=false;h.acted=false;h.mv=3});
// Gust knockback from St at (7,9) east: Br first hit, pushed 2 east blocked by Ra at 9,9 -> stays at 8? Ra occupies 9,9 so no move
let e=E.doAction(G,{t:'ab',id:St.id,k:'e',x:10,y:9});T(!e,'gust '+e);T(Br.x===8,'knock blocked by unit');
// chain lightning hits Br then Ra
St.acted=false;St.cd.q=0;const hp0=Ra.hp;e=E.doAction(G,{t:'ab',id:St.id,k:'q',x:8,y:9});T(!e,'chain '+e);T(Ra.hp<hp0,'chain jumped');
// tidesinger riptide cleanse + current haste
St.st.stun=1;St.st.slow=1;Ti.acted=false;e=E.doAction(G,{t:'ab',id:Ti.id,k:'w',x:7,y:9});T(!e,'riptide '+e);T(St.st.stun===0&&St.st.slow===0,'cleansed');
Ti.acted=false;const mv0=Ti.mv;e=E.doAction(G,{t:'ab',id:Ti.id,k:'e',x:7,y:11});T(!e,'current '+e);T(Ti.mv===mv0+2,'haste now');
// ravager guillotine missing hp; bramblehorn earthshaker vortex
G.turnTeam=1;[Br,Ra].forEach(h=>{h.done=false;h.acted=false;h.mv=3;h.lvl=3;h.cd.r=0});
St.hp=Math.floor(St.mhp/2);Ra.x=7;Ra.y=8; const before=St.hp; e=E.doAction(G,{t:'ab',id:Ra.id,k:'r',x:7,y:9});T(!e,'guillotine '+e);T(before-St.hp>=E.HEROES.ravager.ab.r.dmg.b,'big hit');
St.dead=false;St.hp=St.mhp;Ti.hp=Ti.mhp;Ti.st=E.fresh();St.st=E.fresh();Ti.x=9;Ti.y=12; St.x=7;St.y=12; Br.x=10;Br.y=13; e=E.doAction(G,{t:'ab',id:Br.id,k:'r',x:8,y:12});T(!e,'earthshaker '+e);
T(Ti.x===8&&Ti.y===12||St.x===8&&St.y===12,'pulled to centre');T(Ti.st.stun===1&&St.st.stun===1,'both stunned');
console.log(ok,'passed',bad,'failed');
if(bad)console.log('dbg', JSON.stringify({St:[St.x,St.y,St.hp,St.st.stun,St.dead],Ti:[Ti.x,Ti.y,Ti.hp,Ti.st.stun],Br:[Br.x,Br.y,Br.lvl,Br.acted]}), G.log.slice(-3).map(l=>l.t));
{ // Q11: LoS for all ranged enemy targeting
  const G2=E.newLobby('local');E.setTeamSize(G2,1);G2.slots[0].hero='frostbow';G2.slots[1].hero='bulwark';E.startGame(G2);E.setMap('rift');
  G2.units=G2.units.filter(u=>u.kind==='hero');const [F]=E.heroes(G2,0),[B]=E.heroes(G2,1);
  F.x=2;F.y=6;B.x=5;B.y=6; T(!E.abHits(G2,F,'q',5,6),'frostbow volley blocked by wall');
  F.x=2;F.y=8;B.x=5;B.y=8; T(!!E.abHits(G2,F,'q',5,8),'frostbow volley clear');
  F.x=4;F.y=5;B.x=4;B.y=7; T(!E.canBasic(G2,F,B),'basic blocked by wall (4,6)');
}
console.log(ok,'passed',bad,'failed');
