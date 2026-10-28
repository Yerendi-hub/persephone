// Game engine: "Night of Shadows" — host-paced story, three room votes, a fixed circle of accusations.
import {fail,top,validIndex} from '../../lib/util.mjs';
import {title as gameTitle,lobby,intro,cabin,suspects,suspectOrder,circle,speeches,evidence,votes,reveal,verdictText} from './content.mjs';

export const id='shadow';
export const title=gameTitle;
export const tagline='One dead baron. Four guests. Nobody left the station.';
export const needsName=false;
export const images=[...new Set([lobby.image,intro.image,cabin.image,reveal.image,'ending',...suspectOrder.map(s=>suspects[s].image)])];

const speechesAfter=(poll,round)=>[0,1,2,3].map(pos=>({k:'speech',poll,round,pos}));
const scenes=[{k:'page',page:intro},{k:'page',page:cabin},...suspectOrder.map(s=>({k:'suspect',id:s})),
  {k:'vote',poll:'accuse1'},...speechesAfter('accuse1',0),{k:'vote',poll:'accuse2'},...speechesAfter('accuse2',1),
  {k:'vote',poll:'verdict'},{k:'verdict'},{k:'timeline'},{k:'ending'}];
const optionsFor=poll=>poll==='verdict'?[...suspectOrder,...votes.verdict.extra.map(e=>e[0])]:suspectOrder;
const labelOf=id=>suspects[id]?.name??votes.verdict.extra.find(e=>e[0]===id)?.[1]??id;

export const fresh=()=>({phase:'lobby',scene:0,polls:{}});
const current=g=>g.phase==='story'?scenes[g.scene]:null;
const record=g=>{const s=current(g);return s?.k==='vote'?g.polls[s.poll]:null;};
const winner=(g,poll)=>{const r=g.polls[poll];return r?.status==='closed'?r.options[r.winner]:null;};
const counts=r=>r.options.map((_,i)=>Object.values(r.votes).filter(v=>v===i).length);
function speakerOf(g,s){const start=circle.indexOf(winner(g,s.poll));const who=circle[(start+s.pos)%4],next=circle[(start+s.pos+1)%4];return {who,next};}
function close(g){const s=current(g),r=record(g);if(!r||r.status!=='open')return false;r.winner=top(counts(r),r.options,votes[s.poll].tie);r.status='closed';r.deadline=null;return 'close '+s.poll;}

export const recover=()=>false;
export function tick(g){const r=record(g);if(r?.status==='open'&&Date.now()>=r.deadline)return close(g);return false;}

function speechContent(g,s){const {who,next}=speakerOf(g,s),sp=speeches[who],round=s.round;
  return {kind:'speech',speaker:who,name:suspects[who].name,image:suspects[who].image,round:round+1,defence:sp.defence[round],accuse:sp.accuse[round],evidence:evidence[next][round],accused:next,accusedName:suspects[next].name};}
function contentOf(g,s){
  if(s.k==='page')return {kind:'page',...s.page};
  if(s.k==='suspect'){const x=suspects[s.id];return {kind:'suspect',id:s.id,eyebrow:`Suspect ${suspectOrder.indexOf(s.id)+1} of 4`,title:x.name,role:x.role,image:x.image,motive:x.motive,alibi:x.alibi};}
  if(s.k==='vote')return {kind:'vote',eyebrow:s.poll==='verdict'?'The verdict':`Accusation ${s.poll==='accuse1'?1:2} of 2`,title:votes[s.poll].question};
  if(s.k==='speech')return speechContent(g,s);
  const v=winner(g,'verdict');
  if(s.k==='verdict')return {kind:'verdict',verdict:v,title:v==='all'?'All four.':v==='none'?'Nobody?':`${labelOf(v)}?`,text:v==='all'?verdictText.all:v==='none'?verdictText.none:verdictText.one(labelOf(v))};
  if(s.k==='timeline')return {kind:'timeline',...reveal,timeline:reveal.timeline.map(([w,t])=>({who:w,name:suspects[w].name,image:suspects[w].image,text:t}))};
  return {kind:'ending',image:'ending',title:'All of them are murderers.',text:`${reveal.truth}\n\n${reveal.ending}`,correct:v==='all'};
}
// Evidence already pointed at in the speeches so far (shown in the players' case file).
const evidenceSoFar=g=>scenes.slice(0,g.scene+1).filter(s=>s.k==='speech').map(s=>{const c=speechContent(g,s);return {who:c.accused,name:c.accusedName,text:c.evidence};});

export function snapshot(g,{who,host,member}){
  const s=current(g),r=record(g);
  const data={phase:g.phase,scene:g.scene,totalScenes:scenes.length,lobby,suspects:suspectOrder.map(id=>({id,...suspects[id]})),finished:g.phase==='story'&&g.scene===scenes.length-1};
  if(s){data.content=contentOf(g,s);data.evidence=evidenceSoFar(g);}
  if(s?.k==='vote'){const ids=r?.options??optionsFor(s.poll),closed=r?.status==='closed';
    data.poll={id:s.poll,question:votes[s.poll].question,status:r?.status??'ready',deadline:r?.deadline,myVote:r?.votes[who?.id]??null,total:Object.keys(r?.votes??{}).length,final:s.poll==='verdict',
      options:ids.map(o=>({id:o,label:labelOf(o)}))};
    if(host||closed)data.poll.counts=counts(r??{options:ids,votes:{}});
    if(closed)data.poll.winner=r.winner;}
  if(member&&g.polls.verdict?.status==='closed'){const v=g.polls.verdict.votes[who.id];data.myVerdict=v===undefined?null:{label:labelOf(g.polls.verdict.options[v]),correct:g.polls.verdict.options[v]==='all'};}
  if(host){
    const c=data.content;
    data.script=!s?'Players see "Wait for the investigation to begin". Press Start when everybody is in.':
      c.kind==='speech'?`${c.name}: "${c.defence} ${c.accuse} ${c.evidence}"`:c.kind==='suspect'?`${c.title}, ${c.role.toLowerCase()}. Motive: ${c.motive} Alibi: "${c.alibi}"`:
      c.kind==='vote'?`${c.title} Open the vote.${s.poll==='verdict'?' Options: any suspect, none of them, or all four. A tie means "none of them".':' The person chosen defends themselves and starts the circle.'}`:
      c.kind==='timeline'?`${c.text}\n\n${c.timeline.map((t,i)=>`${i+1}. ${t.text}`).join('\n')}\n\n${c.autopsy}`:`${c.title}\n\n${c.text}`;
    data.answer='All four. Circle: MEDI-7 → Corvin → Ysolde → Seraphine → MEDI-7.';
  }
  return data;
}

export function action(g,who,b){
  const s=current(g),r=record(g);
  if(s?.k!=='vote'||b.pollId!==s.poll||r?.status!=='open'||Date.now()>=r.deadline)fail(409,'This vote is not open.');
  if(!validIndex(b.option,r.options.length))fail(400,'Invalid option.');
  r.votes[who.id]=b.option;return 'vote '+s.poll;
}

export function control(g,b){
  const s=current(g),r=record(g);
  switch(b.action){
    case 'start':if(g.phase!=='lobby')fail(409,'Already started.');g.phase='story';g.scene=0;return 'start';
    case 'next':if(g.phase!=='story')fail(409,'Start first.');if(s.k==='vote'&&r?.status!=='closed')fail(409,'Complete this vote first.');if(g.scene>=scenes.length-1)fail(409,'This is the end.');g.scene++;return 'next';
    case 'back':if(g.phase!=='story'||g.scene===0)fail(409,'Nothing to go back to.');if(s.k==='vote'&&r)fail(409,'This vote has already started.');if(scenes[g.scene-1].k==='vote')fail(409,'You cannot go back past a vote.');g.scene--;return 'back';
    case 'open':if(s?.k!=='vote'||r)fail(409,'Cannot open this vote.');if(![30,45,60,90].includes(b.seconds))fail(400,'Choose 30, 45, 60 or 90 seconds.');g.polls[s.poll]={status:'open',votes:{},deadline:Date.now()+b.seconds*1000,options:optionsFor(s.poll)};return 'open '+s.poll;
    case 'close':if(r?.status!=='open')fail(409,'No active vote.');return close(g);
    default:fail(400,'Unknown command.');
  }
}
