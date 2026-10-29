import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.mjs';
const password='test-password-only',secret='test-cookie-secret-32-characters-long';
async function fixture(t){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'shadow-'));const app=createApp({password,secret,dataDir,publicUrl:'http://localhost:3000',noExit:true});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.stop();fs.rmSync(dataDir,{recursive:true,force:true});});
  async function req(route,data,cookie){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:'http://localhost:3000'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  const host=(await req('/api/login',{password})).cookie;
  async function control(action,extra={}){const s=(await req('/api/state',null,host)).body;return req('/api/control',{action,run:s.run,stage:s.stage,commandId:randomUUID(),seconds:30,...extra},host);}
  await control('select',{game:'shadow'});
  const join=async()=>(await req('/api/join',{})).cookie;
  async function vote(cookie,id){const s=(await req('/api/state',null,cookie)).body;const i=s.poll.options.findIndex(o=>o.id===id);return req('/api/vote',{run:s.run,pollId:s.poll.id,option:i},cookie);}
  const state=c=>req('/api/state',null,c).then(r=>r.body);
  return {req,control,join,vote,state,host,base};
}
async function toVote(f){for(let i=0;i<20;i++){const s=await f.state(f.host);if(s.content?.kind==='vote')return s;await f.control(s.phase==='lobby'?'start':'next');}}
test('three votes; the first vote only picks where the fixed circle starts',async t=>{
  const f=await fixture(t);const a=await f.join(),b=await f.join();
  let s=await toVote(f);assert.equal(s.content.title,'Who do you accuse first?');assert.deepEqual(s.poll.options.map(o=>o.id),['seraphine','medi7','corvin','ysolde']);
  assert.equal((await f.control('next')).status,409,'vote first');
  await f.control('open');await f.vote(a,'medi7');await f.vote(b,'medi7');await f.control('close');
  await f.control('next');let acc=(await f.state(a)).content;assert.equal(acc.kind,'accused');assert.match(acc.title,/You accused MEDI-7/);
  assert.ok(s.poll.options[0].tag&&s.poll.options[0].image,'vote tiles carry a tag and a photo');
  const speakers=[];for(let i=0;i<4;i++){await f.control('next');const c=(await f.state(a)).content;assert.equal(c.kind,'speech');speakers.push([c.speaker,c.accused]);}
  assert.deepEqual(speakers,[['medi7','corvin'],['corvin','ysolde'],['ysolde','seraphine'],['seraphine','medi7']]);
  assert.equal((await f.state(a)).evidence.length,4);
  await f.control('next');s=await f.state(f.host);assert.equal(s.poll.id,'accuse2');
  await f.control('open');assert.equal((await f.control('back')).status,409,'no going back once a vote started');await f.vote(a,'seraphine');await f.control('close');
  await f.control('next');assert.match((await f.state(a)).content.title,/Based on the evidence, you accuse Lady Seraphine/);
  await f.control('next');let c=(await f.state(a)).content;assert.deepEqual([c.speaker,c.accused,c.round],['seraphine','medi7',2]);assert.match(c.evidence,/connector/);
  for(let i=0;i<4;i++)await f.control('next');s=await f.state(f.host);assert.equal(s.poll.id,'verdict');assert.equal(s.poll.options.length,6);
  await f.control('open');await f.vote(a,'all');await f.vote(b,'corvin');await f.vote(await f.join(),'all');await f.control('close');
  await f.control('next');c=(await f.state(a)).content;assert.equal(c.kind,'verdict');assert.equal(c.verdict,'all');
  await f.control('next');c=(await f.state(a)).content;assert.equal(c.kind,'timeline');assert.equal(c.timeline.length,4);
  await f.control('next');s=await f.state(a);assert.equal(s.content.kind,'ending');assert.equal(s.finished,true);assert.equal(s.myVerdict.correct,true);
  assert.equal((await f.state(b)).myVerdict.correct,false);assert.equal((await f.control('next')).status,409);
});
test('a tied verdict means "none of them"; votes are hidden until closed',async t=>{
  const f=await fixture(t);const a=await f.join(),b=await f.join();
  for(const poll of ['accuse1','accuse2']){await toVote(f);await f.control('open');await f.control('close');for(let i=0;i<5;i++)await f.control('next');}
  await f.control('next');const s=await toVote(f);assert.equal(s.poll.id,'verdict');await f.control('open');await f.vote(a,'all');await f.vote(b,'ysolde');
  assert.equal((await f.state(a)).poll.counts,undefined);await f.control('close');await f.control('next');
  assert.equal((await f.state(a)).content.verdict,'none');
});
test('the shared screen gets a QR code of the join link',async t=>{
  const f=await fixture(t);const r=await fetch(f.base+'/qr.svg');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/svg/);assert.match(await r.text(),/<svg/);
});
