// Shared runtime: state, realtime connection and small helpers used by every game view.
export const S={state:null,online:false,offset:0,mode:location.pathname.slice(1)||'home'};
export const hooks={render(){},tick(){}};
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const letters='ABCDEFGH'.split('');
export const pad=n=>String(n).padStart(2,'0');
export const isHost=()=>!!S.state?.games;
let noticeTimer,source,polling;
export function notice(text){const el=document.querySelector('#notice');el.textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.textContent='',7000);}
export async function post(url,data){const r=await fetch('/api/'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const b=await r.json();if(!r.ok)throw Error(b.error);return b;}
function setOnline(value){S.online=value;const c=document.querySelector('#connection');c.textContent=value?'● LINK ONLINE':'○ RECONNECTING';c.classList.toggle('offline',!value);}
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
export const imgSrc=name=>name&&S.state?.media?.includes(`/img/${S.state.game}/${name}.jpg`)?`/img/${S.state.game}/${name}.jpg`:null;
export const figure=(name,cls='scene-img')=>{const src=imgSrc(name);return src?`<figure class="${cls}"><img src="${src}" alt="" loading="eager"></figure>`:'';};
export const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return `${pad(Math.floor(s/60))}:${pad(s%60)}`;};
