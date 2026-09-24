// A DOM adapter smoke test, not a real browser or layout test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('app renders every route and saves onboarding, notes, outcomes and bookmarks with a DOM adapter',async()=>{
 const documentEvents={},windowEvents={},nodes=new Map(),data=new Map();
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:'',open:false,style:{},dataset:{},focus(){},showModal(){this.open=true},close(){this.open=false},addEventListener(){},classList:{toggle(){}}});return nodes.get(key);};
 globalThis.document={querySelector:node,activeElement:{focus(){}},body:{classList:{toggle(){}}},addEventListener:(k,f)=>documentEvents[k]=f,createElement:()=>({click(){}})};
 globalThis.window={addEventListener:(k,f)=>windowEvents[k]=f};
 globalThis.location={pathname:'/repository-name/',hash:''};
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 Object.defineProperty(globalThis,'navigator',{value:{locks:{request:async(k,f)=>f()}}});
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(readFileSync(url))});
 globalThis.FormData=class{constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}};
 const interval=globalThis.setInterval,timeout=globalThis.setTimeout;globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;
 try{
 await import('../js/app.js');
 const submit=async(id,values,dataset={})=>documentEvents.submit({preventDefault(){},target:{id,values,dataset}});
 const click=async(action,dataset={})=>documentEvents.click({target:{closest:()=>({dataset:{action,...dataset}})}});
 const state=()=>JSON.parse(data.get('dsa-forge:v1:/repository-name/'));
 await submit('setup-form',{name:'Test learner',experience:'Some Java',zone:'Asia/Kolkata',start:'2026-09-24',time:'19:00',strict:'on',rhythm:'25',cap0:'90',cap1:'150',cap2:'150',cap3:'150',cap4:'150',cap5:'150',cap6:'240'});
 assert.equal(state().plan.length,90);assert.match(node('#main').innerHTML,/Make today count/);
 await click('question',{id:'1'});assert.match(node('#dialog-body').innerHTML,/Two Sum/);
 node('#note-text').value='Lookup before insert';node('#note-code').value='int x = 1;';node('#note-tags').value='hash';node('#note-url').value='';
 await click('save-note');assert.equal(state().notes[1].text,'Lookup before insert');
 await submit('outcome-form',{note:'Earlier complements prevent self-use',outcome:'Independent',confidence:'3'},{id:'1',kind:'attempt'});
 assert.equal(state().attempts.length,1);assert.ok(state().reviews[1]);
 await click('bookmark',{id:'1'});assert.deepEqual(state().bookmarks,[1]);
 for(const route of ['today','roadmap','questions','review','knowledge','notebook','mocks','progress','settings']){location.hash='#'+route;windowEvents.hashchange();assert.match(node('#main').innerHTML,/<h1>/,route);if(route==='settings')assert.match(node('#main').innerHTML,/Sync across devices[\s\S]*Copy code[\s\S]*Sync now[\s\S]*Use this code/);}
 location.hash='#settings';windowEvents.hashchange();await click('sync-now');assert.match(node('#toast').textContent,/unreadable response/);node('#sync-link-input').value='';await click('sync-link');assert.match(node('#toast').textContent,/Paste a sync code/);node('#sync-link-input').value='hello';await click('sync-link');assert.match(node('#toast').textContent,/not a valid sync code/);
 await click('timer-start');const first=state().timer.id;await click('timer-start');assert.equal(state().timer.id,first,'duplicate starts must not create a second timer');
 }finally{globalThis.setInterval=interval;globalThis.setTimeout=timeout;}
});
