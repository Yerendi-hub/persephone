// Router and shared chrome: neutral lobby, game selection, nicknames, media preloading.
import {S,hooks,esc,post,notice,receive,refresh,connect,control,isHost,armed,headerStatus} from './lib.js';
import * as persephone from './persephone.js';
import * as pumpkin from './pumpkin.js';
import * as shadow from './shadow.js';
const VIEWS={persephone,pumpkin,shadow};
const BRAND={null:['🎃','HALLOWEEN GAMES','THE OFFICE / 2026'],persephone:['P','PERSEPHONE','MISSION CONTROL / 2189'],pumpkin:['🎃','IMPERIAL DETECTIVES','THRONE ROOM / CASE 31-10'],shadow:['☾','NIGHT OF SHADOWS','STATION WRAITH / FESTIVAL NIGHT']};
const app=document.querySelector('#app');const mode=S.mode;let joining=false,joinError='';

// Preload the chosen game's images, three at a time; the lobby absorbs the download so scenes switch instantly.
const media={game:undefined,keep:[]};
function preload(s){if(!['join','screen'].includes(mode)||media.game===s.game)return;media.game=s.game;const list=s.media??[];if(!list.length)return;
  document.querySelector('#loader')?.remove();const el=document.createElement('div');el.id='loader';el.setAttribute('role','status');document.body.append(el);let n=0;
  const draw=()=>{el.innerHTML=`<div><div class="label">LOADING MEDIA</div><p>${n} / ${list.length}</p><progress value="${n}" max="${list.length}"></progress></div>`;};draw();
  const queue=[...list];const one=src=>new Promise(res=>{const i=new Image();i.onload=()=>{(i.decode?i.decode():Promise.resolve()).catch(()=>{}).finally(res);};i.onerror=res;i.src=src;media.keep.push(i);});
  const worker=async()=>{while(queue.length){await one(queue.shift());n++;draw();}};
  Promise.race([Promise.all([worker(),worker(),worker()]),new Promise(r=>setTimeout(r,20000))]).then(()=>{el.classList.add('done');setTimeout(()=>el.remove(),400);});}

function chrome(){const s=S.state,[sig,name,sub]=BRAND[s.game]??BRAND.null;
  document.body.className=`${mode} g-${s.game??'none'}`;document.title=s.gameTitle??'Halloween Games';
  const b=document.querySelector('.brand');const html=`<span class="sigil">${esc(sig)}</span> ${esc(name)} <small>${esc(sub)}</small>`;if(b.innerHTML!==html)b.innerHTML=html;}
const login=()=>`<form id="login" class="login panel"><div class="eyebrow">Authorized personnel</div><h1>Host login</h1><p>Sign in to run the game.</p><label for="password">Host password</label><input id="password" type="password" autocomplete="current-password" required minlength="12"><button class="primary">Enter →</button></form>`;
const soon=extra=>`<section class="soon"><div class="eyebrow">Halloween at the office</div><h1>The Halloween game<br><em>starts soon.</em></h1><p class="lede">Grab your phone. When the host is ready, the game appears here by itself.</p>${extra??''}</section>`;
const joinBox=()=>`<div class="panel joinbox"><div class="label">JOIN</div><p>Open on your phone:</p><div class="join-url">${esc(S.state.joinUrl.replace(/^https?:\/\//,''))}</div><span class="muted">${S.state.participants} people connected</span></div>`;
function nameForm(){return `<div class="join"><div class="eyebrow">${esc(S.state.gameTitle)}</div><h1>Who are you, detective?</h1><form id="nameform" class="panel"><label for="nick">Your nickname (2–20 characters)</label><input id="nick" maxlength="20" autocomplete="nickname" required placeholder="e.g. Detective Pumpkin"><button class="primary">That’s me →</button><p class="muted">Your nickname can appear on the shared screen.</p></form></div>`;}
function gamebar(){const s=S.state;return `<section class="panel gamebar"><div class="label">GAME</div><div class="actions">${s.games.map(g=>`<button data-select="${g.id}" class="${s.game===g.id?'primary':''}" title="${esc(g.tagline)}">${esc(g.title)}</button>`).join('')}<button data-select="" class="${s.game?'':'primary'}">“Starts soon” page</button></div><p class="muted">Changing the game starts it fresh; phones follow automatically. ${s.participants} connected.</p><div class="actions"><a href="/screen" target="_blank" rel="noopener">Presentation ↗</a><button id="logout">Sign out</button></div>${s.game?`<details class="danger-zone"><summary>Restart this game</summary><p>Archives this run and clears all progress. Everyone re-joins automatically.</p><label for="reset-confirm">Type RESET</label><input id="reset-confirm" autocomplete="off"><button class="danger" id="reset">Archive & restart</button></details>`:''}</section>`;}

function render(){const s=S.state;if(!s)return;chrome();preload(s);const view=VIEWS[s.game];
  if(mode==='home'){app.dataset.view='core';app.innerHTML=soon(`<div class="actions"><a class="button primary" href="/join">Join ↗</a></div>`);}
  else if(mode==='join'){
    if(isHost()){app.dataset.view='core';app.innerHTML=`<div class="join"><div class="eyebrow">Host browser</div><h1>You are the host.</h1><div class="panel"><p>This browser is signed in as the host, so it cannot play. To test as a player, open this link in a private window or on another device.</p><a class="button" href="/control">Back to the control room →</a></div></div>`;}
    else if(!s.joined){app.dataset.view='core';app.innerHTML=`<div class="join">${soon(`<div class="panel"><p>${esc(joinError||'Connecting…')}</p></div>`)}</div>`;}
    else if(!view){app.dataset.view='core';app.innerHTML=`<div class="join">${soon('<div class="panel"><div class="label">YOU ARE IN</div><p>Keep this page open. The game will start here.</p></div>')}</div>`;}
    else if(s.needsName&&!s.name){if(app.dataset.view!=='name'){app.dataset.view='name';app.innerHTML=nameForm();}}
    else view.render(app,'join');
  }
  else if(mode==='screen'){
    if(!isHost()){app.dataset.view='core';app.innerHTML=login();}
    else if(!view){app.dataset.view='core';app.innerHTML=`<div class="layout"><section>${soon()}</section><aside class="stack">${joinBox()}</aside></div>`;}
    else view.render(app,'screen');
    if(isHost()&&!document.querySelector('#fullscreen')){const f=document.createElement('button');f.id='fullscreen';f.className='fullscreen';f.textContent='FULLSCREEN ⛶';document.body.append(f);f.onclick=()=>(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>notice('Fullscreen is unavailable in this browser.'));}
  }
  else if(mode==='control'){
    if(!isHost()){app.dataset.view='core';app.innerHTML=login();}
    else{const keep=app.querySelector('#reset-confirm')?.value;app.dataset.view='core';app.innerHTML=`${gamebar()}<div id="gameview"></div>${view?'':`<div class="panel"><h3>READ ALOUD</h3><p class="script">${esc(s.script??'')}</p></div>`}`;
      if(keep&&app.querySelector('#reset-confirm'))app.querySelector('#reset-confirm').value=keep;if(view)view.render(app.querySelector('#gameview'),'control');}
  }
  bind();autoJoin();
}
function bind(){
  app.querySelector('#login')?.addEventListener('submit',async e=>{e.preventDefault();try{await post('login',{password:app.querySelector('#password').value});await refresh();connect();}catch(e){notice(e.message);}});
  app.querySelector('#nameform')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;try{receive(await post('name',{name:app.querySelector('#nick').value}));}catch(err){notice(err.message);btn.disabled=false;}});
  app.querySelector('#logout')?.addEventListener('click',async()=>{await post('logout',{});location.reload();});
  app.querySelectorAll('[data-select]').forEach(el=>{const g=el.dataset.select||null;if(g===S.state.game)return;if(S.state.game)armed(el,'Tap again: restart with this',()=>control('select',{game:g}));else el.addEventListener('click',()=>control('select',{game:g}));});
  app.querySelector('#reset')?.addEventListener('click',()=>control('reset',{confirm:app.querySelector('#reset-confirm').value}));
}
async function autoJoin(){const s=S.state;if(mode!=='join'||!s||s.joined||isHost()||joining||joinError)return;joining=true;try{await post('join',{});await refresh();connect();}catch(e){joinError=e.message;render();setTimeout(()=>{joinError='';refresh();},10000);}finally{joining=false;}}
hooks.render=render;
hooks.header=()=>VIEWS[S.state?.game]?.header?.()??null;
setInterval(()=>{const v=VIEWS[S.state?.game];if(v&&S.state)v.tick?.();headerStatus();},250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();connect();
