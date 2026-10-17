const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../hub/launcher.js'),'utf8');
function environment() {
 let time=0, nextTimer=1;const timers=new Map(),globals={},frames=[],pendingDialogEvents=[];
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.attrs={};this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';this.parentElement=null;this.isConnected=true;this.style={overflow:''};this.classes=new Set();this.classList={add:(c)=>this.classes.add(c),remove:(c)=>this.classes.delete(c),contains:(c)=>this.classes.has(c)};if(tag==='iframe'){this.contentWindow={};this.contentDocument={body:{},title:'Experience',querySelector:()=>null};frames.push(this);}}
  set innerHTML(value){this.nodes=[];for(const match of value.matchAll(/<([\w-]+)([^>]*)>/g)){const el=new Element(match[1]);const attrs=match[2];const data=attrs.match(/data-launch="([^"]+)"/);const id=attrs.match(/id="([^"]+)"/);if(data)el.dataset.launch=data[1];if(id)el.id=id[1];if(/\bhidden\b/.test(attrs))el.hidden=true;if(data||id)this.nodes.push(el);}}
  querySelectorAll(selector){if(selector==='[data-launch]')return this.nodes.filter(e=>e.dataset.launch);if(selector==='[data-launch="close"]')return this.nodes.filter(e=>e.dataset.launch==='close');return [];}
  querySelector(selector){if(selector[0]==='#')return this.nodes.find(e=>e.id===selector.slice(1));return null;}
  addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
  dispatch(type,extra={}){for(const fn of this.listeners[type]||[])fn({...extra,preventDefault(){}});}
  appendChild(el){this.children.push(el);el.parentElement=this;el.isConnected=true;return el;}
  prepend(el){this.children.unshift(el);el.parentElement=this;el.isConnected=true;}
  remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(e=>e!==this);}
  setAttribute(name,value){this.attrs[name]=value;}
  removeAttribute(name){delete this.attrs[name];}
  showModal(){this.open=true;}
  close(){this.open=false;pendingDialogEvents.push(()=>this.dispatch('close'));}
  focus(){document.activeElement=this;}
 }
 const document={body:new Element('body'),baseURI:'https://test.example/repository/',activeElement:new Element('button'),createElement:(tag)=>new Element(tag)};
 const window={document,location:{origin:'https://test.example'},isSecureContext:true,addEventListener:(type,fn)=>{(globals[type]||(globals[type]=[])).push(fn)}};
 const timer=(fn,delay,interval)=>{let id=nextTimer++;timers.set(id,{fn,at:time+(delay||0),interval});return id;};
 const sandbox={window,document,navigator:{xr:{isSessionSupported:()=>Promise.resolve(true)}},location:window.location,URL,Promise,Object,console,setTimeout:(f,t)=>timer(f,t,0),clearTimeout:id=>timers.delete(id),setInterval:(f,t)=>timer(f,t,t),clearInterval:id=>timers.delete(id)};
 vm.runInNewContext(source,sandbox);
 const events=[];const launcher=window.PortalHubLauncher.create({version:'qa',onOpen:()=>events.push('open'),onClose:()=>events.push('close'),onLaunch:(a,m)=>events.push(m)});
 function dialog(){return document.body.children[0];}
 function ui(key){return dialog().nodes.find(e=>e.dataset.launch===key);}
 function liveFrames(){return frames.filter(f=>f.isConnected&&f.parentElement);}
 function advance(amount){const target=time+amount;let steps=0;while(1){let entry=[...timers.entries()].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;if(++steps>500)throw Error('timer loop');let [id,t]=entry;time=t.at;if(t.interval)t.at+=t.interval;else timers.delete(id);t.fn();}time=target;}
 function message(data,origin=window.location.origin,source=liveFrames()[0]?.contentWindow){for(const fn of globals.message||[])fn({source,origin,data});}
 const app={title:'Sistema Solar',path:'apps/sistema-solar/',cover:'assets/solar.webp',formats:['3d','vr']};
 return {window,document,sandbox,events,launcher,dialog,ui,frames,liveFrames,timers,advance,message,app,flushDialogEvents:()=>{while(pendingDialogEvents.length)pendingDialogEvents.shift()();}};
}
async function flush(){for(let i=0;i<6;i++)await Promise.resolve();}
(async()=>{
 let count=0;
 {
 const e=environment(),focus=e.document.activeElement;e.document.body.style.overflow='auto';e.launcher.open(e.app,'3d');assert.equal(e.liveFrames().length,1);const f=e.liveFrames()[0];assert.equal(f.src,'https://test.example/repository/apps/sistema-solar/?embed=1&quiosque=0&v=qa');f.dispatch('load');assert.equal(e.dialog().classList.contains('is-viewing'),true);assert.deepEqual(e.events,['open','3d']);e.launcher.close();assert.equal(e.liveFrames().length,0);assert.equal(e.document.activeElement,focus);assert.equal(e.document.body.style.overflow,'auto');assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();let resolve;e.sandbox.navigator.xr.isSessionSupported=()=>new Promise(r=>resolve=r);e.launcher.open(e.app,'vr');await flush();e.launcher.close();resolve(true);await flush();assert.equal(e.liveFrames().length,0);assert.equal(e.dialog().open,false);assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'3d');const old=e.liveFrames()[0];e.launcher.open({...e.app,title:'Célula'},'3d');const latest=e.liveFrames()[0];e.flushDialogEvents();assert.equal(e.dialog().open,true,'stale close event must not close the new experience');old.dispatch('load');assert.equal(e.dialog().classList.contains('is-viewing'),false);latest.dispatch('load');assert.equal(e.dialog().classList.contains('is-viewing'),true);assert.equal(e.liveFrames().length,1);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'vr');await flush();const f=e.liveFrames()[0];let calls=0;f.contentWindow.alternarVR=()=>{calls++;return Promise.resolve()};f.dispatch('load');assert.equal(e.ui('message').textContent,'Controles de VR carregados');assert.equal(calls,0);assert.equal(e.ui('enter').hidden,false);e.ui('enter').dispatch('click');assert.equal(calls,1);assert.equal(e.ui('toolbar-status').textContent.includes('iniciada'),false);e.advance(2000);assert.equal(e.ui('toolbar-status').textContent.includes('Se o VR não abrir'),true);assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'vr');await flush();const f=e.liveFrames()[0];f.contentWindow.PortalHubBridge={requestVR:()=>{}};const data={source:'portal360-app',version:1,type:'ready',canEnterVR:true};e.message(data,'https://evil.example');e.message(data,e.window.location.origin,{});assert.equal(e.ui('enter').hidden,true);e.message(data);assert.equal(e.ui('message').textContent,'Tudo pronto para explorar');e.ui('enter').dispatch('click');assert.equal(e.ui('toolbar-status').textContent.includes('iniciada'),false);e.message({...data,type:'xr-start'});assert.equal(e.ui('toolbar-status').textContent,'Sessão VR iniciada');e.message({...data,type:'xr-end'});assert.equal(e.ui('toolbar-vr').hidden,false);e.message({...data,type:'back'});assert.equal(e.liveFrames().length,0);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'vr');await flush();const f=e.liveFrames()[0];f.contentWindow.alternarVR=()=>Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));f.dispatch('load');e.ui('enter').dispatch('click');await flush();assert.equal(e.ui('toolbar-status').textContent.includes('não autorizado'),true);count++;
 }
 {
 const e=environment();e.sandbox.navigator.xr.isSessionSupported=()=>Promise.resolve(false);e.launcher.open(e.app,'vr');await flush();assert.equal(e.liveFrames().length,0);assert.equal(e.ui('three').hidden,false);assert.equal(e.ui('enter').hidden,true);e.ui('three').dispatch('click');assert.equal(e.liveFrames().length,1);e.liveFrames()[0].dispatch('load');assert.equal(e.dialog().classList.contains('is-viewing'),true);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'vr');await flush();const f=e.liveFrames()[0];f.dispatch('load');e.advance(30100);assert.equal(e.ui('retry').hidden,false);assert.equal(e.ui('message').textContent,'O carregamento demorou mais que o esperado');assert.equal(e.timers.size,0);e.ui('retry').dispatch('click');await flush();assert.equal(e.liveFrames().length,1);assert.notEqual(e.liveFrames()[0],f);e.launcher.close();assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();e.launcher.open(e.app,'3d');e.liveFrames()[0].contentDocument.title='Page not found · GitHub Pages';e.liveFrames()[0].dispatch('load');assert.equal(e.ui('message').textContent,'A experiência não carregou');assert.equal(e.ui('retry').hidden,false);assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();e.sandbox.navigator.xr.isSessionSupported=()=>Promise.reject(Object.assign(new Error('policy'),{name:'SecurityError'}));e.launcher.open(e.app,'vr');await flush();assert.equal(e.ui('message').textContent,'O navegador bloqueou a verificação de VR');assert.equal(e.liveFrames().length,0);e.launcher.close();assert.equal(e.timers.size,0);count++;
 }
 {
 const e=environment();let resolve;e.sandbox.navigator.xr.isSessionSupported=()=>new Promise(r=>resolve=r);e.launcher.open(e.app,'vr');await flush();e.advance(6501);assert.equal(e.ui('message').textContent,'Não foi possível verificar os óculos');resolve(true);await flush();assert.equal(e.liveFrames().length,0);e.ui('three').dispatch('click');assert.equal(e.liveFrames().length,1);count++;
 }
 {
 const e=environment();e.launcher.open({...e.app,path:'javascript:alert(1)'},'3d');assert.equal(e.liveFrames().length,0);assert.equal(e.ui('direct').hidden,true);e.launcher.close();e.launcher.open({...e.app,path:'https://external.example/app/'},'vr');await flush();assert.equal(e.liveFrames().length,0);assert.equal(e.ui('message').textContent,'Esta experiência abre em outro site');count++;
 }
 {
 const e=environment();e.sandbox.navigator.xr.isSessionSupported=()=>Promise.resolve(false);e.launcher.open({...e.app,formats:['360']},'vr');await flush();assert.equal(e.ui('three').textContent,'Abrir experiência');assert.equal(e.ui('description').textContent.includes('3D'),false);e.ui('three').dispatch('click');e.liveFrames()[0].dispatch('load');assert.equal(e.ui('toolbar-status').textContent,'Exploração · volte ao catálogo quando quiser');count++;
 }
 console.log('PASS '+count+' launcher mock scenarios: URL/subfolder; 3D; focus/cleanup; stale support; consecutive opens; legacy readiness; explicit VR call; genuine bridge states; origin/source; rejected XR; unsupported 3D fallback; timeout/retry; 404; permission error; late resolution; URL validation.');
})().catch(e=>{console.error(e);process.exitCode=1});
