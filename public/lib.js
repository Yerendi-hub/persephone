// Shared runtime: state, realtime connection and small helpers used by every game view.
export const S={state:null,online:false,offset:0,mode:location.pathname.slice(1)||'home'};
export const hooks={render(){},tick(){},header:()=>null};
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const letters='ABCDEFGH'.split('');
export const pad=n=>String(n).padStart(2,'0');
export const isHost=()=>!!S.state?.games;
let noticeTimer,source,polling;
export function notice(text){const el=document.querySelector('#notice');el.textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.textContent='',7000);}
export async function post(url,data){const r=await fetch('/api/'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const b=await r.json();if(!r.ok)throw Error(b.error);return b;}
// The header shows the game clock when a game provides one, otherwise the link status.
export function headerStatus(){const c=document.querySelector('#connection');const h=S.online&&S.state?hooks.header():null;c.textContent=!S.online?'○ RECONNECTING':h?.text??'● LINK ONLINE';c.classList.toggle('offline',!S.online);c.classList.toggle('clock',!!h);c.classList.toggle('low',!!h?.low);}
function setOnline(value){S.online=value;headerStatus();}
export function receive(s){
  const old=S.state;if(old&&old.run===s.run&&s.revision<old.revision)return;
  const changed=!old||old.run!==s.run||old.revision!==s.revision||isHost()!==!!s.games||old.joined!==s.joined||!S.online;
  S.state=s;S.offset=s.serverNow-Date.now();setOnline(true);if(changed)hooks.render();
}
export async function refresh(){try{const r=await fetch('/api/state');if(!r.ok)throw Error();receive(await r.json());}catch{setOnline(false);}}
export function connect(){source?.close();source=new EventSource('/api/events');source.onmessage=e=>receive(JSON.parse(e.data));source.onerror=()=>setOnline(false);clearInterval(polling);polling=setInterval(refresh,5000);}
// Participant action for the active game. Resolves to true on success.
export async function act(data){try{receive(await post('act',{run:S.state.run,...data}));return true;}catch(e){notice(e.message);await refresh();return false;}}
export async function control(action,extra={}){try{receive(await post('control',{action,run:S.state.run,stage:S.state.stage,commandId:crypto.randomUUID(),...extra}));return true;}catch(e){notice(e.message);await refresh();return false;}}
export const now=()=>Date.now()+S.offset;
// Instant jump to the top, repeated after layout so late image shifts on phones cannot keep the old position.
export function toTop(){const go=()=>{window.scrollTo({top:0,left:0,behavior:'instant'});document.documentElement.scrollTop=0;document.body.scrollTop=0;};go();requestAnimationFrame(()=>{go();setTimeout(go,60);});}
export const imgSrc=name=>name?(S.state?.media??[]).find(m=>m===`/img/${S.state.game}/${name}.jpg`||m===`/img/${S.state.game}/${name}.png`)??null:null;
export const figure=(name,cls='scene-img')=>{const src=imgSrc(name);return src?`<figure class="${cls}"><img src="${src}" alt="" loading="eager"></figure>`:'';};
// In-page two-step confirmation (no browser dialogs): first tap arms the button, second tap within 4 s runs fn.
export function armed(el,question,fn){el.addEventListener('click',e=>{e.preventDefault();if(el.dataset.armed){clearTimeout(el._t);delete el.dataset.armed;fn();return;}el.dataset.armed='1';el._orig=el.textContent;el.textContent=question;el.classList.add('armed');el._t=setTimeout(()=>{delete el.dataset.armed;el.textContent=el._orig;el.classList.remove('armed');},4000);});}
export const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return `${pad(Math.floor(s/60))}:${pad(s%60)}`;};
