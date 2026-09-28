import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {blank,createStore} from '../js/storage.js';
import {createSync,mergeRemote,buildPayload,canon,newCode,normalizeCode,CODE_RE} from '../js/sync.js';

const jwt='eyJhbGciOiJIUzI1NiJ9.e30.sig';
// Simulates the two Supabase RPCs (code validation, one row per code) and Postgres jsonb key reordering.
const jsonb=v=>{const r=x=>Array.isArray(x)?x.map(r):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.length-b.length||(a<b?-1:1)).map(k=>[k,r(x[k])])):x;return r(JSON.parse(JSON.stringify(v)));};
function server(){
  const rows=new Map(),log=[],s={rows,log,down:false,seen:[]};
  const res=(status,body)=>({ok:status<400,status,json:async()=>body});
  s.fetchImpl=async(url,{body,headers})=>{
    if(s.down)throw new TypeError('fetch failed');
    const name=url.split('/rpc/')[1],a=JSON.parse(body),c=String(a.p_code).trim().toLowerCase();s.seen.push(headers);log.push(name);
    if(!CODE_RE.test(c))return res(400,{message:'Invalid sync code'});
    if(name==='get_sync_payload'){const r=rows.get(c);return res(200,r?{payload:r.payload,updated_at:'2026-09-24T00:00:00Z'}:null);}
    if(name==='upsert_sync_payload'){if(!a.p_payload||typeof a.p_payload!=='object'||Array.isArray(a.p_payload))return res(400,{message:'Payload must be a JSON object'});rows.set(c,{payload:jsonb(a.p_payload)});return res(200,'2026-09-24T00:00:00Z');}
    return res(404,{message:'Could not find the function public.'+name});
  };
  s.upserts=()=>log.filter(x=>x==='upsert_sync_payload').length;
  return s;
}
const settings=()=>({name:'',experience:'Some Java',capacity:[90,150,150,150,150,150,240],zone:'Asia/Kolkata',start:'2026-09-23',time:'19:00',theme:'dark'});
function device(srv,{debounce=2500,key=jwt}={}){
  const data=new Map(),storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
  const store=createStore('/repo/',storage),sync=createSync({store,storage,fetchImpl:srv.fetchImpl,config:{url:'https://x.supabase.co',key},debounce});
  const get=()=>store.get(),onboard=()=>store.change(s=>{s.settings=settings();}),edit=fn=>store.change(s=>{fn(s);});
  const attempt=(id,at)=>({id,question:1,at,day:'2026-09-23',outcome:'Independent',kind:'attempt',note:'n'});
  return {store,sync,storage,get,onboard,edit,attempt};
}
const settle=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};

test('sync codes: random UUIDv4, normalised, weak codes rejected',()=>{
  assert.match(newCode(),CODE_RE);assert.notEqual(newCode(),newCode());
  assert.equal(normalizeCode('  ABCDEF12-ABCD-4ABC-8ABC-ABCDEF123456\n'),'abcdef12-abcd-4abc-8abc-abcdef123456');
  for(const bad of ['hello','','11111111-1111-1111-8111-111111111111','%',"' or 1=1 --"])assert.ok(!CODE_RE.test(bad),bad);
});

test('mergeRemote never overwrites local content, fills gaps, and is idempotent',()=>{
  const l=blank(),r=blank();
  l.settings=settings();r.settings={...settings(),start:'2030-01-01'};
  l.plan=[{date:'2026-09-23',questions:[1],capacity:90,number:1,total:60}];r.plan=[];
  l.notes[1]={text:'mine',code:'',updated:1};r.notes[1]={text:'theirs',code:'x',updated:2};
  l.notes[2]={text:'  ',code:'',updated:1};r.notes[2]={text:'filled from remote',code:'',updated:2};
  r.notes[3]={text:'new',code:'',updated:2};
  l.reviews[1]={stage:2,due:'2026-10-01',confidence:3};r.reviews[1]={stage:0,due:'2026-09-24',confidence:1};r.reviews[9]={stage:1,due:'2026-09-30',confidence:3};
  l.missions['2026-09-23']={lesson:'mine'};r.missions['2026-09-23']={lesson:'theirs',review:'extra'};
  l.attempts=[{id:'a',question:1,at:5,note:'local'}];r.attempts=[{id:'a',question:1,at:5,note:'REMOTE'},{id:'b',question:2,at:3,note:'r'}];
  l.bookmarks=[1];r.bookmarks=[1,2];
  r.mocks=[{id:'m1',started:1,minutes:1,questions:[1],finished:null},{id:'m2',started:1,minutes:1,questions:[1],finished:5,rubric:{}}];
  r.timer={id:'t',started:1,duration:1,kind:'focus'};r.history=[{id:'h',action:'x'}];r.conflicts=[{id:'c',note:'x'}];r.corrections={5:false};
  const out=mergeRemote(l,r);
  assert.equal(l.settings.start,'2026-09-23');assert.equal(l.plan.length,1);
  assert.equal(l.notes[1].text,'mine');assert.equal(l.notes[2].text,'filled from remote');assert.equal(l.notes[3].text,'new');assert.equal(out.differing,1);
  assert.equal(l.reviews[1].stage,2);assert.equal(l.reviews[9].stage,1);
  assert.deepEqual(l.missions['2026-09-23'],{lesson:'mine',review:'extra'});
  assert.equal(l.attempts.find(a=>a.id==='a').note,'local');assert.deepEqual(l.attempts.map(a=>a.id),['b','a'],'chronological');
  assert.deepEqual(l.bookmarks,[1,2]);
  assert.deepEqual(l.mocks.map(m=>m.id),['m2'],'unfinished remote mocks are not adopted');
  assert.equal(l.timer,null);assert.equal(l.history.length,0);assert.equal(l.conflicts.length,0);assert.deepEqual(l.corrections,{});
  assert.equal(mergeRemote(l,r).changed,false,'second merge is a no-op');
});

test('fresh browser adopts settings and plan; unsafe keys are ignored',()=>{
  const l=blank(),r=blank();r.settings=settings();r.plan=[{date:'2026-09-23',questions:[],capacity:90,number:1,total:1}];
  r.notes=JSON.parse('{"__proto__":{"text":"x"},"4":{"text":"ok","code":""}}');
  mergeRemote(l,r);
  assert.equal(l.settings.start,'2026-09-23');assert.equal(l.plan.length,1);assert.equal(l.notes[4].text,'ok');
  assert.equal(Object.getPrototypeOf(l.notes),Object.prototype);assert.equal({}.text,undefined);
});

test('payload leaves out device-local state and unfinished mocks, and is canonical',()=>{
  const s=blank();s.settings=settings();s.lastExport='2026-09-20';s.rev=42;
  s.timer={id:'t',started:1,duration:1500000,kind:'focus'};s.history=[{id:'h',at:1,action:'x'}];s.corrections={1:false};
  s.mocks=[{id:'a',started:1,minutes:1,questions:[1],finished:null},{id:'b',started:1,minutes:1,questions:[1],finished:5,rubric:{}}];
  s.events=[{id:'z',day:'2026-09-23',note:'n'},{id:'a',day:'2026-09-23',note:'n'}];
  const p=buildPayload(s);
  assert.equal(p.timer,null);assert.equal(p.rev,0);assert.deepEqual(p.history,[]);assert.deepEqual(p.corrections,{});assert.ok(!('lastExport' in p));
  assert.deepEqual(p.mocks.map(m=>m.id),['b']);assert.deepEqual(p.events.map(e=>e.id),['a','z']);
  assert.equal(s.timer.id,'t','source state untouched');
});

test('two browsers converge, and further syncs make no redundant writes',async()=>{
  const srv=server(),A=device(srv),B=device(srv);
  await A.onboard();await A.edit(s=>{s.attempts.push(A.attempt('a1',1000));s.notes[1]={text:'from A',code:'',updated:1};s.reviews[1]={stage:0,due:'2026-09-24',confidence:3};});
  assert.equal(await A.sync.syncNow(),true);assert.equal(srv.rows.size,1);
  assert.equal(await B.sync.setCode(A.sync.code()),true);
  assert.equal(B.get().settings.start,'2026-09-23','fresh browser adopted the plan');
  assert.equal(B.get().notes[1].text,'from A');assert.equal(B.get().attempts.length,1);
  await B.edit(s=>{s.attempts.push({...B.attempt('b1',2000),question:2});});
  await B.sync.syncNow();await A.sync.syncNow();
  assert.deepEqual(A.get().attempts.map(a=>a.id),['a1','b1']);
  assert.equal(canon(buildPayload(A.get())),canon(buildPayload(B.get())));
  const before=srv.upserts();
  await A.sync.syncNow();await B.sync.syncNow();await A.sync.syncNow();
  assert.equal(srv.upserts(),before,'converged: nothing more to upload');
});

test('devices with different histories merge without ping-pong; local answers stay put',async()=>{
  const srv=server(),A=device(srv),B=device(srv);
  await A.onboard();await B.onboard();
  await A.edit(s=>{s.attempts.push(A.attempt('a1',1000));s.notes[1]={text:'A wrote this',code:'',updated:1};});
  await B.edit(s=>{s.attempts.push({...B.attempt('b1',500),question:3});s.notes[1]={text:'B wrote this',code:'',updated:9};});
  await A.sync.syncNow();
  await B.sync.setCode(A.sync.code());
  await A.sync.syncNow();
  assert.equal(A.get().notes[1].text,'A wrote this');assert.equal(B.get().notes[1].text,'B wrote this');
  assert.match(B.sync.statusText(),/1 note differs/);
  assert.deepEqual(A.get().attempts.map(a=>a.id),['b1','a1']);assert.deepEqual(B.get().attempts.map(a=>a.id),['b1','a1']);
  const before=srv.upserts();
  for(let i=0;i<3;i++){await A.sync.syncNow();await B.sync.syncNow();}
  assert.equal(srv.upserts(),before,'a differing note alone never causes uploads on load or background sync');
  assert.equal(A.get().attempts.length,2);assert.equal(B.get().attempts.length,2);
  assert.equal(A.get().notes[1].text,'A wrote this');assert.equal(B.get().notes[1].text,'B wrote this');
  assert.equal(A.get().history.length,0,'sync adds no history entries');
});

test('a blank browser pulls but never creates a server row',async()=>{
  const srv=server(),A=device(srv);
  assert.equal(await A.sync.syncNow(),true);assert.equal(srv.rows.size,0);assert.equal(srv.upserts(),0);
  assert.match(A.sync.statusText(),/Last synced/);
});

test('invalid or newer remote data is rejected without uploading or changing local state',async()=>{
  const srv=server(),A=device(srv);await A.onboard();await A.edit(s=>{s.attempts.push(A.attempt('a1',1));});
  const before=canon(A.get());
  for(const bad of [{schema:99},{...blank(),attempts:'nope'},{...blank(),cards:[{id:'c',title:'t',explanation:'e',sourceUrl:'javascript:alert(1)'}]}]){
    srv.rows.set(A.sync.code(),{payload:bad});
    assert.equal(await A.sync.syncNow(),false);
    assert.match(A.sync.statusText(),/not applied/);
  }
  assert.equal(srv.upserts(),0);assert.equal(canon(A.get()),before);
});

test('timers and unfinished mocks never leave the device',async()=>{
  const srv=server(),A=device(srv);await A.onboard();
  await A.edit(s=>{s.timer={id:'t',started:1,duration:1500000,kind:'focus'};s.mocks.push({id:'m',started:1,minutes:1,questions:[1],finished:null});s.attempts.push(A.attempt('a1',1));});
  await A.sync.syncNow();
  const p=srv.rows.get(A.sync.code()).payload;
  assert.equal(p.timer,null);assert.deepEqual(p.mocks,[]);assert.equal(p.attempts.length,1);
  assert.equal(A.get().timer.id,'t');
});

test('saves are debounced into one background sync',async()=>{
  mock.timers.enable({apis:['setTimeout']});
  try{
    const srv=server(),A=device(srv);await A.onboard();
    await A.sync.start();srv.log.length=0;
    await A.edit(s=>{s.attempts.push(A.attempt('a1',1));});
    mock.timers.tick(2000);await A.edit(s=>{s.attempts.push(A.attempt('a2',2));});
    mock.timers.tick(2000);await A.edit(s=>{s.attempts.push(A.attempt('a3',3));});
    mock.timers.tick(2499);await settle();assert.equal(srv.log.length,0,'nothing sent before 2.5 s of quiet');
    mock.timers.tick(1);await settle();
    assert.deepEqual(srv.log,['get_sync_payload','upsert_sync_payload']);
    assert.equal(srv.rows.get(A.sync.code()).payload.attempts.length,3);
    // a timer tick (device-local change) must not trigger a network call
    srv.log.length=0;await A.edit(s=>{s.timer={id:'t',started:1,duration:1,kind:'focus'};});mock.timers.tick(3000);await settle();
    assert.equal(srv.log.length,0);
  }finally{mock.timers.reset();}
});

test('network failure is reported, retried, and recovers',async()=>{
  mock.timers.enable({apis:['setTimeout']});
  try{
    const srv=server(),A=device(srv);await A.onboard();srv.down=true;
    assert.equal(await A.sync.syncNow(),false);assert.match(A.sync.statusText(),/Could not reach the sync server/);
    srv.down=false;mock.timers.tick(30000);await settle();
    assert.equal(A.sync.hasError(),false);assert.equal(srv.rows.size,1);
  }finally{mock.timers.reset();}
});

test('switching codes validates, merges both ways, and reports server errors',async()=>{
  const srv=server(),A=device(srv),B=device(srv);await A.onboard();await B.onboard();
  await A.edit(s=>{s.attempts.push(A.attempt('a1',1));});await A.sync.syncNow();
  await assert.rejects(()=>B.sync.setCode('hello'),/valid sync code/);
  assert.equal(await B.sync.probe(newCode()),false);assert.equal(await B.sync.probe(A.sync.code().toUpperCase()),true);
  await B.sync.setCode(' '+A.sync.code().toUpperCase()+' ');
  assert.equal(B.sync.code(),A.sync.code());assert.equal(B.storage.getItem('dsa-forge:v1:/repo/:sync-code'),A.sync.code());
  assert.equal(B.get().attempts.length,1);
  const original=srv.fetchImpl;srv.fetchImpl=async()=>({ok:false,status:404,json:async()=>({message:'Could not find the function public.get_sync_payload(p_code)'})});
  const C=device(srv);assert.equal(await C.sync.syncNow(),false);assert.match(C.sync.statusText(),/sync\.sql/);srv.fetchImpl=original;
});

test('the code persists per browser and headers match the key type',async()=>{
  const srv=server(),A=device(srv);await A.onboard();await A.sync.syncNow();
  const again=createSync({store:A.store,storage:A.storage,fetchImpl:srv.fetchImpl,config:{url:'https://x.supabase.co',key:jwt}});
  assert.equal(again.code(),A.sync.code());
  assert.equal(srv.seen[0].apikey,jwt);assert.equal(srv.seen[0].Authorization,'Bearer '+jwt);
  const P=device(srv,{key:'sb_publishable_abc'});await P.onboard();await P.sync.syncNow();
  assert.equal(srv.seen.at(-1).apikey,'sb_publishable_abc');assert.ok(!('Authorization' in srv.seen.at(-1)));
});

test('a deliberate edit (or Sync now) replaces the server copy of a differing note; linking alone does not',async()=>{
  const srv=server(),A=device(srv),B=device(srv);await A.onboard();await B.onboard();
  await A.edit(s=>{s.notes[1]={text:'v1',code:'',updated:1};});await A.sync.syncNow();
  await B.sync.setCode(A.sync.code());
  await B.edit(s=>{s.notes[1]={text:'B version',code:'',updated:2};});
  await B.sync.setCode(A.sync.code());
  assert.equal(srv.rows.get(A.sync.code()).payload.notes[1].text,'v1','linking never overwrites the server copy');
  await B.sync.syncNow({force:true});
  assert.equal(srv.rows.get(A.sync.code()).payload.notes[1].text,'B version','explicit Sync now uploads this browser\'s view');
  assert.equal(A.get().notes[1].text,'v1');
  await A.sync.syncNow();assert.equal(A.get().notes[1].text,'v1','A still keeps its own');
});
