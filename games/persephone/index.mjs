// Game engine: "Silence on the Persephone" — the room votes together on every step.
import {scenes,endings,options,sealed,recap,truth} from './story.mjs';
import {fail,top,validIndex} from '../../lib/util.mjs';

export const id='persephone';
export const title='Silence on the Persephone';
export const tagline='A ship computer that really wants to help.';
export const needsName=false;
export const images=['approach','canteen','captain','corridor','corridor-medical','corridor-radio','corridor-hangar','corridor-captain','decision','hangar','medical','radio','service-bay'];
const clueScenes=['door1','door2','canteen','path'];

export const fresh=()=>({scene:0,paused:false,polls:{},startedAt:null,pausedAt:null,pauseMs:0,endedAt:null});
const active=g=>scenes[g.scene]?.poll;
const record=g=>active(g)?g.polls[active(g).id]:null;
const winnerOf=(g,pid)=>{const r=g.polls[pid];return r?.status==='closed'?r.options[r.winner]:undefined;};
const won=g=>Object.fromEntries(Object.keys(g.polls).map(pid=>[pid,winnerOf(g,pid)]));
const choicesNow=(g,p)=>record(g)?.options??p.choices(won(g));
const counts=(g,p,r)=>{const ids=r?.options??choicesNow(g,p),votes=Object.values(r?.votes??{});return ids.map((_,i)=>votes.filter(v=>v===i).length);};
const ending=g=>winnerOf(g,'final');
const outcomeOf=(pid,oid)=>{const o=options[oid];return {id:oid,title:o.title,image:o.image,text:o.text,orpheus:o.orpheus,sealed:pid==='door1'?sealed[oid]:pid==='door2'?'As SCOUT goes in, the other door locks behind it.':null};};
function close(g){const p=active(g),r=record(g);if(!r||r.status!=='open')return false;r.winner=top(counts(g,p,r),r.options,p.tie);r.status='closed';r.deadline=null;r.remaining=0;return 'close '+p.id;}

// Recovery never silently consumes the rest of an open vote.
export function recover(g){if(g.startedAt&&g.scene<scenes.length&&!g.paused){const r=record(g);if(r?.status==='open'){r.remaining=Math.max(0,r.deadline-Date.now());r.deadline=null;}g.paused=true;g.pausedAt=Date.now();return true;}return false;}
export function tick(g){if(!g.paused&&record(g)?.status==='open'&&Date.now()>=record(g).deadline)return close(g);return false;}

export function snapshot(g,{who,host,member}){
  const s=scenes[g.scene],p=active(g),r=record(g),finished=g.scene===scenes.length;
  const data={scene:g.scene,totalScenes:scenes.length,paused:g.paused,elapsedMs:g.startedAt?((g.endedAt??g.pausedAt??Date.now())-g.startedAt-g.pauseMs):0,finished,hint:null};
  data.found=clueScenes.filter(pid=>winnerOf(g,pid)).map(pid=>outcomeOf(pid,winnerOf(g,pid)));
  if(s)data.content={id:s.id,title:s.title,eyebrow:s.eyebrow,text:s.text,image:typeof s.image==='function'?s.image(won(g)):s.image,orpheus:s.orpheus};
  else{const e=endings[ending(g)]??endings.quarantine;data.content={title:e.title,eyebrow:e.eyebrow,text:e.text,image:e.image};data.ending=ending(g)??'quarantine';data.recap=recap;data.truth=truth;
    if(member){const v=g.polls.final?.votes[who.id];data.myFinal=v===undefined?null:options[g.polls.final.options[v]].label;}}
  if(p){
    const ids=choicesNow(g,p),closed=r?.status==='closed';
    data.poll={id:p.id,question:p.question,status:r?.status??'ready',deadline:r?.deadline,remaining:r?.remaining,myVote:r?.votes[who?.id]??null,total:Object.keys(r?.votes??{}).length,final:p.id==='final',options:ids.map(oid=>({id:oid,label:options[oid].label}))};
    if(host||closed)data.poll.counts=counts(g,p,r);
    if(closed){data.poll.winner=r.winner;if(p.id!=='final')data.poll.outcome=outcomeOf(p.id,ids[r.winner]);}
  }
  if(host){
    data.results=g.polls;const o=data.poll?.outcome;
    data.script=!s?data.content.text:o?`${o.text}${o.sealed?`\n\n${o.sealed}`:''}${o.orpheus?`\n\nORPHEUS: "${o.orpheus}"`:''}`:s.script;
    if(p&&p.id!=='final')data.clueNotes=Object.fromEntries(choicesNow(g,p).map(oid=>[oid,`Clue ${options[oid].clue}`]));
  }
  return data;
}

export function action(g,who,b){
  const p=active(g),r=record(g);
  if(b.pollId!==p?.id||g.paused||r?.status!=='open'||Date.now()>=r.deadline)fail(409,'This vote is not open.');
  if(!validIndex(b.option,r.options.length))fail(400,'Invalid option.');
  r.votes[who.id]=b.option;return 'vote '+p.id;
}

export function control(g,b){
  const r=record(g);
  switch(b.action){
    case 'next':if(g.paused)fail(409,'Resume first.');if(active(g)&&r?.status!=='closed')fail(409,'Complete this vote first.');if(g.scene>=scenes.length)fail(409,'Mission complete.');if(!g.startedAt)g.startedAt=Date.now();g.scene++;if(g.scene===scenes.length)g.endedAt=Date.now();return 'next';
    case 'open':if(g.paused||!active(g)||r)fail(409,'Cannot open this vote.');if(![30,45,60,90,120].includes(b.seconds))fail(400,'Choose 30, 45, 60, 90 or 120 seconds.');g.polls[active(g).id]={status:'open',votes:{},deadline:Date.now()+b.seconds*1000,remaining:0,options:active(g).choices(won(g))};return 'open';
    case 'close':if(g.paused||r?.status!=='open')fail(409,'No active vote.');return close(g);
    case 'pause':if(g.paused||!g.startedAt)fail(409,'Cannot pause.');g.paused=true;g.pausedAt=Date.now();if(r?.status==='open'){r.remaining=Math.max(0,r.deadline-Date.now());r.deadline=null;}return 'pause';
    case 'resume':if(!g.paused)fail(409,'Not paused.');g.pauseMs+=Date.now()-g.pausedAt;g.pausedAt=null;g.paused=false;if(r?.status==='open')r.deadline=Date.now()+r.remaining;return 'resume';
    default:fail(400,'Unknown command.');
  }
}
