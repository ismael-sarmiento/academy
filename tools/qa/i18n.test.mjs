import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let serial=0;
async function fixture(fetcher){
 const old={}; for(const k of ['fetch','document','localStorage','location','history'])old[k]=Object.getOwnPropertyDescriptor(globalThis,k);
 globalThis.fetch=fetcher; const writes=[];
 globalThis.localStorage={getItem:()=>null,setItem:(k,v)=>writes.push(v)};
 globalThis.location={href:'http://127.0.0.1/academy/',search:''};globalThis.history={replaceState(){}};
 globalThis.document={documentElement:{lang:'es'},querySelector:()=>null,querySelectorAll:()=>[]};
 let source=await readFile(new URL('../../js/i18n.js',import.meta.url),'utf8');
 source=source.replace(/^import[^\n]+;\n/gm,'').replace('const SUPPORTED',"const SITE={baseUrl:'http://127.0.0.1/academy/'}; const rememberReadingPosition=()=>()=>{}; const SUPPORTED");
 const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#'+serial++);
 return {m,writes,close(){for(const[k,v]of Object.entries(old)){if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,v);}}};
}
const response=title=>({ok:true,json:async()=>({meta:{title,description:title}})});
test('latest language wins even when an older dictionary arrives last',async()=>{
 const pending={}; const f=await fixture(url=>new Promise(resolve=>{pending[url.includes('/en.')?'en':'es']=resolve;}));
 try{const en=f.m.setLang('en',true);const es=f.m.setLang('es',true);pending.es(response('ES'));await es;pending.en(response('EN'));await en;assert.equal(f.m.currentLang(),'es');assert.equal(f.m.t('meta.title'),'ES');assert.deepEqual(f.writes,['es']);}finally{f.close();}
});
test('failed dictionary retains current language and can be retried',async()=>{
 let calls=0;const f=await fixture(async()=>{if(++calls===1)throw Error('offline');return response('EN');});
 try{await assert.rejects(f.m.setLang('en',true));assert.equal(f.m.currentLang(),'es');assert.deepEqual(f.writes,[]);await f.m.setLang('en',true);assert.equal(f.m.t('meta.title'),'EN');assert.equal(calls,2);}finally{f.close();}
});
test('HTTP error is rejected before JSON and permits retry',async()=>{
 let calls=0;const f=await fixture(async()=>++calls===1?{ok:false,status:503,json:async()=>({meta:{title:'wrong'}})}:response('EN'));
 try{await assert.rejects(f.m.setLang('en'));assert.equal(f.m.currentLang(),'es');await f.m.setLang('en');assert.equal(f.m.t('meta.title'),'EN');}finally{f.close();}
});
test('successful dictionary is cached and only explicit choice is stored',async()=>{
 let calls=0;const f=await fixture(async()=>{calls++;return response('EN');});try{await f.m.setLang('en');await f.m.setLang('en',true);assert.equal(calls,1);assert.deepEqual(f.writes,['en']);assert.equal(document.documentElement.lang,'en');}finally{f.close();}
});
test('unsupported language falls back to Spanish',async()=>{
 const f=await fixture(async url=>{assert.match(url,/es.json/);return response('ES');});try{await f.m.setLang('xx');assert.equal(f.m.currentLang(),'es');assert.equal(f.m.t('meta.title'),'ES');}finally{f.close();}
});
