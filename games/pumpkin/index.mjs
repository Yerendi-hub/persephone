// Game engine: "The Pumpkin Case" — everybody plays alone on their phone; the host runs the clock and the reveal.
import {fail} from '../../lib/util.mjs';
import {lobby,story,script,confirmSymbol,traits,suspects,culprit,steps,puzzles,clues,reveal} from './content.mjs';
import {normalize,similarity,validStroke,bigEnough} from './signature.mjs';

export const id='pumpkin';
export const title='The Pumpkin Case';
export const tagline='Five locked rooms. One smashed pumpkin.';
export const needsName=true;
export const images=[lobby.image,...story.map(s=>s.image),'reveal',...suspects.map(s=>s.image),...steps.map(s=>puzzles[s].image),...Object.values(clues).map(c=>c.image)];
// Share of the symbol shape that must match (players never see the number).
const THRESHOLD=Number(process.env.SIGNATURE_THRESHOLD??0.5);
const games=steps.filter(s=>s!=='register');
const ALL=['story',...steps];

export const fresh=()=>({phase:'lobby',reveal:0,startedAt:null,endsAt:null,endedAt:null,players:{}});
const blank=()=>({story:false,sig:null,pending:null,sigLeft:3,lastSig:null,results:{},resultAt:{},accused:null,accusedAt:null});
const player=(g,pid)=>g.players[pid]??=blank();
const stepOf=p=>!p.story?'story':!p.sig?'register':games.find(s=>!p.results[s])??'accuse';
const clueOf=s=>({id:puzzles[s].clue,...clues[puzzles[s].clue]});
const cluesOf=p=>games.filter(s=>p.results[s]==='won').map(clueOf);

export const recover=()=>false;
export function tick(g){if(g.phase==='play'&&Date.now()>=g.endsAt){g.phase='ended';g.endedAt=Date.now();return 'time up';}return false;}

// Everyone who joined counts as a player, even before their first move.
function overview(g,names,members){
  const ps=members.map(pid=>[pid,g.players[pid]??blank()]);
  const done=s=>ps.filter(([,p])=>s==='story'?p.story:s==='register'?p.sig:p.results[s]).length;
  const counts=Object.fromEntries(suspects.map(s=>[s.id,ps.filter(([,p])=>p.accused===s.id).length]));
  const board=ps.filter(([,p])=>p.accused===culprit).sort((a,b)=>a[1].accusedAt-b[1].accusedAt).slice(0,5)
    .map(([pid,p])=>({name:names[pid]??'Detective',ms:p.accusedAt-g.startedAt,clues:cluesOf(p).length}));
  return {players:ps.length,steps:ALL.map(s=>({id:s,done:done(s)})),accused:ps.filter(([,p])=>p.accused).length,counts,board};
}

export function snapshot(g,{who,host,member,names,members}){
  const data={phase:g.phase,reveal:g.reveal,endsAt:g.endsAt,startedAt:g.startedAt,lobby,story,traits,
    suspects:suspects.map(({id,name,image,motive,traits:t})=>({id,name,image,motive,traits:t}))};
  if(member){
    const p=g.players[who.id]??blank(),step=stepOf(p);
    data.me={step,results:p.results,clues:cluesOf(p),pending:!!p.pending,sigLeft:p.sigLeft,accused:p.accused,
      lastSig:p.lastSig&&{kind:p.lastSig.kind,ok:p.lastSig.ok,at:p.lastSig.at},
      // One slot per puzzle, in order; a lost slot never says which evidence it was.
      evidence:games.map(s=>p.results[s]==='won'?{state:'won',...clueOf(s)}:{state:p.results[s]??'open'}),
      last:games.filter(s=>p.results[s]).sort((a,b)=>p.resultAt[b]-p.resultAt[a])[0]??null};
    if(data.me.last){const s=data.me.last,won=p.results[s]==='won';data.me.lastResult={puzzle:s,title:puzzles[s].title,won,clue:won?clueOf(s):null};}
    data.puzzle=['story','accuse'].includes(step)?null:{id:step,...puzzles[step],confirm:confirmSymbol};
  }
  if(host||g.reveal>=1||!member)data.overview=overview(g,names,members);
  if(g.reveal>=2){data.reveal_={...reveal,culprit};if(member)data.me.correct=g.players[who.id]?.accused===culprit;}
  if(host){
    data.script=g.reveal>=2?`${reveal.text}\n\n${reveal.explain}`:g.phase==='lobby'?script:g.phase==='play'?'Everybody plays alone: briefing, five puzzles, accusation. Watch the progress on the screen. Use "+2 min" if many people are close to the end.':'Time is up. Show the results, then reveal the criminal.';
    data.roster=members.map(pid=>names[pid]).filter(Boolean);
    data.table=members.map(pid=>{const p=g.players[pid];return {name:names[pid]??'—',step:p?stepOf(p):'story',clues:p?cluesOf(p).length:0,accused:!!p?.accused};});
  }
  return data;
}

export function action(g,who,b){
  if(g.phase!=='play')fail(409,g.phase==='lobby'?'The game has not started yet.':'Time is up.');
  const p=player(g,who.id),step=stepOf(p);
  const stroke=()=>{if(!validStroke(b.points))fail(400,'Invalid drawing.');return b.points;};
  switch(b.action){
    case 'story':p.story=true;return 'briefing done';
    case 'sigRegister':{if(step!=='register')fail(409,'Finish the briefing first.');if(p.pending&&confirmSymbol)fail(409,'Draw it again to confirm.');const pts=stroke();if(!bigEnough(pts))fail(400,'Draw a bigger shape.');
      if(confirmSymbol){p.pending=normalize(pts);p.lastSig=null;return 'symbol drawn';}
      p.sig=normalize(pts);p.lastSig={kind:'register',ok:true,at:Date.now()};return 'symbol registered';}
    case 'sigConfirm':{if(p.sig||!p.pending)fail(409,'Draw your symbol first.');const ok=similarity(p.pending,stroke())>=THRESHOLD;
      p.lastSig={kind:'confirm',ok,at:Date.now()};if(ok)p.sig=p.pending;p.pending=null;return ok?'symbol registered':'symbol mismatch';}
    case 'sigVerify':{if(step!=='vault')fail(409,'The vault is not open yet.');const ok=similarity(p.sig,stroke())>=THRESHOLD;
      p.lastSig={kind:'verify',ok,at:Date.now()};if(ok){p.results.vault='won';p.resultAt.vault=Date.now();}else if(--p.sigLeft<=0){p.results.vault='lost';p.resultAt.vault=Date.now();}return 'vault '+(ok?'opened':'attempt');}
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
