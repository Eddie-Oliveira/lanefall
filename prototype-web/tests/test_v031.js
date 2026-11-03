const fs=require('fs');const d=require('path').join(__dirname,'../src/');
const src=fs.readFileSync(d+'engine.js','utf8')+'\n'+fs.readFileSync(d+'ai.js','utf8')+'\nmodule.exports={newLobby,setTeamSize,startGame,doAction,heroes,hasLOS,setMap,abTargetTiles,canBasic,applyAbility,byId,G0:null};';
const m={exports:{}};new Function('module',src)(m);const E=m.exports;let ok=0,bad=0;const T=(c,n)=>{c?ok++:(bad++,console.log('FAIL',n))};
E.setMap('rift');
// rift wall at (3,5),(3,6),(4,6): LOS from (2,6) to (5,6) blocked; (2,8)->(5,8) clear
T(!E.hasLOS({x:2,y:6},{x:5,y:6}),'blocked'); T(E.hasLOS({x:2,y:8},{x:5,y:8}),'clear'); T(E.hasLOS({x:5,y:5},{x:5,y:5}),'self');
// game: pyra vs shade
const G=E.newLobby('local');E.setTeamSize(G,1);G.slots[0].hero='pyra';G.slots[1].hero='shade';G.slots.forEach(s=>s.ctrl='human');E.startGame(G);
const P=E.heroes(G,0)[0],S=E.heroes(G,1)[0];
// clear board of minions near
G.units=G.units.filter(u=>u.kind!=='minion');
P.x=2;P.y=6;S.x=5;S.y=6;S.team=1;G.turnTeam=0;P.done=false;P.acted=false;
T(!E.canBasic(G,P,S),'pyra basic blocked by wall?');  // dist 3 > rng2 anyway
const tiles=E.abTargetTiles(G,P,'r'); T(!tiles.some(t=>t.x===5&&t.y===6),'pyroblast blocked by wall');
P.x=2;P.y=8;S.x=5;S.y=8; T(E.abTargetTiles(G,P,'r').some(t=>t.x===5&&t.y===8),'pyroblast clear');
// Fireball tiles behind wall excluded
P.x=2;P.y=6; const fb=E.abTargetTiles(G,P,'q'); T(!fb.some(t=>t.x===5&&t.y===6),'fireball behind wall excluded'); T(fb.some(t=>t.x===2&&t.y===9),'fireball open tile ok');
// Shade reset: shuriken kills a low minion -> acted false
G.turnTeam=1;S.done=false;S.acted=false;S.x=4;S.y=9;
G.units.push({id:G.nid++,kind:'minion',mtype:'melee',team:0,lane:1,wp:5,x:6,y:9,hp:1,mhp:8,atk:3,rng:1,arm:0,res:0,st:{stun:0,slow:0,root:0,silence:0,burn:null},buffs:[],shield:0});
let e=E.doAction(G,{t:'ab',id:S.id,k:"q",x:6,y:9}); T(!e,'shuriken ok '+e); T(S.acted===false,'reset after kill'); T(S.cd.q>0,'cooldown still set');
G.units.push({id:G.nid++,kind:'minion',mtype:'melee',team:0,lane:1,wp:5,x:4,y:12,hp:20,mhp:20,atk:3,rng:1,arm:0,res:0,st:{stun:0,slow:0,root:0,silence:0,burn:null},buffs:[],shield:0});
e=E.doAction(G,{t:'ab',id:S.id,k:"w",x:4,y:12}); T(!e,'step ok '+e); T(S.acted===true,'no reset without kill');
// execute 20%
S.acted=false;S.cd.r=0;S.lvl=3;P.x=S.x+1;P.y=S.y; P.team=0; P.hp=Math.floor(P.mhp*0.5); // 50%: Death Mark dmg 5+atk ~ 10 vs hp
console.log('pyra hp',P.hp,P.mhp);
console.log(ok,'passed',bad,'failed');
