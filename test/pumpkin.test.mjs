import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.mjs';
const password='test-password-only',secret='test-cookie-secret-32-characters-long';
const circle=(r=.4,dx=0)=>Array.from({length:60},(_,i)=>[.5+dx+r*Math.cos(i/59*2*Math.PI),.5+r*Math.sin(i/59*2*Math.PI)]);
const zigzag=Array.from({length:40},(_,i)=>[.1+i/50,i%8<4?.2:.7]);
async function fixture(t){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'pumpkin-'));const app=createApp({password,secret,dataDir,publicUrl:'http://localhost:3000',noExit:true});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.stop();fs.rmSync(dataDir,{recursive:true,force:true});});
  async function req(route,data,cookie){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:'http://localhost:3000'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  const host=(await req('/api/login',{password})).cookie;
  async function control(action,extra={}){const s=(await req('/api/state',null,host)).body;return req('/api/control',{action,run:s.run,stage:s.stage,commandId:randomUUID(),...extra},host);}
  async function join(name){const c=(await req('/api/join',{})).cookie;if(name)assert.equal((await req('/api/name',{name},c)).status,200);return c;}
  async function act(cookie,data){const s=(await req('/api/state',null,cookie)).body;return req('/api/act',{run:s.run,...data},cookie);}
  return {req,control,join,act,host};
}
test('neutral lobby until the host chooses a game; media only for the chosen game',async t=>{
  const f=await fixture(t);let s=(await f.req('/api/state')).body;assert.equal(s.game,null);assert.deepEqual(s.media,[]);
  const c=await f.join();assert.equal((await f.req('/api/state',null,c)).body.joined,true);
  assert.equal((await f.control('select',{game:'pumpkin'})).status,200);s=(await f.req('/api/state',null,c)).body;
  assert.equal(s.game,'pumpkin');assert.equal(s.joined,false,'everyone re-joins after a game change');assert.equal(s.needsName,true);
  assert.ok(s.media.every(m=>m.startsWith('/img/pumpkin/')));
  assert.equal((await f.control('select',{game:'nope'})).status,400);
  assert.equal((await f.control('select',{game:null})).status,200);assert.equal((await f.req('/api/state')).body.game,null);
});
test('nicknames: required, validated, unique, kept across game changes',async t=>{
  const f=await fixture(t);await f.control('select',{game:'pumpkin'});const a=await f.join();
  assert.equal((await f.act(a,{action:'sigRegister',points:circle()})).status,409,'name first');
  assert.equal((await f.req('/api/name',{name:'x'},a)).status,400);assert.equal((await f.req('/api/name',{name:'Dark Helmet'},a)).status,200);
  const b=await f.join();assert.equal((await f.req('/api/name',{name:'dark helmet'},b)).status,409);
  await f.control('select',{game:'persephone'});await f.control('select',{game:'pumpkin'});await f.req('/api/join',{},a);
  assert.equal((await f.req('/api/state',null,a)).body.name,'Dark Helmet');
});
test('full case: signature, puzzles in order, vault, accusation, reveal and leaderboard',async t=>{
  const f=await fixture(t);await f.control('select',{game:'pumpkin'});const a=await f.join('Ace'),b=await f.join('Bob');
  assert.equal((await f.act(a,{action:'sigRegister',points:circle()})).status,409,'not started');
  assert.equal((await f.control('start',{seconds:720})).status,200);
  let s=(await f.req('/api/state',null,a)).body;assert.equal(s.me.step,'story');
  assert.equal((await f.act(a,{action:'sigRegister',points:circle()})).status,409,'briefing first');await f.act(a,{action:'story'});assert.equal(s.overview,undefined,'players do not get live stats');
  assert.equal((await f.act(a,{action:'sigRegister',points:[[.5,.5],[.51,.5],[.5,.51],[.5,.5],[.5,.5],[.5,.5],[.5,.5],[.5,.5]]})).status,400,'too small');
  await f.act(a,{action:'sigRegister',points:circle()});s=(await f.act(a,{action:'sigConfirm',points:zigzag})).body;
  assert.equal(s.me.lastSig.ok,false);assert.equal(s.me.step,'register');assert.equal(s.me.pending,false,'mismatch restarts registration');
  await f.act(a,{action:'sigRegister',points:circle()});s=(await f.act(a,{action:'sigConfirm',points:circle(.3,.1)})).body;assert.equal(s.me.lastSig.ok,true);assert.equal(s.me.step,'memory');
  assert.equal((await f.act(a,{action:'result',puzzle:'pattern',ok:true})).status,409,'order is enforced');
  for(const [puzzle,ok] of [['memory',true],['matching',true],['pattern',false],['pipes',true]])assert.equal((await f.act(a,{action:'result',puzzle,ok})).status,200);
  s=(await f.req('/api/state',null,a)).body;assert.equal(s.me.step,'vault');assert.deepEqual(s.me.clues.map(c=>c.id),['mud','cookie','neat']);assert.deepEqual(s.me.evidence.map(e=>e.state),['won','won','lost','won','open']);assert.equal(JSON.stringify(s.me).includes('Cape fibers'),false,'lost evidence stays secret');
  s=(await f.act(a,{action:'sigVerify',points:zigzag})).body;assert.equal(s.me.sigLeft,2);assert.equal(s.me.lastSig.ok,false);
  s=(await f.act(a,{action:'sigVerify',points:circle(.2,-.1)})).body;assert.equal(s.me.lastSig.ok,true);assert.equal(s.me.step,'accuse');assert.equal(s.me.clues.length,4);
  assert.equal((await f.act(a,{action:'accuse',suspect:'yoda'})).status,400);
  assert.equal((await f.act(a,{action:'accuse',suspect:'rex'})).status,200);assert.equal((await f.act(a,{action:'accuse',suspect:'vader'})).status,409);
  assert.equal((await f.act(b,{action:'accuse',suspect:'vader'})).status,409,'cannot accuse before finishing');
  const host=(await f.req('/api/state',null,f.host)).body;assert.equal(host.overview.accused,1);assert.equal(host.table.find(r=>r.name==='Ace').accused,true);
  assert.equal((await f.control('reveal')).status,409,'end first');await f.control('end');
  assert.equal((await f.act(b,{action:'sigRegister',points:circle()})).status,409,'time is up');
  await f.control('reveal');s=(await f.req('/api/state',null,a)).body;assert.equal(s.overview.counts.rex,1);assert.equal(s.reveal_,undefined);
  await f.control('reveal');s=(await f.req('/api/state',null,a)).body;assert.equal(s.reveal_.culprit,'rex');assert.equal(s.me.correct,true);assert.equal(s.overview.board[0].name,'Ace');assert.equal(s.overview.board[0].clues,4);
});
test('three failed vault attempts lose the clue; skipping is possible',async t=>{
  const f=await fixture(t);await f.control('select',{game:'pumpkin'});const a=await f.join('Ann');await f.control('start',{seconds:600});await f.act(a,{action:'story'});
  await f.act(a,{action:'sigRegister',points:circle()});await f.act(a,{action:'sigConfirm',points:circle()});
  for(const puzzle of ['memory','matching','pattern','pipes'])await f.act(a,{action:'result',puzzle,ok:false});
  for(let i=0;i<3;i++)await f.act(a,{action:'sigVerify',points:zigzag});
  const s=(await f.req('/api/state',null,a)).body;assert.equal(s.me.step,'accuse');assert.equal(s.me.clues.length,0);assert.ok(s.me.evidence.every(e=>e.state==='lost'&&!e.trait));
});
test('clue logic: any four clues point to Rex only',async()=>{
  const {suspects,clues,culprit}=await import('../games/pumpkin/content.mjs');const all=Object.values(clues).map(c=>c.trait);
  for(let skip=0;skip<all.length;skip++){const got=all.filter((_,i)=>i!==skip);const fit=suspects.filter(s=>got.every(tr=>s.traits.some(x=>x[0]===tr))).map(s=>s.id);assert.deepEqual(fit,[culprit]);}
  const three=[all[1],all[3],all[4]];assert.ok(suspects.filter(s=>three.every(tr=>s.traits.some(x=>x[0]===tr))).length>1,'three clues can leave two suspects');
});
