// Optional cross-device sync through Supabase. No accounts: a random sync code is the only key.
// Every sync is pull → non-destructive merge → push, and the merge is idempotent, so devices converge
// without ping-ponging. Local data always wins; remote data only fills gaps.
import {validate,blank} from './storage.js';
import {SYNC_CONFIG} from './sync-config.js';

export const CODE_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const DEBOUNCE_MS=2500,TIMEOUT_MS=15000,MAX_PAYLOAD_CHARS=2400000; // server hard cap is 3,000,000
// Device-local state that is never uploaded and never taken from the server.
// (Running timers and in-progress mocks would double-credit time; history/conflicts/corrections are
//  per-device audit and undo data that cannot be merged safely without deletion tombstones.)
export const LOCAL_ONLY=['rev','timer','attemptTimer','history','conflicts','corrections','lastExport'];

export const normalizeCode=v=>String(v??'').trim().toLowerCase();
export function newCode(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
  const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const empty=v=>v==null||(typeof v==='string'&&!v.trim())||(Array.isArray(v)&&!v.length)||(isObj(v)&&!Object.keys(v).length);
const hasNote=n=>isObj(n)&&!!(String(n.text||'').trim()||String(n.code||'').trim());
const unsafeKey=k=>k==='__proto__'||k==='constructor'||k==='prototype';
export const canon=v=>JSON.stringify(v,(k,x)=>isObj(x)?Object.fromEntries(Object.keys(x).sort().map(y=>[y,x[y]])):x);

const LISTS=['attempts','events','sessions','cards','mocks','deferred'];
const idOf={deferred:x=>x.id??`${x.question}|${x.reason}`},keyer=k=>idOf[k]||(x=>x.id);
/** What gets uploaded: the state minus device-local fields and unfinished mocks, in a canonical order
 *  (so two devices holding the same records always produce identical payloads and skip redundant pushes). */
export function buildPayload(state){
  const p=structuredClone(state),b=blank();
  for(const k of LOCAL_ONLY){if(k in b)p[k]=structuredClone(b[k]);else delete p[k];}
  p.mocks=p.mocks.filter(m=>m.finished);
  for(const k of LISTS){const id=keyer(k);p[k].sort((x,y)=>String(id(x))<String(id(y))?-1:String(id(x))>String(id(y))?1:0);}
  p.bookmarks.sort((x,y)=>String(x)<String(y)?-1:String(x)>String(y)?1:0);
  return p;
}

const fillMissing=(dst,src)=>{let n=0;for(const [k,v] of Object.entries(src)){if(unsafeKey(k))continue;if(!(k in dst)||empty(dst[k])){if(!empty(v)){dst[k]=structuredClone(v);n++;}}else if(isObj(dst[k])&&isObj(v))n+=fillMissing(dst[k],v);}return n;};

/**
 * Merge `remote` into `local` IN PLACE. Never overwrites a local record that has content.
 * Idempotent: merging the same remote twice changes nothing the second time.
 * Returns {changed, added, differing} (differing = notes where both sides have different content).
 */
export function mergeRemote(local,remote){
  let added=0,differing=0;
  const when=x=>Number.isFinite(x.at)?x.at:Number.isFinite(x.started)?x.started:null;
  for(const k of LISTS){
    const id=keyer(k),have=new Set(local[k].map(id));let n=0;
    for(const x of remote[k]||[]){
      if(k==='mocks'&&!x.finished)continue;
      const key=id(x);if(have.has(key))continue;
      local[k].push(structuredClone(x));have.add(key);n++;
    }
    added+=n;
    if(n&&local[k].every(x=>when(x)!==null))local[k].sort((x,y)=>when(x)-when(y)); // keep chronological order (stable)
  }
  for(const b of remote.bookmarks||[])if(!local.bookmarks.includes(b)){local.bookmarks.push(b);added++;}
  for(const [q,n] of Object.entries(remote.notes||{})){
    if(unsafeKey(q))continue;
    const mine=local.notes[q];
    if(!hasNote(mine)){if(hasNote(n)){local.notes[q]=structuredClone(n);added++;}}
    else if(hasNote(n)&&(n.text!==mine.text||(n.code||'')!==(mine.code||'')))differing++;
  }
  for(const [q,r] of Object.entries(remote.reviews||{})){if(unsafeKey(q))continue;if(!(q in local.reviews)){local.reviews[q]=structuredClone(r);added++;}}
  added+=fillMissing(local.missions,remote.missions||{});
  added+=fillMissing(local.pauses,remote.pauses||{});
  if(!local.settings&&remote.settings){ // fresh browser: adopt the plan; an existing local plan is never replaced
    local.settings=structuredClone(remote.settings);local.plan=structuredClone(remote.plan||[]);
    if(remote.backlog)local.backlog=structuredClone(remote.backlog);added++;
  }
  return {changed:added>0,added,differing};
}

class SyncError extends Error{constructor(m,{status=0,transient=false}={}){super(m);this.status=status;this.transient=transient;}}

export function createSync({store,storage,fetchImpl,config=SYNC_CONFIG,debounce=DEBOUNCE_MS}={}){
  storage=storage||globalThis.localStorage;
  const doFetch=fetchImpl||((...a)=>globalThis.fetch(...a));
  const codeKey=store.key+':sync-code',lastKey=store.key+':sync-last';
  const read=k=>{try{return storage.getItem(k);}catch{return null;}};
  const write=(k,v)=>{try{storage.setItem(k,v);}catch{}};
  const configured=!!(config?.url&&config?.key);
  const listeners=new Set(),emit=()=>listeners.forEach(f=>{try{f();}catch{}});
  let code=normalizeCode(read(codeKey));if(!CODE_RE.test(code)){code=newCode();write(codeKey,code);}
  let lastSynced=+read(lastKey)||null,error='',note='',phase='idle',timer=null,retryTimer=null,retryMs=0,running=null,rerun=false,applying=false,started=false,lastFp=null,dirty=false;
  const blankFp=canon(buildPayload(blank())),fingerprint=()=>canon(buildPayload(store.get()));

  async function rpc(name,args){
    if(globalThis.navigator?.onLine===false)throw new SyncError('You are offline.',{transient:true});
    const headers={'Content-Type':'application/json',apikey:config.key};
    if(!config.key.startsWith('sb_'))headers.Authorization='Bearer '+config.key; // legacy JWT keys need it; sb_publishable_ keys must not send it
    const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),TIMEOUT_MS);
    let res;
    try{res=await doFetch(`${config.url}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(args),signal:ctl.signal});}
    catch(e){throw new SyncError(e?.name==='AbortError'?'The sync server took too long to respond.':'Could not reach the sync server.',{transient:true});}
    finally{clearTimeout(t);}
    if(!res.ok){
      let msg='';try{msg=(await res.json()).message||'';}catch{}
      if(res.status===404&&/function/i.test(msg))msg='The sync functions are not installed in Supabase yet. Run supabase/sync.sql.';
      throw new SyncError(msg||`Sync server returned HTTP ${res.status}.`,{status:res.status,transient:res.status>=500||res.status===429});
    }
    if(res.status===204)return null;
    try{return await res.json();}catch{throw new SyncError('The sync server sent an unreadable response.');}
  }

  async function cycle(c,push){
    if(store.fault())throw new SyncError('Local data needs recovery before it can sync.');
    const row=await rpc('get_sync_payload',{p_code:c}),remote=row?.payload??null;
    let info={added:0,differing:0};
    if(remote){
      try{validate(remote);}catch(e){throw new SyncError('Server data was not applied (nothing was uploaded): '+e.message);}
      info=mergeRemote(structuredClone(store.get()),remote);
      if(info.changed){
        applying=true;
        try{await store.change(next=>{mergeRemote(next,remote);return next;});}finally{applying=false;}
      }
    }
    const payload=buildPayload(store.get()),fp=canon(payload);
    if(fp.length>MAX_PAYLOAD_CHARS)throw new SyncError('Your data is too large to sync. Export a backup and trim old notes.');
    // Upload when the server is missing something we have, or when this browser has unsynced local edits.
    // Merely loading the page never overwrites the server copy of a record that differs between devices.
    const remoteLacks=!remote||mergeRemote(structuredClone(remote),payload).changed;
    if(fp!==blankFp&&(remoteLacks||(push&&canon(remote)!==fp)))await rpc('upsert_sync_payload',{p_code:c,p_payload:payload});
    return {fp,info};
  }

  function syncNow({force=false}={}){
    clearTimeout(timer);timer=null;clearTimeout(retryTimer);retryTimer=null;
    if(!configured)return Promise.resolve(false);
    if(running){rerun=true;dirty=dirty||force;return running;}
    running=(async()=>{
      let ok=false,first=force;
      do{
        rerun=false;phase='syncing';emit();
        const c=code,push=dirty||first;dirty=false;first=false;
        try{
          const {fp,info}=await cycle(c,push);
          if(c!==code){rerun=true;continue;} // code switched mid-flight; go again with the new one
          lastFp=fp;lastSynced=Date.now();write(lastKey,String(lastSynced));error='';retryMs=0;ok=true;
          note=info.differing?` · ${info.differing} note${info.differing>1?'s differ':' differs'} on another device (this device's version kept)`:'';
        }catch(e){
          error=e?.message||String(e);ok=false;note='';if(push)dirty=true;
          if(e?.transient){retryMs=Math.min((retryMs||15000)*2,300000);retryTimer=setTimeout(()=>syncNow(),retryMs);}
        }
      }while(rerun&&!error);
      phase='idle';running=null;emit();return ok;
    })();
    return running;
  }
  function schedule(){if(!configured)return;clearTimeout(timer);timer=setTimeout(()=>{timer=null;syncNow();},debounce);emit();}
  const onStore=()=>{if(applying)return;if(fingerprint()!==lastFp){dirty=true;schedule();}};

  function start(){
    if(!configured||started)return;started=true;
    store.on(onStore);
    globalThis.addEventListener?.('online',()=>{syncNow();});
    return syncNow(); // quiet pull → merge → push on page load
  }
  const check=v=>{const c=normalizeCode(v);if(!CODE_RE.test(c))throw new Error('That is not a valid sync code. It looks like xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx.');return c;};
  /** true if the server already has data under this code */
  async function probe(v){const row=await rpc('get_sync_payload',{p_code:check(v)});return !!row?.payload;}
  /** Switch to another browser's code, merge both ways, then sync. Local data is never discarded. */
  async function setCode(v){
    const c=check(v);if(c===code)return syncNow();
    code=c;write(codeKey,c);lastFp=null;lastSynced=null;write(lastKey,'');error='';note='';emit();
    return syncNow();
  }
  const when=ms=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(ms);
  function statusText(){
    if(!configured)return 'Sync is not configured for this site.';
    if(phase==='syncing')return 'Syncing…';
    const last=lastSynced?`Last synced ${when(lastSynced)}`:'Not synced yet';
    if(error)return `Sync problem: ${error}${lastSynced?' · '+last:''}`;
    return last+(timer?' · changes waiting to sync':'')+note+'.';
  }
  return {configured,code:()=>code,start,syncNow,schedule,probe,setCode,statusText,busy:()=>!!running,hasError:()=>!!error,on:f=>{listeners.add(f);return()=>listeners.delete(f);}};
}
