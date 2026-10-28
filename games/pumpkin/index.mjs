// Game engine: "The Pumpkin Case" — everybody plays alone on their phone; the host runs the clock and the reveal.
import {fail} from '../../lib/util.mjs';
import {intro,traits,suspects,culprit,steps,puzzles,clues,reveal} from './content.mjs';
import {normalize,similarity,validStroke,bigEnough} from './signature.mjs';

export const id='pumpkin';
export const title='The Pumpkin Case';
export const tagline='Five locked rooms. One smashed pumpkin.';
export const needsName=true;
export const images=['intro','reveal',...suspects.map(s=>s.image),...steps.map(s=>puzzles[s].image),...Object.values(clues).map(c=>c.image)];
const THRESHOLD=Number(process.env.SIGNATURE_THRESHOLD??0.9), CONFIRM=Math.min(THRESHOLD,0.85);
const games=steps.filter(s=>s!=='register');

export const fresh=()=>({phase:'lobby',reveal:0,startedAt:null,endsAt:null,endedAt:null,players:{}});
const player=(g,pid)=>g.players[pid]??=({sig:null,pending:null,sigLeft:3,lastSig:null,results:{},resultAt:{},accused:null,accusedAt:null});
const stepOf=p=>!p.sig?'register':games.find(s=>!p.results[s])??'accuse';
const cluesOf=p=>games.filter(s=>p.results[s]==='won').map(s=>({id:puzzles[s].clue,...clues[puzzles[s].clue]}));

export const recover=()=>false;
export function tick(g){if(g.phase==='play'&&Date.now()>=g.endsAt){g.phase='ended';g.endedAt=Date.now();return 'time up';}return false;}

// Everyone who joined counts as a player, even before their first move.
function overview(g,names,members){
  const blank={results:{},sig:null,accused:null};const ps=members.map(pid=>[pid,g.players[pid]??blank]);
  const done=s=>ps.filter(([,p])=>s==='register'?p.sig:p.results[s]).length;
  const counts=Object.fromEntries(suspects.map(s=>[s.id,ps.filter(([,p])=>p.accused===s.id).length]));
  const board=ps.filter(([,p])=>p.accused===culprit).sort((a,b)=>a[1].accusedAt-b[1].accusedAt).slice(0,5)
    .map(([pid,p])=>({name:names[pid]??'Detective',ms:p.accusedAt-g.startedAt,clues:cluesOf(p).length}));
  return {players:ps.length,steps:steps.map(s=>({id:s,title:puzzles[s].title,done:done(s)})),accused:ps.filter(([,p])=>p.accused).length,counts,board};
}

export function snapshot(g,{who,host,member,names,members}){
  const data={phase:g.phase,reveal:g.reveal,endsAt:g.endsAt,startedAt:g.startedAt,
    intro:{title:intro.title,eyebrow:intro.eyebrow,text:intro.text,emperor:intro.emperor,image:intro.image??'intro'},
    traits,suspects:suspects.map(({id,name,image,motive,traits:t})=>({id,name,image,motive,traits:t})),
    clueTraits:Object.fromEntries(Object.entries(clues).map(([k,c])=>[k,c.trait]))};
  if(member){
    const p=g.players[who.id]??player({players:{}},who.id),step=stepOf(p);
    data.me={step,results:p.results,clues:cluesOf(p),lost:games.filter(s=>p.results[s]==='lost').map(s=>({puzzle:s,title:puzzles[s].title})),
      pending:!!p.pending,sigLeft:p.sigLeft,lastSig:p.lastSig,accused:p.accused,
      last:games.filter(s=>p.results[s]).sort((a,b)=>p.resultAt[b]-p.resultAt[a])[0]??null};
    // A lost puzzle never reveals which evidence it would have given.
    if(data.me.last){const s=data.me.last,won=p.results[s]==='won';data.me.lastResult={puzzle:s,title:puzzles[s].title,won,clue:won?{id:puzzles[s].clue,...clues[puzzles[s].clue]}:null};}
    data.puzzle=step==='accuse'?null:{id:step,...puzzles[step]};
  }
  if(host||g.reveal>=1||!member)data.overview=overview(g,names,members);
  if(member&&g.reveal<1)delete data.overview;
  if(g.reveal>=2){data.reveal_={...reveal,culprit};if(member)data.me.correct=g.players[who.id]?.accused===culprit;}
  if(host){
    data.script=g.reveal>=2?`${reveal.text}\n\n${reveal.explain}`:g.phase==='lobby'?intro.script:g.phase==='play'?'Everybody plays alone. Watch the progress on the screen. Use "+2 min" if many people are close to the end.':'Time is up. Show the results, then reveal the criminal.';
    data.roster=members.map(pid=>names[pid]).filter(Boolean);
    data.table=members.map(pid=>{const p=g.players[pid];return {name:names[pid]??'—',step:p?stepOf(p):'register',clues:p?cluesOf(p).length:0,accused:!!p?.accused};});
  }
  return data;
}

export function action(g,who,b){
  if(g.phase!=='play')fail(409,g.phase==='lobby'?'The game has not started yet.':'Time is up.');
  const p=player(g,who.id),step=stepOf(p);
  const stroke=()=>{if(!validStroke(b.points))fail(400,'Invalid drawing.');return b.points;};
  switch(b.action){
    case 'sigRegister':{if(p.sig)fail(409,'Signature already registered.');const pts=stroke();if(!bigEnough(pts))fail(400,'Draw a bigger shape.');p.pending=normalize(pts);p.lastSig=null;return 'signature drawn';}
    case 'sigConfirm':{if(p.sig||!p.pending)fail(409,'Draw your signature first.');const score=similarity(p.pending,stroke());const ok=score>=CONFIRM;
      p.lastSig={kind:'confirm',score:Math.round(score*100),ok,at:Date.now()};if(ok)p.sig=p.pending;p.pending=null;return ok?'signature registered':'signature mismatch';}
    case 'sigVerify':{if(step!=='vault')fail(409,'The vault is not open yet.');const score=similarity(p.sig,stroke());const ok=score>=THRESHOLD;
      p.lastSig={kind:'verify',score:Math.round(score*100),ok,at:Date.now()};if(ok){p.results.vault='won';p.resultAt.vault=Date.now();}else if(--p.sigLeft<=0){p.results.vault='lost';p.resultAt.vault=Date.now();}return 'vault '+(ok?'opened':'attempt');}
    case 'result':{if(!['memory','matching','pattern','pipes'].includes(b.puzzle)||b.puzzle!==step)fail(409,'This puzzle is not active.');if(typeof b.ok!=='boolean')fail(400,'Invalid result.');
      p.results[b.puzzle]=b.ok?'won':'lost';p.resultAt[b.puzzle]=Date.now();return b.puzzle+(b.ok?' won':' lost');}
    case 'skipVault':{if(step!=='vault')fail(409,'The vault is not open yet.');p.results.vault='lost';p.resultAt.vault=Date.now();return 'vault skipped';}
    case 'accuse':{if(step!=='accuse')fail(409,'Finish the puzzles first.');if(p.accused)fail(409,'You already made your accusation.');if(!suspects.some(s=>s.id===b.suspect))fail(400,'Unknown suspect.');
      p.accused=b.suspect;p.accusedAt=Date.now();return 'accusation';}
    default:fail(400,'Unknown action.');
  }
}

export function control(g,b){
  switch(b.action){
    case 'start':if(g.phase!=='lobby')fail(409,'Already started.');if(![300,480,600,720,900,1200].includes(b.seconds))fail(400,'Choose a valid duration.');g.phase='play';g.startedAt=Date.now();g.endsAt=g.startedAt+b.seconds*1000;return 'start';
    case 'more':if(g.phase!=='play')fail(409,'The game is not running.');g.endsAt+=120000;return '+2 min';
    case 'end':if(g.phase!=='play')fail(409,'The game is not running.');g.phase='ended';g.endedAt=Date.now();return 'end';
    case 'reveal':if(g.phase!=='ended')fail(409,'End the game first.');if(g.reveal>=2)fail(409,'Already revealed.');g.reveal++;return 'reveal '+g.reveal;
    default:fail(400,'Unknown command.');
  }
}
