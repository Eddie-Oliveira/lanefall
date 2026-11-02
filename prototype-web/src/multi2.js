const fs=require('fs');
const src=fs.readFileSync('engine.js','utf8')+'\n'+fs.readFileSync('ai.js','utf8')+'\nmodule.exports={newLobby,setTeamSize,startGame,doAction,aiStep,heroes,HERO_KEYS,MAP_KEYS,MAPS,setMap,isWall,K};';
const m={exports:{}};new Function('module',src)(m);const E=m.exports;
// map sanity: lanes, towers, camps not on walls
for(const id of E.MAP_KEYS){const M=E.MAPS[id];const bad=[];const chk=(p,w)=>{if(M.wall.has(E.K(p.x,p.y)))bad.push(w+' '+p.x+','+p.y)};
 M.lanes.forEach((l,i)=>l.forEach(p=>chk(p,'lane'+i)));M.towers.flat().forEach(p=>chk(p,'tower'));M.camps.forEach(p=>chk(p,'camp'));M.relics.forEach(p=>chk(p,'relic'));M.altars.forEach(p=>chk(p,'altar'));M.cores.forEach(p=>chk(p,'core'));
 // lane continuity
 M.lanes.forEach((l,i)=>{for(let j=1;j<l.length;j++){if(Math.max(Math.abs(l[j].x-l[j-1].x),Math.abs(l[j].y-l[j-1].y))!==1)bad.push('gap lane'+i+' at '+j)}});
 console.log(id,'towers',M.towers.map(t=>t.map(p=>p.x+','+p.y+'L'+p.lane+'T'+p.tier).join(' ')).join(' | '),'bad',bad);}
function run(map,size){const G=E.newLobby('local');G.cfg.map=map;G.cfg.random=E.MAPS[map].rules.random;E.setTeamSize(G,size);
G.slots.forEach(s=>s.ctrl='ai');E.startGame(G);let st=0,errs=0,el=[];
while(G.phase==='play'&&G.round<80&&st<300000){const h=E.heroes(G,G.turnTeam).find(h=>!h.dead&&!h.done);const a=E.aiStep(G,h);const e=E.doAction(G,a);if(e){errs++;if(el.length<3)el.push(e+' '+a.t);h._e=(h._e||0)+1;if(h._e>2){E.doAction(G,{t:'end',id:h.id});h._e=0}}st++}
const alt=(G.altars||[]).map(a=>a.owner).join('');const q=G.log.filter(l=>/Spider Queen|relic|captured/.test(l.t)).length;
return `${G.round}(${G.kills[0]+G.kills[1]}k${G.tlost[0]+G.tlost[1]}t w${G.winner} e${errs}${el.length?' '+el.join('/'):''} obj${q})`}
for(const [map,size] of [['rift',2],['hollow',3],['hollow',2],['hollow',1],['bridge',4],['bridge',2],['bridge',1]]){const rs=[];for(let i=0;i<6;i++)rs.push(run(map,size));console.log(map,size+'v'+size,rs.join(' '))}
