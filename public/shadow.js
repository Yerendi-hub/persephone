// View: "Night of Shadows" — host-paced scenes, three room votes, the circle of accusations.
import {S,esc,letters,pad,act,control,toTop,figure} from './lib.js';

const portrait=(name,cls='sh-portrait')=>figure(name,cls);
// Without an image the text takes the full width.
const top=(fig,cls,inner)=>`<div class="${cls}${fig?'':' noimg'}">${fig}${inner}</div>`;
function sceneHTML(s){const c=s.content;
  const head=`<div class="steps">NIGHT OF SHADOWS / <b>${pad(s.scene+1)}</b> — ${pad(s.totalScenes)}</div>`;
  const text=(eyebrow,title,body)=>`<div class="scene-text"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${body}</div>`;
  if(c.kind==='page')return head+top(figure(c.image),'scene-top',text(c.eyebrow,c.title,`<p class="lede">${esc(c.text)}</p>`));
  if(c.kind==='suspect')return head+top(portrait(c.image),'sh-suspect',`<div><div class="eyebrow">${esc(c.eyebrow)}</div><h1>${esc(c.title)}</h1><p class="sh-role">${esc(c.role)}</p><p class="lede"><b>Motive:</b> ${esc(c.motive)}</p><div class="quote"><span class="who">ALIBI</span><p>“${esc(c.alibi)}”</p></div></div>`);
  if(c.kind==='speech')return head+top(portrait(c.image),'sh-suspect',`<div><div class="eyebrow">Round ${c.round} · ${esc(c.name)} speaks</div><h1>${esc(c.name)}</h1><div class="quote"><span class="who">${esc(c.name).toUpperCase()}</span><p>“${esc(c.defence)}”</p><p>“${esc(c.accuse)}”</p></div><div class="sh-evidence"><span class="who">EVIDENCE AGAINST ${esc(c.accusedName).toUpperCase()}</span><p>${esc(c.evidence)}</p></div></div>`);
  if(c.kind==='vote')return `${head}<div class="eyebrow">${esc(c.eyebrow)}</div><h1>${esc(c.title)}</h1>`;
  if(c.kind==='verdict')return `${head}<div class="eyebrow">Your verdict</div><h1>${esc(c.title)}</h1><p class="lede">${esc(c.text)}</p><p class="lede">But what really happened? The station’s medical terminal is waking up…</p>`;
  if(c.kind==='timeline')return head+top(figure(c.image),'scene-top',text(c.eyebrow,c.title,`<p class="lede">${esc(c.text)}</p>`))+`<ol class="sh-timeline">${c.timeline.map(t=>`<li>${portrait(t.image,'sh-mini')}<div><b>${esc(t.name)}</b><p>${esc(t.text)}</p></div></li>`).join('')}</ol><p class="sh-autopsy">${esc(c.autopsy)}</p>`;
  return head+top(figure(c.image),'scene-top',text('The end',c.title,`<p class="lede">${esc(c.text)}</p>`));
}
function pollPanel(s,mode){const p=s.poll;if(!p)return '';const closed=p.status==='closed',open=p.status==='open',ctl=mode==='control';
  const status=open?'VOTING OPEN':closed?'VOTING COMPLETE':'WAITING FOR THE HOST';
  const body=closed?p.options.map((o,i)=>`<div class="result"><strong>${i===p.winner?'✓ ':''}${esc(o.label)}</strong><small>${p.counts[i]}</small><progress value="${p.counts[i]}" max="${Math.max(1,p.total)}"></progress></div>`).join('')
    :p.options.map((o,i)=>`<button id="vote-${i}" class="option ${p.myVote===i?'selected':''}" data-vote="${i}" aria-pressed="${p.myVote===i}" ${mode!=='join'||!open||!S.online?'disabled':''}><span class="letter">${letters[i]}</span>${esc(o.label)}${ctl&&p.counts?` <span class="count">· ${p.counts[i]}</span>`:''}</button>`).join('');
  return `<section class="panel ${p.final?'final':''}"><div class="label">${p.final?'THE VERDICT':'VOTE'}</div><p class="poll-title">${esc(p.question)}</p><div class="statusline"><span>${status}</span><span class="timer" id="timer"></span></div>${body}${closed?'':`<p class="muted">${p.total} / ${s.participants} votes${p.final?' · A tie means “None of them”.':''}</p>`}</section>`;}
function caseFile(s){const e=s.evidence??[];if(!e.length)return '';
  return `<details class="panel locker"><summary>EVIDENCE SO FAR · ${e.length}</summary>${e.map(x=>`<p><b>${esc(x.name)}:</b> ${esc(x.text)}</p>`).join('')}</details>`;}
const suspectsBox=s=>`<details class="panel locker"><summary>THE SUSPECTS</summary>${s.suspects.map(x=>`<p><b>${esc(x.name)}</b> — ${esc(x.motive)}</p>`).join('')}</details>`;
const lobbyHTML=s=>top(figure(s.lobby.image),'scene-top',`<div class="scene-text"><div class="eyebrow">Station Wraith</div><h1>${esc(s.lobby.title)}</h1><p class="lede">${esc(s.lobby.text)}</p></div>`);

let lastView='';
export function render(app,mode){const s=S.state;app.dataset.view='shadow';
  const dur=app.querySelector('#duration')?.value;
  const join=`<div class="panel"><div class="label">JOIN</div><p>Open on your phone:</p><div class="join-url">${esc(s.joinUrl.replace(/^https?:\/\//,''))}</div><span class="muted">${s.participants} people connected</span></div>`;
  const main=s.phase==='lobby'?lobbyHTML(s):sceneHTML(s);
  if(mode==='join'){const mine=s.myVerdict&&s.content?.kind==='ending'?`<div class="verdict ${s.myVerdict.correct?'good':'bad'}">${s.myVerdict.correct?'🎉 Your verdict was right: all four.':`✖ Your verdict: ${esc(s.myVerdict.label)}. The answer: all four.`}</div>`:'';
    app.innerHTML=`<div class="join">${mine}${main}${pollPanel(s,mode)}${s.phase==='story'?caseFile(s)+suspectsBox(s):''}</div>`;}
  if(mode==='screen')app.innerHTML=`<div class="layout"><section>${main}</section><aside class="stack">${pollPanel(s,mode)}${join}</aside></div>`;
  if(mode==='control'){const c=s.content,p=s.poll;
    const btns=s.phase==='lobby'?'<button class="primary" data-ctl="start">Start →</button>'
      :`${s.scene>0&&c.kind!=='vote'?'<button data-ctl="back">← Back</button>':''}${p?.status==='ready'?`<label for="duration">Vote duration</label><select id="duration"><option value="45">45 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="90">90 seconds</option></select><button class="primary" data-ctl="open">Open vote</button>`:''}${p?.status==='open'?'<button data-ctl="close">Close now</button>':''}${s.finished?'<p class="muted">The end.</p>':`<button class="primary" data-ctl="next" ${p&&p.status!=='closed'?'disabled':''}>Next →</button>`}`;
    app.innerHTML=`<div class="control-layout"><section>${main}<div class="panel"><h3>READ ALOUD</h3><p class="script">${esc(s.script)}</p></div></section><aside class="stack"><div class="panel"><div class="label">HOST CONSOLE</div><p class="muted">${s.participants} / ${s.maxParticipants} people · join link: ${esc(s.joinUrl)}</p><div class="actions">${btns}</div><p class="muted">${esc(s.answer)}</p></div>${pollPanel(s,mode)}</aside></div>`;
    if(dur&&app.querySelector('#duration'))app.querySelector('#duration').value=dur;}
  const view=`${s.run}-${s.phase}-${s.scene}-${s.poll?.status==='closed'}`;if(view!==lastView&&mode!=='control'){if(lastView)toTop();lastView=view;}
  app.querySelectorAll('[data-vote]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;act({pollId:s.poll.id,option:Number(el.dataset.vote)});}));
  app.querySelectorAll('[data-ctl]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;control(el.dataset.ctl,{seconds:Number(app.querySelector('#duration')?.value)});}));
}
export function tick(){const s=S.state,p=s.poll,t=document.querySelector('#timer');if(t)t.textContent=p?.status==='open'?`${Math.max(0,Math.ceil((p.deadline-(Date.now()+S.offset))/1000))}s`:'';}
