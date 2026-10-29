// View: "Silence on the Persephone" (collective voting).
import {S,esc,letters,pad,act,control,toTop,figure,joinBox} from './lib.js';
const img=name=>figure(name);
const orpheus=t=>t?`<div class="orpheus"><span class="who">ORPHEUS</span><p>“${esc(t)}”</p></div>`:'';
function outcomeBlock(o){return `<div class="scene-top">${img(o.image)}<div class="scene-text"><div class="eyebrow">SCOUT found</div><h1>${esc(o.title)}</h1><p class="lede">${esc(o.text)}</p>${o.sealed?`<p class="sealed">${esc(o.sealed)}</p>`:''}</div></div>${orpheus(o.orpheus)}`;}
function scene(){const st=S.state,c=st.content,o=st.poll?.outcome;
  const head=`${st.paused?'<div class="paused">MISSION PAUSED · Your votes are safe.</div>':''}<div class="steps">PERSEPHONE / <b>${pad(st.scene)}</b> — ${pad(st.totalScenes)}</div>`;
  if(o)return head+outcomeBlock(o);
  return `${head}<div class="scene-top">${img(c.image)}<div class="scene-text"><div class="eyebrow">${esc(c.eyebrow)}</div><h1>${esc(c.title)}</h1><p class="lede">${esc(c.text)}</p></div></div>${orpheus(c.orpheus)}`;}
function pollPanel(mode){const st=S.state,p=st.poll;if(!p)return st.finished?'':`<div class="panel"><div class="label">MISSION LINK</div><p>Stand by. Listen to Mission Control.</p></div>`;
  const closed=p.status==='closed',open=p.status==='open',ctl=mode==='control';
  const status=open?(st.paused?'PAUSED':'VOTING OPEN'):closed?'VOTING COMPLETE':'WAITING';
  const body=closed?p.options.map((o,i)=>`<div class="result"><strong>${i===p.winner?'✓ ':''}${esc(o.label)}</strong><small>${p.counts[i]}</small><progress value="${p.counts[i]}" max="${Math.max(1,p.total)}"></progress></div>`).join('')
    :p.options.map((o,i)=>`<button id="vote-${i}" class="option ${p.myVote===i?'selected':''}" data-vote="${i}" aria-pressed="${p.myVote===i}" ${mode!=='join'||!st.joined||!open||st.paused||!S.online?'disabled':''}><span class="letter">${letters[i]}</span>${esc(o.label)}${ctl&&st.clueNotes?` <span class="count">${esc(st.clueNotes[o.id])}</span>`:''}${ctl&&p.counts?` <span class="count">· ${p.counts[i]}</span>`:''}</button>`).join('');
  return `<section class="panel ${p.final?'final':''}"><div class="label">${p.final?'THE LAST VOTE':'VOTE'}</div><p class="poll-title">${esc(p.question)}</p><div class="statusline"><span>${status}</span><span class="timer" id="timer"></span></div>${body}${closed?'':`<p class="muted">${p.total} / ${st.participants} votes${p.myVote!==null&&open?` · Your vote: ${letters[p.myVote]}`:''}${p.final?' · A tie means quarantine.':''}</p>`}</section>`;}
function locker(){const st=S.state,f=(st.found||[]).filter(o=>o.id!==st.poll?.outcome?.id);if(!f.length)return '';
  return `<section class="panel locker"><div class="label">WHAT SCOUT FOUND · ${st.found.length} / 4</div>${f.map(o=>`<details><summary>${esc(o.title)}</summary><p>${esc(o.text)}</p>${orpheus(o.orpheus)}</details>`).join('')}</section>`;}
function recap(){const st=S.state;if(!st.recap)return '';return `<section class="panel"><div class="label">WHAT SCOUT FOUND</div><ol class="recap">${st.recap.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="lede">${esc(st.truth)}</p></section>`;}
let lastView='';
export function render(app,mode){const st=S.state,p=st.poll;
  const openDetails=[...app.querySelectorAll('.locker details')].map(d=>d.open);const dur=app.querySelector('#duration')?.value;
  if(mode==='join')app.innerHTML=`<div class="join">${st.finished?`${scene()}${st.myFinal?`<div class="panel"><div class="label">YOUR VOTE</div><p class="lede">${esc(st.myFinal)}</p></div>`:''}${recap()}`:`${scene()}${pollPanel(mode)}${locker()}`}</div>`;
  if(mode==='screen')app.innerHTML=`<div class="layout"><section>${scene()}</section><aside class="stack">${st.finished?recap():pollPanel(mode)}${joinBox("people")}</aside></div>`;
  if(mode==='control')app.innerHTML=`<div class="control-layout"><section>${scene()}<div class="panel"><h3>READ ALOUD</h3><p class="script">${esc(st.script)}</p></div>${st.finished?recap():''}</section><aside class="stack"><div class="panel"><div class="label">HOST CONSOLE</div><div class="statusline"><span>ELAPSED</span><span id="elapsed"></span></div><p class="muted">${st.participants} / ${st.maxParticipants} people · join link: ${esc(st.joinUrl)}</p>${p&&p.status==='ready'?`<label for="duration">Vote duration</label><select id="duration"><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select>`:''}<div class="actions"><button class="primary" data-ctl="next" ${st.finished||st.paused||(p&&p.status!=='closed')?'disabled':''}>${st.scene===0?'Start mission':'Next scene'} →</button>${p?.status==='ready'?'<button data-ctl="open">Open vote</button>':''}${p?.status==='open'?`<button data-ctl="close" ${st.paused?'disabled':''}>Close now</button>`:''}${st.scene>0&&!st.finished?`<button data-ctl="${st.paused?'resume':'pause'}">${st.paused?'Resume':'Pause mission'}</button>`:''}</div><p class="muted">The most-voted option wins. Ties choose the first option (final vote: quarantine). Linked doors: Medical ↔ Radio, Hangar ↔ Captain.</p></div>${pollPanel(mode)}</aside></div>`;
  if(dur&&app.querySelector('#duration'))app.querySelector('#duration').value=dur;
  app.querySelectorAll('.locker details').forEach((d,i)=>{if(openDetails[i])d.open=true;});
  const view=`${st.run}-${st.scene}-${p?.status==='closed'}`;if(view!==lastView&&mode!=='control'){if(lastView)toTop();lastView=view;}
  app.querySelectorAll('[data-vote]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;act({pollId:st.poll.id,option:Number(el.dataset.vote)});}));
  app.querySelectorAll('[data-ctl]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;control(el.dataset.ctl,{seconds:Number(app.querySelector('#duration')?.value)});}));
}
export function tick(){const st=S.state,p=st.poll,off=S.offset;
  const t=document.querySelector('#timer');if(t)t.textContent=p?.status==='open'?`${Math.max(0,Math.ceil((st.paused?p.remaining:p.deadline-(Date.now()+off))/1000))}s`:'';
  const el=document.querySelector('#elapsed');if(el){const sec=Math.floor((st.elapsedMs+(st.paused||st.finished?0:Date.now()+off-st.serverNow))/1000);el.textContent=`${pad(Math.floor(sec/60))}:${pad(sec%60)}`;}}
