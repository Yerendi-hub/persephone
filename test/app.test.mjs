import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.mjs';
import {recap} from '../games/persephone/story.mjs';
const password='test-password-only',secret='test-cookie-secret-32-characters-long';
async function fixture(t){const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'persephone-'));let instance,base;
  async function start(){instance=createApp({password,secret,dataDir,publicUrl:'http://localhost:3000',noExit:true});await new Promise(r=>instance.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${instance.server.address().port}`;}
  await start();t.after(async()=>{await instance.stop();fs.rmSync(dataDir,{recursive:true,force:true});});
  async function req(route,data,cookie,origin='http://localhost:3000'){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  const login=await req('/api/login',{password});const host=login.cookie;
  async function control(action,extra={}){const s=(await req('/api/state',null,host)).body;return req('/api/control',{action,run:s.run,stage:s.stage,seconds:30,commandId:randomUUID(),...extra},host);}
  async function join(){return req('/api/join',{});}
  async function raw(route,body){const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3000'},body});return r.status;}
  await control('select',{game:'persephone'});
  return {req,raw,control,join,host,get base(){return base;},dataDir,restart:async()=>{await instance.stop();await start();}};
}
const toVote=async f=>{await f.control('next');await f.control('next');await f.control('next');};
async function vote(f,cookie,label){const s=(await f.req('/api/state',null,cookie)).body;const i=s.poll.options.findIndex(o=>o.id===label);assert.ok(i>=0,label+' offered');return f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:i},cookie);}
test('full story: linked doors, same clues, final vote decides, recap at the end',async t=>{
  const f=await fixture(t);const a=(await f.join()).cookie,b=(await f.join()).cookie;
  await toVote(f);await f.control('open');let s=(await f.req('/api/state',null,a)).body;
  assert.deepEqual(s.poll.options.map(o=>o.id),['medical','hangar','radio','captain']);assert.equal(s.poll.counts,undefined);assert.equal(s.clueNotes,undefined);
  await vote(f,a,'medical');await vote(f,b,'medical');await f.control('close');s=(await f.req('/api/state',null,a)).body;
  assert.equal(s.poll.outcome.id,'medical');assert.match(s.poll.outcome.sealed,/Radio room/);assert.ok(s.poll.outcome.orpheus);assert.equal(s.found.length,1);
  await f.control('next');await f.control('open');s=(await f.req('/api/state',null,a)).body;
  assert.deepEqual(s.poll.options.map(o=>o.id),['hangar','captain'],'radio is sealed, the other pair remains');
  await vote(f,a,'captain');await f.control('close');await f.control('next');
  await f.control('open');await vote(f,a,'laser');await f.control('close');s=(await f.req('/api/state',null,a)).body;assert.equal(s.poll.outcome.image,'canteen');await f.control('next');
  await f.control('open');await vote(f,b,'pipes');await f.control('close');s=(await f.req('/api/state',null,a)).body;assert.equal(s.found.length,4);await f.control('next');
  await f.control('open');await vote(f,a,'destroy');await vote(f,b,'destroy');await f.control('close');
  assert.equal((await f.req('/api/state')).body.poll.outcome,undefined);await f.control('next');
  s=(await f.req('/api/state',null,a)).body;assert.equal(s.finished,true);assert.equal(s.ending,'destroy');assert.deepEqual(s.recap,recap);assert.equal(s.myFinal,'Destroy the Persephone');
  assert.match((await f.req('/api/state',null,f.host)).body.script,/Then — light/);
});
test('hangar first leaves medical and radio; host sees clue notes',async t=>{
  const f=await fixture(t);const a=(await f.join()).cookie;await toVote(f);await f.control('open');
  assert.equal((await f.req('/api/state',null,f.host)).body.clueNotes.hangar,'Clue 2');
  await vote(f,a,'hangar');await f.control('close');await f.control('next');
  assert.deepEqual((await f.req('/api/state')).body.poll.options.map(o=>o.id),['medical','radio']);
  const st=(await f.req('/api/state')).body;assert.equal(st.content.image,'corridor-hangar');assert.equal(st.media.length,13);
  assert.equal((await fetch(f.base+'/img/persephone/corridor-hangar.jpg')).status,200);
});
test('final vote: any tie or no votes means quarantine',async t=>{
  for(const plan of [['destroy','link'],[]]){
    const f=await fixture(t);const voters=await Promise.all(plan.map(()=>f.join()));
    for(let i=0;i<7;i++){await f.control('next');if(i>=2&&i<=5){await f.control('open');await f.control('close');}}
    await f.control('open');for(let i=0;i<plan.length;i++)await vote(f,voters[i].cookie,plan[i]);await f.control('close');await f.control('next');
    assert.equal((await f.req('/api/state')).body.ending,'quarantine');
  }
});
test('authorization, origin, invalid choice, stale controls, idempotency and restart pause',async t=>{
  const f=await fixture(t);assert.equal((await f.req('/api/control',{action:'next'})).status,401);
  assert.equal((await f.req('/api/login',{password},null,'https://evil.example')).status,403);
  assert.equal((await f.req('/api/login',{password:'wrong'})).status,401);
  await toVote(f);await f.control('open');const member=(await f.join()).cookie;
  let s=(await f.req('/api/state')).body;
  assert.equal((await f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:9},member)).status,400);
  assert.equal((await f.req('/api/vote',{run:'old',pollId:s.poll.id,option:0},member)).status,409);
  await f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:0},member);
  const cmd={action:'pause',stage:s.stage,run:s.run,commandId:randomUUID()};
  assert.equal((await f.req('/api/control',cmd,f.host)).status,200);assert.equal((await f.req('/api/control',cmd,f.host)).status,200);
  assert.equal((await f.req('/api/control',{...cmd,action:'resume',commandId:randomUUID()},f.host)).status,409);
  const remaining=(await f.req('/api/state')).body.poll.remaining;await f.restart();s=(await f.req('/api/state',null,member)).body;
  assert.equal(s.paused,true);assert.equal(s.poll.remaining,remaining);assert.equal(s.poll.myVote,0);
  assert.equal((await f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:1},member)).status,409);
  await f.control('resume');await f.restart();s=(await f.req('/api/state')).body;assert.equal(s.paused,true);assert.ok(s.poll.remaining>0);
  await f.control('resume');await f.control('close');await f.control('reset',{confirm:'RESET'});
  assert.equal((await f.req('/api/state',null,member)).body.joined,false);assert.ok(fs.readdirSync(f.dataDir).some(x=>x.startsWith('archive-')));
});
test('200 simultaneous voters, cap, exact totals, SSE and tie rule',async t=>{
  const f=await fixture(t);await toVote(f);await f.control('open');
  const members=await Promise.all(Array.from({length:200},()=>f.join()));assert.ok(members.every(x=>x.status===200));assert.equal((await f.join()).status,409);
  const aborts=Array.from({length:202},()=>new AbortController());
  const streams=await Promise.all(aborts.map(a=>fetch(f.base+'/api/events',{signal:a.signal})));assert.ok(streams.every(r=>r.status===200));
  const s=(await f.req('/api/state')).body;const start=performance.now();
  const results=await Promise.all(members.map((m,i)=>f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:i%2===0?1:3},m.cookie)));
  assert.ok(results.every(x=>x.status===200));const duration=performance.now()-start;t.diagnostic(`200 votes with 202 active SSE streams: ${Math.round(duration)} ms`);assert.ok(duration<5000);aborts.forEach(a=>a.abort());
  await f.control('close');const p=(await f.req('/api/state')).body.poll;assert.equal(p.counts[1],100);assert.equal(p.counts[3],100);assert.equal(p.winner,1,'tie takes the first tied option');
  await f.control('next');await f.control('open');await f.control('close');const q=(await f.req('/api/state')).body.poll;assert.equal(q.total,0);assert.equal(q.winner,0);
});
test('deadline is enforced server-side and closed after recovery',async t=>{
  const f=await fixture(t);await toVote(f);await f.control('open');
  await f.control('pause');let saved=JSON.parse(fs.readFileSync(path.join(f.dataDir,'state.json')));saved.g.polls.door1.remaining=50;fs.writeFileSync(path.join(f.dataDir,'state.json'),JSON.stringify(saved));await f.restart();await f.control('resume');await new Promise(r=>setTimeout(r,300));assert.equal((await f.req('/api/state')).body.poll.status,'closed');
});
test('images are served from a whitelist only',async t=>{
  const f=await fixture(t);const ok=await fetch(f.base+'/img/persephone/medical.jpg');assert.equal(ok.status,200);assert.equal(ok.headers.get('content-type'),'image/jpeg');
  assert.equal((await fetch(f.base+'/img/persephone/../../server.mjs')).status,404);assert.equal((await fetch(f.base+'/img/persephone/nothing.jpg')).status,404);assert.equal((await fetch(f.base+'/img/medical.jpg')).status,404);
});
test('audit: malformed bodies are rejected without stopping the server',async t=>{
  const f=await fixture(t);
  for(const route of ['/api/login','/api/join','/api/vote','/api/control'])for(const body of ['null','[]','42','"x"'])assert.equal(await f.raw(route,body),400,route+' '+body);
  assert.equal((await f.req('/healthz')).status,200);
});
test('audit: mission code is visible only to the host',async t=>{
  const f=await fixture(t);
  assert.equal((await f.req('/api/state')).body.code,undefined);
  const member=(await f.join()).cookie;assert.equal(member.startsWith('persephone='),true);
  assert.equal((await f.req('/api/state',null,member)).body.code,undefined);
  assert.match((await f.req('/api/state',null,f.host)).body.code,/^[0-9A-F]{6}$/);
});
test('join by link only, mid-game, host browser is refused',async t=>{
  const f=await fixture(t);await toVote(f);await f.control('open');
  const late=await f.join();assert.equal(late.status,200);
  const s=(await f.req('/api/state',null,late.cookie)).body;assert.equal(s.joined,true);
  assert.equal((await f.req('/api/vote',{run:s.run,pollId:s.poll.id,option:1},late.cookie)).status,200);
  assert.equal((await f.req('/api/join',{},f.host)).status,409);
  assert.ok((await f.req('/api/state',null,f.host)).body.script,'host stays signed in');
});
