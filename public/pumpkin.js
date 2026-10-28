// View: "The Pumpkin Case" — solo puzzles on each phone; the shared screen shows the clock, progress and the reveal.
import {S,esc,act,control,toTop,figure,mmss,now,armed} from './lib.js';

const STEP_NAMES={register:'Detective symbol',memory:'Lights',matching:'Forensic droid',pattern:'Terminal',pipes:'MOP-3 power',vault:'Evidence vault',accuse:'Accusation'};
const ORDER=['register','memory','matching','pattern','pipes','vault'];
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const icon=t=>S.state.traits[t]?.icon??'?';
// Per-browser memory (which results were acknowledged, briefing page); falls back to memory if storage is blocked.
const mem={};
const load=(k,d)=>{try{const v=sessionStorage.getItem(k);return v===null?(mem[k]??d):JSON.parse(v);}catch{return mem[k]??d;}};
const store=(k,v)=>{mem[k]=v;try{sessionStorage.setItem(k,JSON.stringify(v));}catch{}};
const seenKey=()=>`pk-seen-${S.state.run}`;
const seen=()=>new Set(load(seenKey(),[]));
const markSeen=id=>store(seenKey(),[...seen(),id]);

// ---------- shared pieces ----------
const clueCard=c=>`<div class="clue"><span class="clue-icon">${icon(c.trait)}</span><div><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div></div>`;
function evidenceRow(me){return `<div class="evrow">${me.evidence.map(e=>e.state==='won'?`<div class="ev won" title="${esc(e.title)}">${icon(e.trait)}</div>`:e.state==='lost'?'<div class="ev lost" title="Evidence lost">✖</div>':'<div class="ev open">?</div>').join('')}</div>`;}
function cards(s,{pick=false,highlight=null}={}){return `<div class="cards">${s.suspects.map(x=>`<div class="card ${pick?'pickable':''}" data-suspect="${x.id}" ${pick?'role="button" tabindex="0"':''}><div class="card-icons">${x.traits.map(([t])=>`<span class="${highlight?(highlight.has(t)?'hit':'miss'):''}">${icon(t)}</span>`).join('')}</div>${figure(x.image,'card-img')}<b>${esc(x.name)}</b>${pick?'<div class="card-confirm"><p>Are you sure?</p><div><button type="button" class="yes" aria-label="Yes, accuse">✓</button><button type="button" class="no" aria-label="No">✗</button></div></div>':''}</div>`).join('')}</div>`;}
const suspectsPanel=()=>`<details class="panel locker"><summary>THE SUSPECTS</summary>${cards(S.state)}</details>`;

// ---------- puzzle components (each mounts into a container and calls finish(ok) once) ----------
function symbolPad(el,{onSubmit}){
  el.innerHTML=`<div class="sigwrap"><canvas class="sigpad" aria-label="Drawing pad"></canvas><div class="actions"><button type="button" class="clear">Clear</button><button type="button" class="primary submit" disabled>Done</button></div></div>`;
  const c=el.querySelector('canvas'),ctx=c.getContext('2d');let pts=[],drawing=false;
  const fit=()=>{const r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=10;ctx.lineCap=ctx.lineJoin='round';ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue('--acid').trim()||'#ffa94d';};fit();
  const pos=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
  const redraw=()=>{const r=c.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*r.width,y*r.height):ctx.moveTo(x*r.width,y*r.height));ctx.stroke();};
  c.addEventListener('pointerdown',e=>{e.preventDefault();c.setPointerCapture(e.pointerId);drawing=true;pts=[pos(e)];redraw();});
  c.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e),l=pts[pts.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])>0.004){pts.push(p);redraw();}});
  const end=()=>{if(!drawing)return;drawing=false;el.querySelector('.submit').disabled=pts.length<8;};
  c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
  el.querySelector('.clear').onclick=()=>{pts=[];redraw();el.querySelector('.submit').disabled=true;};
  el.querySelector('.submit').onclick=e=>{e.target.disabled=true;const step=Math.max(1,Math.ceil(pts.length/200));onSubmit(pts.filter((_,i)=>i%step===0||i===pts.length-1).map(([x,y])=>[+x.toFixed(4),+y.toFixed(4)]));};
}

function memory(el,cfg,finish){
  let attempts=cfg.attempts,level=0,seq=[],pos=0,busy=true;const max=cfg.levels.at(-1);
  const seqFor=()=>{const s=[];while(s.length<max){const n=cfg.symbols[Math.floor(Math.random()*cfg.symbols.length)];if(n!==s.at(-1))s.push(n);}return s;};
  el.innerHTML=`<div class="memory"><div class="mem-show" aria-live="polite">?</div><p class="mem-status">Ready? You will see ${cfg.levels[0]} symbols.</p><div class="mem-entered"></div><div class="mem-pad">${cfg.symbols.map(s=>`<button type="button" data-sym="${s}" disabled>${s}</button>`).join('')}</div><button type="button" class="primary mem-start">Start</button></div>`;
  const show=el.querySelector('.mem-show'),status=el.querySelector('.mem-status'),entered=el.querySelector('.mem-entered'),pad=[...el.querySelectorAll('[data-sym]')];
  const lock=v=>{busy=v;pad.forEach(b=>b.disabled=v);};
  async function play(){lock(true);pos=0;entered.textContent='';const L=cfg.levels[level];status.textContent=`Watch: ${L} symbols.`;
    for(let i=0;i<L;i++){show.textContent='';await wait(250);show.textContent=seq[i];show.classList.add('pop');await wait(800);show.classList.remove('pop');}
    show.textContent='?';status.textContent=`Now tap the ${L} symbols in order.`;lock(false);}
  el.querySelector('.mem-start').onclick=e=>{e.target.remove();seq=seqFor();play();};
  pad.forEach(b=>b.onclick=async()=>{if(busy)return;const L=cfg.levels[level];
    if(b.dataset.sym===seq[pos]){pos++;entered.textContent+=b.dataset.sym;
      if(pos===L){lock(true);if(level===cfg.levels.length-1){status.textContent=`All ${L} correct!`;await wait(600);return finish(true);}level++;status.textContent=`Correct! Next: ${cfg.levels[level]} symbols.`;await wait(1100);play();}}
    else{lock(true);attempts--;if(attempts<=0){status.textContent='Wrong symbol. No attempts left.';await wait(900);return finish(false);}
      status.textContent=`Wrong symbol! Attempts left: ${attempts}. Watch again.`;await wait(1500);play();}});
}

// Two columns side by side (no scrolling): tap a description, then the thing it describes. Pairs share a colour and number.
function matching(el,cfg,finish){
  const left=cfg.pairs.map(p=>p[0]),answer=cfg.pairs.map(p=>p[1]),right=shuffle([...answer,...cfg.decoys]);
  const pick={};let active=0;
  el.innerHTML=`<div class="match2"><div class="mcol">${left.map((t,i)=>`<button type="button" class="m-left c${i}" data-l="${i}"><span class="m-n">${i+1}</span><span>${esc(t)}</span></button>`).join('')}</div><div class="mcol">${right.map((t,i)=>`<button type="button" class="m-right" data-r="${i}"><span class="m-n"></span><span>${esc(t)}</span></button>`).join('')}</div></div><button type="button" class="primary m-check" disabled>Check (only once)</button>`;
  const draw=()=>{el.querySelectorAll('.m-left').forEach(b=>{const i=+b.dataset.l;b.classList.toggle('active',active===i);b.classList.toggle('done',pick[i]!==undefined);});
    el.querySelectorAll('.m-right').forEach(b=>{const r=+b.dataset.r,who=Object.keys(pick).find(k=>pick[k]===r);b.className='m-right'+(who!==undefined?` used c${who}`:'');b.querySelector('.m-n').textContent=who!==undefined?String(+who+1):'';});
    el.querySelector('.m-check').disabled=Object.keys(pick).length<left.length;};
  el.querySelectorAll('.m-left').forEach(b=>b.onclick=()=>{active=+b.dataset.l;draw();});
  el.querySelectorAll('.m-right').forEach(b=>b.onclick=()=>{if(active===null)return;const r=+b.dataset.r;for(const k of Object.keys(pick))if(pick[k]===r)delete pick[k];pick[active]=r;
    const next=left.findIndex((_,i)=>pick[i]===undefined);active=next>=0?next:null;draw();});
  el.querySelector('.m-check').onclick=async e=>{e.target.disabled=true;el.querySelectorAll('button').forEach(b=>b.disabled=true);let ok=true;
    el.querySelectorAll('.m-left').forEach(b=>{const i=+b.dataset.l,good=right[pick[i]]===answer[i];ok&&=good;b.classList.add(good?'good':'bad');if(!good)b.insertAdjacentHTML('beforeend',`<small>✔ ${esc(answer[i])}</small>`);});
    await wait(ok?900:3500);finish(ok);};
  draw();
}

function pattern(el,cfg,finish){
  let attempts=cfg.attempts,path=[],down=false,locked=false;
  el.innerHTML=`<div class="pattern"><div class="pat-grid">${cfg.cells.map(([e,l],i)=>`<div class="pat-cell" data-i="${i}"><span>${e}</span><small>${esc(l)}</small></div>`).join('')}<svg class="pat-lines" viewBox="0 0 300 300" preserveAspectRatio="none"></svg></div><p class="pat-status">Tries left: ${attempts}</p></div>`;
  const grid=el.querySelector('.pat-grid'),svg=el.querySelector('svg'),status=el.querySelector('.pat-status'),cells=[...el.querySelectorAll('.pat-cell')];
  const center=i=>[50+100*(i%3),50+100*Math.floor(i/3)];
  const draw=extra=>{const pts=path.map(center);if(extra)pts.push(extra);svg.innerHTML=pts.length>1?`<polyline points="${pts.map(p=>p.join(',')).join(' ')}"/>`:'';cells.forEach((c,i)=>c.classList.toggle('on',path.includes(i)));};
  const at=e=>{const r=grid.getBoundingClientRect();return [(e.clientX-r.left)/r.width*300,(e.clientY-r.top)/r.height*300];};
  const hit=([x,y])=>{if(x<0||y<0||x>=300||y>=300)return -1;const i=Math.floor(x/100)+3*Math.floor(y/100);const [cx,cy]=center(i);return Math.hypot(x-cx,y-cy)<38?i:-1;};
  grid.addEventListener('pointerdown',e=>{e.preventDefault();if(locked)return;grid.setPointerCapture(e.pointerId);down=true;path=[];const i=hit(at(e));if(i>=0)path.push(i);draw();});
  grid.addEventListener('pointermove',e=>{if(!down)return;const p=at(e),i=hit(p);if(i>=0&&!path.includes(i))path.push(i);draw(p);});
  const up=async()=>{if(!down)return;down=false;draw();if(path.length<2){path=[];draw();return;}
    const a=cfg.answer,ok=path.join()===a.join()||path.join()===[...a].reverse().join();locked=true;
    if(ok){grid.classList.add('good');status.textContent='Unlocked!';await wait(900);return finish(true);}
    attempts--;grid.classList.add('bad');status.textContent=attempts>0?`Wrong pattern. Tries left: ${attempts}`:'Wrong pattern. The terminal locks.';await wait(900);grid.classList.remove('bad');path=[];draw();if(attempts<=0)return finish(false);locked=false;};
  grid.addEventListener('pointerup',up);grid.addEventListener('pointercancel',up);
}

// The board stays blurred until "Ready"; then the player has cfg.seconds to connect it.
function pipes(el,cfg,finish){
  const rot=m=>((m<<1)|(m>>3))&15,N=cfg.solution.length;
  const grid=cfg.solution.map(r=>r.map(m=>{let x=m;for(let k=Math.floor(Math.random()*4);k>0;k--)x=rot(x);return x;}));
  const powered=()=>{const on=new Set();if(!(grid[0][0]&8))return on;const q=[[0,0]];on.add('0,0');
    while(q.length){const [r,c]=q.shift(),m=grid[r][c];for(const [bit,dr,dc,opp] of [[1,-1,0,4],[2,0,1,8],[4,1,0,1],[8,0,-1,2]]){const nr=r+dr,nc=c+dc;if(m&bit&&nr>=0&&nc>=0&&nr<N&&nc<N&&grid[nr][nc]&opp&&!on.has(nr+','+nc)){on.add(nr+','+nc);q.push([nr,nc]);}}}return on;};
  const solved=()=>powered().has(`${N-1},${N-1}`)&&grid[N-1][N-1]&2;
  while(solved())grid[0][0]=rot(grid[0][0]);
  const tile=m=>`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="9"/>${m&1?'<line x1="50" y1="50" x2="50" y2="0"/>':''}${m&2?'<line x1="50" y1="50" x2="100" y2="50"/>':''}${m&4?'<line x1="50" y1="50" x2="50" y2="100"/>':''}${m&8?'<line x1="50" y1="50" x2="0" y2="50"/>':''}</svg>`;
  el.innerHTML=`<div class="pipes"><div class="pipe-wrap"><div class="pipe-grid blurred"><div class="pipe-end start">🔋</div>${grid.map((row,r)=>row.map((m,c)=>`<button type="button" class="pipe pr-${r} pc-${c}" data-r="${r}" data-c="${c}" aria-label="Pipe piece row ${r+1}, column ${c+1}" disabled></button>`).join('')).join('')}<div class="pipe-end goal">🤖</div></div><button type="button" class="primary pipe-ready">Ready</button></div><p class="pipe-status">You will have ${cfg.seconds} seconds. Press Ready when you are.</p></div>`;
  const status=el.querySelector('.pipe-status'),board=el.querySelector('.pipe-grid');let done=false,timer;
  const draw=()=>{const on=powered();el.querySelectorAll('.pipe').forEach(b=>{const r=+b.dataset.r,c=+b.dataset.c;b.innerHTML=tile(grid[r][c]);b.classList.toggle('on',on.has(r+','+c));});el.querySelector('.goal').classList.toggle('on',!!solved());};
  const stop=async(ok)=>{done=true;clearInterval(timer);el.querySelectorAll('.pipe').forEach(b=>b.disabled=true);status.textContent=ok?'Power on! MOP-3 wakes up…':'Time is up. MOP-3 stays dark.';await wait(1200);finish(ok);};
  el.querySelector('.pipe-ready').onclick=e=>{e.target.remove();board.classList.remove('blurred');el.querySelectorAll('.pipe').forEach(b=>b.disabled=false);
    const end=Date.now()+cfg.seconds*1000;
    timer=setInterval(()=>{if(!el.isConnected)return clearInterval(timer);const left=end-Date.now();if(left<=0)return stop(false);status.textContent=`⏱ ${(left/1000).toFixed(1)} s`;status.classList.toggle('low',left<3000);},100);};
  el.querySelectorAll('.pipe').forEach(b=>b.onclick=()=>{if(done)return;const r=+b.dataset.r,c=+b.dataset.c;grid[r][c]=rot(grid[r][c]);draw();if(solved())stop(true);});
  draw();
}
const COMPONENTS={memory,matching,pattern,pipes};

// ---------- player view ----------
function briefingHTML(s){const i=s.brief,p=s.story[i];let body;
  if(!p){const x=s.suspects[i-s.story.length];body=`<div class="eyebrow">Suspect ${i-s.story.length+1} of ${s.suspects.length}</div>${figure(x.image,'story-img portrait-big')}<h1>${esc(x.name)}</h1><p class="lede">${esc(x.motive)}</p><ul class="traits">${x.traits.map(([t,l])=>`<li><span class="ti">${icon(t)}</span>${esc(l)}</li>`).join('')}</ul>`;}
  else body=`${figure(p.image,'story-img')}<p class="lede story-text">${esc(p.text)}</p>${p.quote?`<div class="orpheus emperor"><span class="who">THE EMPEROR</span><p>“${esc(p.quote)}”</p></div>`:''}`;
  return `<div class="steps">BRIEFING <b>${i+1}</b> / ${s.pages}</div>${body}`;}

// ---------- waiting game: Vader runs and collects cookies; tap to jump over pumpkins ----------
const run={cookies:0,best:0};const BELLY=25;
function runner(el){
  el.innerHTML=`<section class="panel runner"><div class="label">WHILE YOU WAIT FOR EVERYONE</div><p>Collect cookies — Vader wants a full belly! Tap to jump over the pumpkins.</p><div class="belly"><span>BELLY</span><progress max="${BELLY}" value="0"></progress><b class="rc">0</b></div><canvas class="runcv" aria-label="Runner game"></canvas><p class="muted rmsg">Tap the game to start.</p></section>`;
  const cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),bar=el.querySelector('progress'),cnt=el.querySelector('.rc'),msg=el.querySelector('.rmsg');
  const sprite=new Image();const src=(S.state.media||[]).find(m=>m.endsWith('/runner-vader.png'));if(src)sprite.src=src;
  let W,H,ground,v,y,items,t,speed,state='idle',raf,last;
  const fit=()=>{const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);ground=H-18;};
  const reset=()=>{fit();v=0;y=0;items=[];t=0;speed=4.2;};
  const VH=()=>Math.min(70,H*.42),VW=()=>VH()*191/240,X=30;
  const belly=()=>{bar.value=Math.min(run.cookies,BELLY);cnt.textContent=run.cookies>=BELLY?`${run.cookies} 😋 FULL!`:String(run.cookies);};
  const spawn=()=>{if(Math.random()<.45)items.push({k:'p',x:W+20,y:0});else items.push({k:'c',x:W+20,y:Math.random()<.5?0:55+Math.random()*30});};
  function frame(now){if(!el.isConnected)return;raf=requestAnimationFrame(frame);const dt=Math.min(2.5,(now-(last??now))/16.7);last=now;
    if(state==='run'){t+=dt;speed+=.0016*dt;v-=.75*dt;y=Math.max(0,y+v*dt);if(y===0)v=0;
      if(t>(70-Math.min(30,speed*3))){t=0;spawn();}
      for(const it of items)it.x-=speed*dt;items=items.filter(it=>it.x>-40&&!it.gone);
      const vx=X,vy=ground-y-VH(),vw=VW(),vh=VH();
      for(const it of items){const ix=it.x,iy=ground-it.y-26,hit=ix<vx+vw-14&&ix+24>vx+14&&iy<vy+vh-6&&iy+24>vy+8;
        if(!hit)continue;if(it.k==='c'){it.gone=true;run.cookies++;belly();}else{state='over';run.best=Math.max(run.best,run.cookies);msg.textContent='Ouch, a pumpkin! Tap to run again. Your cookies stay in Vader’s belly.';}}}
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#2a3c46';ctx.fillRect(0,ground+2,W,2);
    ctx.font='24px serif';ctx.textBaseline='top';for(const it of items)ctx.fillText(it.k==='c'?'🍪':'🎃',it.x,ground-it.y-26);
    const h=VH(),w=VW(),bob=state==='run'&&y===0?Math.sin(now/70)*2:0;
    if(sprite.complete&&sprite.naturalWidth)ctx.drawImage(sprite,X,ground-y-h+bob,w,h);else{ctx.fillStyle='#111';ctx.fillRect(X,ground-y-h,w,h);}}
  const tap=e=>{e.preventDefault();if(state!=='run'){reset();state='run';msg.textContent='Tap to jump.';return;}if(y===0)v=12.5;};
  cv.addEventListener('pointerdown',tap);reset();belly();raf=requestAnimationFrame(frame);
}

function distribution(s,big){const o=s.overview,total=Math.max(1,o.accused);return `<section class="panel"><div class="label">WHO DID THE DETECTIVES ACCUSE? · ${o.accused} ACCUSATIONS</div>${s.suspects.map(x=>{const n=o.counts[x.id]??0;return `<div class="result ${big?'big':''}"><strong>${esc(x.name)}</strong><small>${n} · ${Math.round(100*n/total)}%</small><progress value="${n}" max="${total}"></progress></div>`;}).join('')}</section>`;}
function board(s){const b=s.overview.board;return `<section class="panel"><div class="label">FASTEST CORRECT DETECTIVES</div>${b.length?`<ol class="board">${b.map(x=>`<li><b>${esc(x.name)}</b><span>${mmss(x.ms)} · ${x.clues}/5 evidence</span></li>`).join('')}</ol>`:'<p>Nobody found the criminal. The Emperor is not amused.</p>'}</section>`;}
function revealBlock(s){const r=s.reveal_,c=s.suspects.find(x=>x.id===r.culprit);return `${figure(r.image)||figure(c.image,'story-img portrait-big')}<div class="eyebrow">The criminal is…</div><h1>${esc(c.name)}</h1><p class="lede">${esc(r.text)}</p><div class="panel"><div class="label">HOW TO KNOW</div><p>${esc(r.explain)}</p></div>`;}
const nameOf=id=>esc(S.state.suspects.find(x=>x.id===id)?.name??'');

function joinHTML(s,me,showResult){
  const name=esc(s.name);
  if(s.reveal>=2){const found=new Set(me.evidence.filter(e=>e.state==='won').map(e=>e.trait));
    return `<div class="join">${me.accused?`<div class="verdict ${me.correct?'good':'bad'}">${me.correct?`🎉 You were right, ${name}!`:`✖ Not this time, ${name}. You accused ${nameOf(me.accused)}.`}</div>`:''}${revealBlock(s)}<section class="panel"><div class="label">YOUR EVIDENCE AND THE SUSPECTS</div>${evidenceRow(me)}${cards(s,{highlight:found})}</section>${board(s)}</div>`;}
  if(s.reveal>=1)return `<div class="join"><h1>The results</h1>${distribution(s)}<p class="lede">Watch the shared screen: the criminal is coming…</p></div>`;
  if(s.phase==='lobby')return `<div class="join">${figure(s.lobby.image,'story-img')}<div class="eyebrow">Welcome, ${name}</div><h1>${esc(s.lobby.title)}</h1><p class="lede">${esc(s.lobby.text)}</p></div>`;
  if(s.phase==='briefing')return `<div class="join story">${briefingHTML(s)}<p class="muted">The host reads the briefing. Your investigation starts after it.</p></div>`;
  if(s.phase==='ended')return `<div class="join"><h1>Time is up!</h1><div class="panel"><p class="lede">${me.accused?`Your accusation: <b>${nameOf(me.accused)}</b>.`:'You did not make an accusation in time.'}</p><p>Watch the shared screen for the results.</p></div>${evidenceRow(me)}<div id="pk-runner"></div></div>`;
  if(showResult){const r=me.lastResult;return `<div class="join"><div class="eyebrow">${esc(r.title)}</div>${r.won?`<h1>Evidence found!</h1>${clueCard(r.clue)}`:`<h1>Evidence lost.</h1><div class="panel"><p class="lede">The puzzle was not solved. This evidence is gone — but four pieces are enough to solve the case.</p></div>`}${evidenceRow(me)}<button type="button" class="primary wide" id="pk-continue">Continue →</button></div>`;}
  if(me.step==='accuse'){
    if(me.accused)return `<div class="join"><h1>Accusation sent.</h1><div class="panel"><p class="lede">You accused <b>${nameOf(me.accused)}</b>. Wait for the reveal on the shared screen.</p></div>${evidenceRow(me)}<div id="pk-runner"></div></div>`;
    return `<div class="join accuse"><h2>Who smashed the pumpkin?</h2><div class="label">YOUR EVIDENCE</div>${evidenceRow(me)}<div class="label">TAP THE CRIMINAL</div>${cards(s,{pick:true})}</div>`;}
  const p=s.puzzle,n=ORDER.indexOf(me.step)+1;let extra;
  if(me.step==='register'){const second=p.confirm&&me.pending;
    extra=`<div class="panel sigbox">${p.confirm?`<div class="label">${second?'STEP 2 OF 2 · AGAIN':'STEP 1 OF 2 · DRAW'}</div>`:''}<p>${second?'Now draw it again — exactly the same way. Remember it!':me.lastSig&&!me.lastSig.ok?'That did not match. Let’s start again: draw your symbol.':'Draw your symbol with one finger, in one line.'}</p><div id="pk-puzzle"></div></div>`;}
  else if(me.step==='vault')extra=`<div class="panel sigbox"><div class="label">TRIES LEFT: ${me.sigLeft}</div>${me.lastSig&&!me.lastSig.ok?'<p class="warn">The vault did not recognise your symbol.</p>':''}<div id="pk-puzzle"></div><button type="button" class="linklike" id="pk-skip">I can’t remember — give up this evidence</button></div>`;
  else extra=`<div class="panel"><div id="pk-puzzle"></div><button type="button" class="linklike" id="pk-skip">Give up — lose this evidence</button></div>`;
  return `<div class="join puzzle-screen"><div class="pz-head"><span class="steps">PUZZLE <b>${n}</b> / 6</span>${me.step==='register'?'':evidenceRow(me)}</div>${figure(p.image)}<h1>${esc(p.title)}</h1><p class="lede">${esc(p.text)}</p>${extra}${suspectsPanel()}</div>`;
}

let lastStep='';
function renderJoin(app){
  const s=S.state,me=s.me;if(!me)return;
  const r=me.lastResult,showResult=s.phase==='play'&&r&&!seen().has(r.puzzle)&&me.step!=='register';
  const page=s.phase==='briefing'?s.brief:null;
  const key=JSON.stringify([s.run,s.phase,s.reveal,me.step,page,me.pending,me.sigLeft,me.lastSig?.at,me.accused,showResult?r.puzzle:null,s.name,s.media?.length]);
  if(app.dataset.view==='pumpkin'&&app.dataset.key===key)return;
  app.dataset.view='pumpkin';app.dataset.key=key;app.innerHTML=joinHTML(s,me,showResult);
  const stepKey=`${s.phase}-${s.reveal}-${me.step}-${page}-${showResult}`;if(stepKey!==lastStep){if(lastStep)toTop();lastStep=stepKey;}
  const redraw=()=>{app.dataset.key='';renderJoin(app);};
  const rbox=app.querySelector('#pk-runner');if(rbox)runner(rbox);
  app.querySelector('#pk-continue')?.addEventListener('click',()=>{markSeen(r.puzzle);redraw();});
  app.querySelectorAll('.card.pickable').forEach(c=>c.addEventListener('click',e=>{
    if(c.classList.contains('locked'))return;
    if(e.target.closest('.no')){c.classList.remove('asking');return;}
    if(e.target.closest('.yes')){app.querySelectorAll('.card').forEach(x=>x.classList.add('locked'));act({action:'accuse',suspect:c.dataset.suspect});return;}
    app.querySelectorAll('.card').forEach(x=>x.classList.toggle('asking',x===c));}));
  const skip=app.querySelector('#pk-skip');if(skip)armed(skip,'Tap again to give up this evidence',()=>act(me.step==='vault'?{action:'skipVault'}:{action:'result',puzzle:me.step,ok:false}));
  const box=app.querySelector('#pk-puzzle');if(!box||s.phase!=='play'||showResult)return;
  if(me.step==='register')symbolPad(box,{onSubmit:pts=>act({action:s.puzzle.confirm&&me.pending?'sigConfirm':'sigRegister',points:pts})});
  else if(me.step==='vault')symbolPad(box,{onSubmit:pts=>act({action:'sigVerify',points:pts})});
  else COMPONENTS[me.step](box,s.puzzle,ok=>act({action:'result',puzzle:me.step,ok}));
}

// ---------- shared screen and host ----------
function progress(s){const o=s.overview;return `<section class="panel"><div class="label">DETECTIVES AT WORK · ${o.players} PLAYING · ${o.accused} ACCUSATIONS</div>${o.steps.map(x=>`<div class="result"><strong>${esc(STEP_NAMES[x.id])}</strong><small>${x.done} / ${o.players}</small><progress value="${x.done}" max="${Math.max(1,o.players)}"></progress></div>`).join('')}</section>`;}
const roster=s=>s.roster?.length?`<div class="roster">${s.roster.map(n=>`<span class="chip">${esc(n)}</span>`).join('')}</div>`:'<p class="muted">Nobody yet.</p>';
function renderScreen(app){const s=S.state;app.dataset.view='pumpkin-screen';
  const join=`<div class="panel"><div class="label">JOIN</div><p>Open on your phone:</p><div class="join-url">${esc(s.joinUrl.replace(/^https?:\/\//,''))}</div><span class="muted">${s.participants} detectives connected</span></div>`;
  let main,side;
  if(s.reveal>=2){main=revealBlock(s);side=board(s);}
  else if(s.reveal>=1){main=`<div class="screen-split">${figure('who-guilty','story-img')}<div><div class="eyebrow">The Pumpkin Case</div><h1>The detectives have spoken.</h1></div></div>${distribution(s,true)}`;side=join;}
  else if(s.phase==='lobby'){main=`<div class="screen-split">${figure(s.lobby.image,'story-img')}<div><div class="eyebrow">Imperial Detective Office</div><h1>${esc(s.lobby.title)}</h1><p class="lede">${esc(s.lobby.text)}</p></div></div>`;side=`${join}<div class="panel"><div class="label">DETECTIVES</div>${roster(s)}</div>`;}
  else if(s.phase==='briefing'){main=`<div class="briefing-screen">${briefingHTML(s)}</div>`;side=join;}
  else if(s.phase==='play'){main=`<div class="eyebrow">The Pumpkin Case</div><h1>Investigation in progress</h1><div class="big-clock" id="pk-timer">--:--</div>${progress(s)}`;side=`${join}${cards(s)}`;}
  else{main=`<div class="eyebrow">The Pumpkin Case</div><h1>Time is up!</h1><p class="lede">${s.overview.accused} of ${s.overview.players} detectives made an accusation.</p>${progress(s)}`;side=join;}
  app.innerHTML=`<div class="layout"><section>${main}</section><aside class="stack">${side}</aside></div>`;}
function renderControl(app){const s=S.state;
  const dur=app.querySelector('#pk-duration')?.value;
  const sel=`<label for="pk-duration">Investigation time (starts after the briefing)</label><select id="pk-duration"><option value="300">5 minutes</option><option value="480">8 minutes</option><option value="600">10 minutes</option></select>`;
  const last=s.brief>=s.pages-1;
  const buttons=s.phase==='lobby'?`${sel}<div class="actions"><button class="primary" data-ctl="brief">Start the briefing →</button></div>`
    :s.phase==='briefing'?`<p class="muted">Briefing page ${s.brief+1} / ${s.pages}. Phones and the screen follow you. The clock is not running.</p>${sel}<div class="actions">${s.brief>0?'<button data-page="-1">← Back</button>':''}${last?'<button class="primary" data-ctl="start">Start the investigation →</button>':'<button class="primary" data-page="1">Next →</button>'}</div>`
    :s.phase==='play'?`<div class="pk-clock"><span>TIME LEFT</span><b id="pk-timer">--:--</b></div><div class="actions"><button data-ctl="more">+2 min</button><button class="danger" id="pk-end">End now</button></div>`
    :s.reveal===0?`<div class="actions"><button class="primary" data-ctl="reveal">Show the results →</button></div>`:s.reveal===1?`<div class="actions"><button class="primary" data-ctl="reveal">Reveal the criminal →</button></div>`:'<p class="muted">Case closed.</p>';
  const rows=(s.table??[]).map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(STEP_NAMES[r.step])}</td><td>${r.clues}/5</td><td>${r.accused?'✓':''}</td></tr>`).join('');
  app.innerHTML=`<div class="control-layout"><section><div class="eyebrow">The Pumpkin Case · ${esc(s.phase)}${s.reveal?` · reveal ${s.reveal}`:''}</div>${s.phase==='briefing'?`<div class="panel briefing-mini">${briefingHTML(s)}</div>`:''}<div class="panel"><h3>READ ALOUD</h3><p class="script">${esc(s.script)}</p></div>${s.phase==='briefing'?'':s.overview?progress(s):''}${s.reveal>=1?distribution(s):''}${s.reveal>=2?board(s):''}</section><aside class="stack"><div class="panel"><div class="label">HOST CONSOLE</div><p class="muted">${s.participants} / ${s.maxParticipants} connected · join link: ${esc(s.joinUrl)}</p>${buttons}<p class="muted">Culprit: Royal Guard Rex. Players are asked for a nickname when they join.</p></div><div class="panel"><div class="label">DETECTIVES</div><table class="ptable"><thead><tr><th>Name</th><th>Now</th><th>Evidence</th><th>Accused</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="muted">Nobody yet.</td></tr>'}</tbody></table></div></aside></div>`;
  if(dur&&app.querySelector('#pk-duration'))app.querySelector('#pk-duration').value=dur;
  app.querySelectorAll('[data-ctl]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;control(el.dataset.ctl,{seconds:Number(app.querySelector('#pk-duration')?.value)});}));
  app.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>{el.disabled=true;control('page',{page:s.brief+Number(el.dataset.page)});}));
  const end=app.querySelector('#pk-end');if(end)armed(end,'Tap again: end for everybody',()=>control('end'));
}

export function render(app,mode){if(mode==='join')return renderJoin(app);if(mode==='screen')return renderScreen(app);return renderControl(app);}
// Game clock for the page header.
export function header(){const s=S.state;if(s.phase==='play'){const left=s.endsAt-now();return {text:`⏱ ${mmss(left)}`,low:left<60000};}if(s.phase==='ended'&&s.reveal===0)return {text:'TIME UP'};return null;}
export function tick(){const s=S.state;const el=document.querySelector('#pk-timer');if(!el)return;
  const left=s.phase==='play'?s.endsAt-now():0;el.textContent=mmss(left);el.classList.toggle('low',s.phase==='play'&&left<60000);}
