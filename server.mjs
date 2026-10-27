import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {scenes,endings,options,sealed,recap,truth} from './story.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const clueScenes=['door1','door2','canteen','path'];
const IMAGES=new Set(['approach','canteen','captain','corridor','decision','hangar','medical','radio','service-bay']);
// Plurality. Any tie (including zero votes) takes the poll's tie option if it has one, otherwise the first tied option.
function top(c,ids,tie){const max=Math.max(...c);const tied=c.map((n,i)=>n===max?i:-1).filter(i=>i>=0);const t=ids.indexOf(tie);return tied.length>1&&t>=0?t:tied[0];}

export function createApp(config={}) {
  const password=config.password??process.env.HOST_PASSWORD;
  const secret=config.secret??process.env.COOKIE_SECRET;
  if(!password||password.length<12||!secret||secret.length<32) throw Error('Set HOST_PASSWORD (12+ characters) and COOKIE_SECRET (32+ characters).');
  const publicUrl=config.publicUrl??process.env.PUBLIC_URL??'http://localhost:3000';
  const origin=new URL(publicUrl).origin, secure=origin.startsWith('https:');
  const trustProxy=config.trustProxy??process.env.TRUST_PROXY==='1';
  const clientKey=req=>(trustProxy&&req.headers['x-forwarded-for'])||req.socket.remoteAddress;
  const maxParticipants=Number(config.maxParticipants??process.env.MAX_PARTICIPANTS??200);
  const dir=config.dataDir??process.env.DATA_DIR??path.join(root,'data');
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'state.json');
  const fresh=()=>({schema:4,run:crypto.randomUUID(),code:crypto.randomBytes(3).toString('hex').toUpperCase(),revision:0,stage:0,scene:0,paused:false,polls:{},members:[],hint:false,startedAt:null,pausedAt:null,pauseMs:0,audit:[],commands:[]});
  let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fresh();
  // A state file from an older story version is archived (never deleted) and a fresh mission starts.
  if(state.schema!==4){fs.renameSync(file,path.join(dir,`archive-schema${state.schema}-${Date.now()}.json`));console.log('Archived state from an older version; starting a fresh mission.');state=fresh();}
  const save=()=>{try{const fd=fs.openSync(file+'.tmp','w');try{fs.writeFileSync(fd,JSON.stringify(state));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(file+'.tmp',file);}catch(e){e.storage=true;throw e;}};

  // ---- poll model ----
  const active=()=>scenes[state.scene]?.poll;
  const record=()=>active()?state.polls[active().id]:null;
  const winnerOf=id=>{const r=state.polls[id];return r?.status==='closed'?r.options[r.winner]:undefined;};
  const won=()=>Object.fromEntries(Object.keys(state.polls).map(id=>[id,winnerOf(id)]));
  const choicesNow=p=>record()?.options??p.choices(won());
  const counts=(p,r)=>{const ids=r?.options??choicesNow(p),votes=Object.values(r?.votes??{});return ids.map((_,i)=>votes.filter(v=>v===i).length);};
  const ending=()=>winnerOf('final');
  // Recovery never silently consumes the rest of an open vote.
  if(state.startedAt&&state.scene<scenes.length&&!state.paused){if(record()?.status==='open'){record().remaining=Math.max(0,record().deadline-Date.now());record().deadline=null;}state.paused=true;state.pausedAt=Date.now();}
  save();

  const streams=new Set(),attempts=new Map();
  function sign(payload){const b=Buffer.from(JSON.stringify(payload)).toString('base64url');return b+'.'+crypto.createHmac('sha256',secret).update(b).digest('base64url');}
  function identity(req){try{const raw=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('persephone='))?.slice(11);const [b,s]=raw.split('.');const expected=sign(JSON.parse(Buffer.from(b,'base64url'))).split('.')[1];if(!s||s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;const p=JSON.parse(Buffer.from(b,'base64url'));return p.exp>Date.now()?p:null;}catch{return null;}}
  function cookie(res,role,id){res.setHeader('Set-Cookie',`persephone=${sign({role,id,exp:Date.now()+12*3600000})}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure?'; Secure':''}`);}
  const outcomeOf=(pollId,id)=>{const o=options[id];return {id,title:o.title,image:o.image,text:o.text,orpheus:o.orpheus,sealed:pollId==='door1'?sealed[id]:pollId==='door2'?'As SCOUT goes in, the other door locks behind it.':null};};
  function snapshot(who){
    const s=scenes[state.scene],p=active(),r=record(),host=who?.role==='host',member=state.members.includes(who?.id),finished=state.scene===scenes.length;
    const data={run:state.run,revision:state.revision,stage:state.stage,scene:state.scene,totalScenes:scenes.length,paused:state.paused,serverNow:Date.now(),
      elapsedMs:state.startedAt?((state.endedAt??state.pausedAt??Date.now())-state.startedAt-state.pauseMs):0,participants:state.members.length,maxParticipants,
      hint:null,joinUrl:publicUrl+'/join',joined:host||member,finished};
    data.found=clueScenes.filter(id=>winnerOf(id)).map(id=>outcomeOf(id,winnerOf(id)));
    if(s)data.content={id:s.id,title:s.title,eyebrow:s.eyebrow,text:s.text,image:s.image,orpheus:s.orpheus};
    else{const e=endings[ending()]??endings.quarantine;data.content={title:e.title,eyebrow:e.eyebrow,text:e.text,image:e.image};data.ending=ending()??'quarantine';data.recap=recap;data.truth=truth;
      if(member){const v=state.polls.final?.votes[who.id];data.myFinal=v===undefined?null:options[state.polls.final.options[v]].label;}}
    if(p){
      const ids=choicesNow(p),closed=r?.status==='closed';
      data.poll={id:p.id,question:p.question,status:r?.status??'ready',deadline:r?.deadline,remaining:r?.remaining,myVote:r?.votes[who?.id]??null,total:Object.keys(r?.votes??{}).length,
        final:p.id==='final',options:ids.map(id=>({id,label:options[id].label}))};
      if(host||closed)data.poll.counts=counts(p,r);
      if(closed){data.poll.winner=r.winner;if(p.id!=='final')data.poll.outcome=outcomeOf(p.id,ids[r.winner]);}
    }
    if(host){
      data.code=state.code;data.audit=state.audit.slice(-12);data.results=state.polls;
      const o=data.poll?.outcome;
      data.script=!s?data.content.text:o?`${o.text}${o.sealed?`\n\n${o.sealed}`:''}${o.orpheus?`\n\nORPHEUS: "${o.orpheus}"`:''}`:s.script;
      if(p&&p.id!=='final')data.clueNotes=Object.fromEntries(choicesNow(p).map(id=>[id,`Clue ${options[id].clue}`]));
    }
    return data;
  }
  function publish(){for(const c of streams){if(c.res.writableLength>65536){c.res.destroy();streams.delete(c);continue;}c.res.write('data: '+JSON.stringify(snapshot(c.who))+'\n\n');}}
  function commit(label,stage=false){state.revision++;if(stage)state.stage++;state.audit.push({at:new Date().toISOString(),action:label});state.audit=state.audit.slice(-200);save();publish();}
  function closePoll(){const p=active(),r=record();if(!r||r.status!=='open')return;r.winner=top(counts(p,r),r.options,p.tie);r.status='closed';r.deadline=null;r.remaining=0;commit('close '+p.id,true);}
  const ticker=setInterval(()=>{if(!state.paused&&record()?.status==='open'&&Date.now()>=record().deadline)closePoll();},200);
  const heartbeat=setInterval(()=>{for(const c of streams)c.res.write(': heartbeat\n\n');for(const [k,v] of attempts)if(v.until<Date.now())attempts.delete(k);},15000);
  function fail(status,message){throw Object.assign(Error(message),{status});}
  function limit(req,key,max){const k=key+clientKey(req),v=attempts.get(k)??{n:0,until:Date.now()+60000};if(v.until<Date.now()){v.n=0;v.until=Date.now()+60000;}v.n++;attempts.set(k,v);if(v.n>max)fail(429,'Too many attempts. Try again in one minute.');}
  async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)fail(413,'Request too large.');}let v;try{v=JSON.parse(raw||'{}');}catch{fail(400,'Invalid JSON.');}if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'Expected a JSON object.');return v;}
  function respond(res,status,data){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
  const validIndex=(x,n)=>Number.isInteger(x)&&x>=0&&x<n;

  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try{
      const u=new URL(req.url,'http://localhost'),who=identity(req);
      if(req.method==='GET'&&u.pathname==='/healthz')return respond(res,200,{ok:true});
      if(req.method==='GET'&&u.pathname==='/api/state')return respond(res,200,snapshot(who));
      if(req.method==='GET'&&u.pathname==='/api/events'){
        if(streams.size>=maxParticipants+250)fail(503,'Connection capacity reached. Refresh shortly.');
        res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});
        const c={res,who};streams.add(c);res.write('data: '+JSON.stringify(snapshot(who))+'\n\n');req.on('close',()=>streams.delete(c));return;
      }
      if(req.method==='POST'){
        if(req.headers.origin!==origin)fail(403,'Origin mismatch. Use the configured application URL.');
        const b=await body(req);
        if(u.pathname==='/api/login'){
          limit(req,'login',20);const a=crypto.createHash('sha256').update(String(b.password??'')).digest(),e=crypto.createHash('sha256').update(password).digest();if(!crypto.timingSafeEqual(a,e))fail(401,'Incorrect password.');cookie(res,'host','host');return respond(res,200,{ok:true});
        }
        if(u.pathname==='/api/logout'){res.setHeader('Set-Cookie','persephone=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return respond(res,200,{ok:true});}
        if(u.pathname==='/api/join'){
          limit(req,'join',600);if(who?.role==='host')fail(409,'This browser is signed in as the host. Use a private window or another device to take part.');
          const id=who?.role==='participant'?who.id:crypto.randomUUID();if(!state.members.includes(id)){if(state.members.length>=maxParticipants)fail(409,`This mission has reached ${maxParticipants} participants.`);state.members.push(id);commit('participant joined');}cookie(res,'participant',id);return respond(res,200,{ok:true});
        }
        if(u.pathname==='/api/vote'){
          if(!who||who.role!=='participant'||!state.members.includes(who.id))fail(401,'Join this mission first.');
          const p=active(),r=record();if(b.run!==state.run||b.pollId!==p?.id||state.paused||r?.status!=='open'||Date.now()>=r.deadline)fail(409,'This vote is not open.');
          if(!validIndex(b.option,r.options.length))fail(400,'Invalid option.');r.votes[who.id]=b.option;
          commit('vote '+p.id);return respond(res,200,snapshot(who));
        }
        if(u.pathname==='/api/control'){
          if(who?.role!=='host')fail(401,'Host login required.');
          if(typeof b.commandId!=='string'||b.commandId.length>80)fail(400,'Command ID required.');
          if(state.commands.includes(b.commandId))return respond(res,200,snapshot(who));
          if(b.stage!==state.stage||b.run!==state.run)fail(409,'State changed. Review the refreshed screen and try again.');
          const r=record();
          switch(b.action){
            case 'next':if(state.paused)fail(409,'Resume first.');if(active()&&r?.status!=='closed')fail(409,'Complete this vote first.');if(state.scene>=scenes.length)fail(409,'Mission complete.');if(!state.startedAt)state.startedAt=Date.now();state.scene++;if(state.scene===scenes.length)state.endedAt=Date.now();state.hint=false;break;
            case 'open':if(state.paused||!active()||r)fail(409,'Cannot open this vote.');if(![30,45,60,90,120].includes(b.seconds))fail(400,'Choose 30, 45, 60, 90 or 120 seconds.');state.polls[active().id]={status:'open',votes:{},deadline:Date.now()+b.seconds*1000,remaining:0,options:active().choices(won())};break;
            case 'close':if(state.paused||r?.status!=='open')fail(409,'No active vote.');closePoll();break;
            case 'pause':if(state.paused||!state.startedAt)fail(409,'Cannot pause.');state.paused=true;state.pausedAt=Date.now();if(r?.status==='open'){r.remaining=Math.max(0,r.deadline-Date.now());r.deadline=null;}break;
            case 'resume':if(!state.paused)fail(409,'Not paused.');state.pauseMs+=Date.now()-state.pausedAt;state.pausedAt=null;state.paused=false;if(r?.status==='open')r.deadline=Date.now()+r.remaining;break;
            case 'hint':if(!scenes[state.scene]?.hint)fail(409,'No hint here.');state.hint=true;break;
            case 'reset':if(b.confirm!=='RESET')fail(400,'Type RESET to create a new mission.');fs.copyFileSync(file,path.join(dir,`archive-${state.run}.json`));state=fresh();break;
            default:fail(400,'Unknown command.');
          }
          state.commands.push(b.commandId);state.commands=state.commands.slice(-100);commit(b.action,true);return respond(res,200,snapshot(who));
        }
        fail(404,'Not found.');
      }
      if(req.method==='GET'){
        const staticFiles={'/':'index.html','/join':'index.html','/screen':'index.html','/control':'index.html','/app.js':'app.js','/style.css':'style.css'};
        const img=/^\/img\/([a-z-]+)\.jpg$/.exec(u.pathname);
        if(img&&IMAGES.has(img[1])){res.setHeader('Content-Type','image/jpeg');res.setHeader('Cache-Control','public, max-age=86400');return res.end(fs.readFileSync(path.join(root,'public','img',img[1]+'.jpg')));}
        const name=staticFiles[u.pathname];if(name){res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');return res.end(fs.readFileSync(path.join(root,'public',name)));}
      }
      fail(404,'Not found.');
    }catch(e){if(!e.status){console.error(e);/* fail closed on storage errors only; restart restores last durable snapshot */if(e.storage){server.close();setTimeout(()=>{if(!config.noExit)process.exit(1);},50).unref();}}if(!res.headersSent)respond(res,e.status??500,{error:e.status?e.message:'Storage or server error. Please reconnect.'});else res.end();}
  });
  return {server,stop:()=>{clearInterval(ticker);clearInterval(heartbeat);for(const c of streams)c.res.end();server.closeAllConnections();return new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=createApp();const port=Number(process.env.PORT??3000);app.server.listen(port,process.env.BIND??'0.0.0.0',()=>console.log(`Persephone ready on port ${port}`));
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.stop().then(()=>process.exit(0)));
}
