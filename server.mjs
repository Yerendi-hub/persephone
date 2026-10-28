// Platform server: auth, participants, nicknames, game selection, persistence and realtime.
// The rules of each game live in games/<id>/index.mjs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fail} from './lib/util.mjs';
import * as persephone from './games/persephone/index.mjs';
import * as pumpkin from './games/pumpkin/index.mjs';
import * as shadow from './games/shadow/index.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const GAMES={persephone,pumpkin,shadow};
// Only images that actually exist are served and preloaded, so a game can ship before all art is ready.
const file=n=>/\.(jpg|png)$/.test(n)?n:n+'.jpg';
const MEDIA=Object.fromEntries(Object.values(GAMES).map(g=>[g.id,g.images.map(file).filter(n=>fs.existsSync(path.join(root,'games',g.id,'img',n)))]));
const SCHEMA=5;

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
  // Nicknames survive game changes and resets; everything else starts fresh.
  const fresh=(game=null,names={})=>({schema:SCHEMA,run:crypto.randomUUID(),code:crypto.randomBytes(3).toString('hex').toUpperCase(),revision:0,stage:0,game,members:[],names,audit:[],commands:[],g:game?GAMES[game].fresh():null});
  let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fresh();
  if(state.schema!==SCHEMA||(state.game&&!GAMES[state.game])){fs.renameSync(file,path.join(dir,`archive-schema${state.schema}-${Date.now()}.json`));console.log('Archived state from an older version; starting fresh.');state=fresh();}
  const engine=()=>state.game?GAMES[state.game]:null;
  const save=()=>{try{const fd=fs.openSync(file+'.tmp','w');try{fs.writeFileSync(fd,JSON.stringify(state));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(file+'.tmp',file);}catch(e){e.storage=true;throw e;}};
  engine()?.recover(state.g);
  save();

  const streams=new Set(),attempts=new Map();
  function sign(payload){const b=Buffer.from(JSON.stringify(payload)).toString('base64url');return b+'.'+crypto.createHmac('sha256',secret).update(b).digest('base64url');}
  function identity(req){try{const raw=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('persephone='))?.slice(11);const [b,s]=raw.split('.');const expected=sign(JSON.parse(Buffer.from(b,'base64url'))).split('.')[1];if(!s||s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;const p=JSON.parse(Buffer.from(b,'base64url'));return p.exp>Date.now()?p:null;}catch{return null;}}
  function cookie(res,role,id){res.setHeader('Set-Cookie',`persephone=${sign({role,id,exp:Date.now()+12*3600000})}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure?'; Secure':''}`);}

  function snapshot(who){
    const host=who?.role==='host',member=state.members.includes(who?.id),e=engine();
    const data={run:state.run,revision:state.revision,stage:state.stage,serverNow:Date.now(),participants:state.members.length,maxParticipants,joinUrl:publicUrl+'/join',
      joined:host||member,game:state.game,gameTitle:e?.title??null,needsName:!!e?.needsName,name:member?state.names[who.id]??null:null,
      media:e?MEDIA[e.id].map(n=>`/img/${e.id}/${n}`):[]};
    if(host){data.games=Object.values(GAMES).map(g=>({id:g.id,title:g.title,tagline:g.tagline}));data.code=state.code;data.audit=state.audit.slice(-12);}
    if(e)Object.assign(data,e.snapshot(state.g,{who,host,member,names:state.names,members:state.members}));
    if(!e&&host)data.script='Choose a game. Phones and the shared screen wait on a neutral "starting soon" page until you do.';
    return data;
  }
  function publish(){for(const c of streams){if(c.res.writableLength>65536){c.res.destroy();streams.delete(c);continue;}c.res.write('data: '+JSON.stringify(snapshot(c.who))+'\n\n');}}
  function commit(label,stage=false){state.revision++;if(stage)state.stage++;state.audit.push({at:new Date().toISOString(),action:label});state.audit=state.audit.slice(-200);save();publish();}
  const ticker=setInterval(()=>{const e=engine();if(!e)return;const label=e.tick(state.g);if(label)commit(label,true);},200);
  const heartbeat=setInterval(()=>{for(const c of streams)c.res.write(': heartbeat\n\n');for(const [k,v] of attempts)if(v.until<Date.now())attempts.delete(k);},15000);
  function limit(req,key,max){const k=key+clientKey(req),v=attempts.get(k)??{n:0,until:Date.now()+60000};if(v.until<Date.now()){v.n=0;v.until=Date.now()+60000;}v.n++;attempts.set(k,v);if(v.n>max)fail(429,'Too many attempts. Try again in one minute.');}
  async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16384)fail(413,'Request too large.');}let v;try{v=JSON.parse(raw||'{}');}catch{fail(400,'Invalid JSON.');}if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'Expected a JSON object.');return v;}
  function respond(res,status,data){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
  const STATIC={'/':'index.html','/join':'index.html','/screen':'index.html','/control':'index.html','/app.js':'app.js','/lib.js':'lib.js','/persephone.js':'persephone.js','/pumpkin.js':'pumpkin.js','/shadow.js':'shadow.js','/style.css':'style.css'};
  const archive=()=>fs.copyFileSync(file,path.join(dir,`archive-${state.run}.json`));

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
          const id=who?.role==='participant'?who.id:crypto.randomUUID();if(!state.members.includes(id)){if(state.members.length>=maxParticipants)fail(409,`This game has reached ${maxParticipants} participants.`);state.members.push(id);commit('participant joined');}cookie(res,'participant',id);return respond(res,200,{ok:true});
        }
        if(u.pathname==='/api/name'){
          if(!who||who.role!=='participant'||!state.members.includes(who.id))fail(401,'Join first.');
          const name=String(b.name??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim();
          if(name.length<2||name.length>20)fail(400,'Use 2–20 characters.');
          if(state.members.some(m=>m!==who.id&&state.names[m]?.toLowerCase()===name.toLowerCase()))fail(409,'This name is taken. Try another one.');
          state.names[who.id]=name;commit('name');return respond(res,200,snapshot(who));
        }
        if(u.pathname==='/api/vote'||u.pathname==='/api/act'){
          if(!who||who.role!=='participant'||!state.members.includes(who.id))fail(401,'Join first.');
          const e=engine();if(!e||b.run!==state.run)fail(409,'This game has changed. Refresh the page.');
          if(e.needsName&&!state.names[who.id])fail(409,'Choose a name first.');
          const label=e.action(state.g,who,b);commit(label);return respond(res,200,snapshot(who));
        }
        if(u.pathname==='/api/control'){
          if(who?.role!=='host')fail(401,'Host login required.');
          if(typeof b.commandId!=='string'||b.commandId.length>80)fail(400,'Command ID required.');
          if(state.commands.includes(b.commandId))return respond(res,200,snapshot(who));
          if(b.stage!==state.stage||b.run!==state.run)fail(409,'State changed. Review the refreshed screen and try again.');
          let label;
          if(b.action==='select'){
            if(b.game!==null&&!GAMES[b.game])fail(400,'Unknown game.');
            archive();state=fresh(b.game,state.names);label='select '+(b.game??'none');
          }else if(b.action==='reset'){
            if(b.confirm!=='RESET')fail(400,'Type RESET to start this game again.');
            archive();state=fresh(state.game,state.names);label='reset';
          }else{
            const e=engine();if(!e)fail(409,'Choose a game first.');label=e.control(state.g,b);
          }
          state.commands.push(b.commandId);state.commands=state.commands.slice(-100);commit(label,true);return respond(res,200,snapshot(who));
        }
        fail(404,'Not found.');
      }
      if(req.method==='GET'){
        const img=/^\/img\/([a-z]+)\/([a-z0-9-]+\.(jpg|png))$/.exec(u.pathname);
        if(img&&MEDIA[img[1]]?.includes(img[2])){res.setHeader('Content-Type',img[3]==='png'?'image/png':'image/jpeg');res.setHeader('Cache-Control','public, max-age=86400');return res.end(fs.readFileSync(path.join(root,'games',img[1],'img',img[2])));}
        const name=STATIC[u.pathname];if(name){res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');return res.end(fs.readFileSync(path.join(root,'public',name)));}
      }
      fail(404,'Not found.');
    }catch(e){if(!e.status){console.error(e);/* fail closed on storage errors only; restart restores last durable snapshot */if(e.storage){server.close();setTimeout(()=>{if(!config.noExit)process.exit(1);},50).unref();}}if(!res.headersSent)respond(res,e.status??500,{error:e.status?e.message:'Storage or server error. Please reconnect.'});else res.end();}
  });
  return {server,stop:()=>{clearInterval(ticker);clearInterval(heartbeat);for(const c of streams)c.res.end();server.closeAllConnections();return new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=createApp();const port=Number(process.env.PORT??3000);app.server.listen(port,process.env.BIND??'0.0.0.0',()=>console.log(`Halloween games ready on port ${port}`));
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.stop().then(()=>process.exit(0)));
}
