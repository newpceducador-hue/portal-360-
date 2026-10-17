/* Portal 360º VR · Modo Estande (v1.5.1)
   Tour automático de cerca de 3,5 minutos para feiras e eventos (SENACOP 2026): espaço, Terra por dentro, célula,
   DNA e coração saindo do corpo humano, com narração, legenda e música. Roda sozinho: começa quando o visitante coloca o
   óculos (ou aperta o gatilho); no fim há uma pesquisa rápida de uma pergunta (três carinhas), o convite para falar com o
   consultor, soma 1 no contador do dia e volta à espera para o próximo.
   É um app separado: usa CÓPIAS congeladas (pasta snap/) dos modelos da Célula, da Terra e do DNA, e não altera
   nenhum app do catálogo. Equipe: A ou X pula a cena; B ou Y volta à espera. */
(function(){'use strict';
const T=THREE,VERSAO='1.5.1',$=id=>document.getElementById(id);
const CM=window.CELULA_MODELS,TM=window.TERRA_MODELS,DM=window.DNA_MODELS;

/* ---------- palco ---------- */
const canvas=$('palco');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=T.sRGBEncoding;renderer.localClippingEnabled=true;renderer.xr.enabled=true;
const scene=new T.Scene();scene.background=new T.Color(0x020812);
const camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.05,500);camera.position.set(0,1.6,0);scene.add(camera);
scene.add(new T.HemisphereLight(0xcfe6ff,0x1a1020,.45));
const sol=new T.DirectionalLight(0xffffff,.55);sol.position.set(3,5,4);scene.add(sol);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

/* céu de estrelas (referência de conforto no VR) */
(function(){const n=2600,p=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=180+Math.random()*60,s=Math.sqrt(1-u*u);p[i*3]=Math.cos(a)*s*r;p[i*3+1]=u*r;p[i*3+2]=Math.sin(a)*s*r;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));scene.add(new T.Points(g,new T.PointsMaterial({color:0xcfe0ff,size:.7,sizeAttenuation:true,transparent:true,opacity:.85})));})();

/* cortina para as transições (presa à cabeça) */
const cortina=new T.Mesh(new T.SphereGeometry(.3,16,12),new T.MeshBasicMaterial({color:0x000000,side:T.BackSide,transparent:true,opacity:1,depthTest:false,depthWrite:false}));
cortina.renderOrder=3000;camera.add(cortina);

/* ---------- utilidades ---------- */
function texCanvas(c){const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;return t;}
function quebrar(g,txt,maxW){const out=[];let l='';for(const w of String(txt).split(/\s+/)){const n=l?l+' '+w:w;if(g.measureText(n).width>maxW&&l){out.push(l);l=w;}else l=n;}if(l)out.push(l);return out;}
/* placa de texto: título opcional + corpo, fundo escuro translúcido.
   O texto SEMPRE cabe na caixa: quebra as linhas, centraliza na vertical e, se não couber, diminui a letra até caber.
   opt.autoAltura: em vez de diminuir a letra, a caixa cresce na altura (legendas). */
const _med=document.createElement('canvas').getContext('2d');
function montarLinhas(titulo,corpo,f,larg,opt){const L=[];let tot=0,estoura=false;const tT=(opt.tamT||64)*f,tC=(opt.tamC||42)*f;
 const add=(txt,font,cor,adv)=>{_med.font=font;if(_med.measureText(txt).width>larg)estoura=true;L.push({txt,font,cor,adv});tot+=adv;};
 if(titulo){const ft='700 '+tT+'px Segoe UI,Arial';_med.font=ft;for(const l of quebrar(_med,titulo,larg))add(l,ft,opt.corT||'#ffffff',tT*1.22);if(corpo){L.push({gap:tT*.18});tot+=tT*.18;}}
 if(corpo){const fc='500 '+tC+'px Segoe UI,Arial';String(corpo).split('\n').forEach((par,i)=>{if(i){L.push({gap:tC*.25});tot+=tC*.25;}_med.font=fc;for(const l of quebrar(_med,par,larg))add(l,fc,opt.corC||'#d8ecf8',tC*1.3);});}
 return{L,tot,estoura};}
function placa(titulo,corpo,w,h,opt={}){const W=1024,comFundo=opt.fundo!==false,mx=comFundo?52:20,padV=comFundo?22:4,larg=W-2*mx;
 let f=1,lay=montarLinhas(titulo,corpo,f,larg,opt),H=Math.round(W*h/w);
 if(opt.autoAltura){H=Math.max(H,Math.ceil(lay.tot+2*padV+8));h=w*H/W;}
 while((lay.tot>H-2*padV||lay.estoura)&&f>.35){f*=.94;lay=montarLinhas(titulo,corpo,f,larg,opt);}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 if(comFundo){g.fillStyle=opt.fundo||'rgba(3,14,28,.86)';g.fillRect(0,0,W,H);g.strokeStyle=opt.borda||'rgba(124,255,184,.55)';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);}
 g.textAlign='center';g.textBaseline='middle';let y=(H-lay.tot)/2;
 for(const l of lay.L){if(l.gap){y+=l.gap;continue;}g.font=l.font;g.fillStyle=l.cor;g.fillText(l.txt,W/2,y+l.adv/2);y+=l.adv;}
 const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texCanvas(c),transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false}));m.renderOrder=500;
 m.userData.texto={escala:f,cabe:lay.tot<=H-2*padV&&!lay.estoura,altura:h,titulo,corpo};PLACAS.push(m.userData.texto);if(PLACAS.length>200)PLACAS.shift();return m;}
const PLACAS=[];
function rotulo(txt,cor,w){const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');let s=54;g.font='700 '+s+'px Segoe UI,Arial';while(g.measureText(txt).width>490&&s>20){s-=2;g.font='700 '+s+'px Segoe UI,Arial';}
 g.textAlign='center';g.textBaseline='middle';g.shadowColor='#000';g.shadowBlur=8;g.fillStyle=cor||'#e7f6ff';g.fillText(txt,256,48);
 const sp=new T.Sprite(new T.SpriteMaterial({map:texCanvas(c),transparent:true,depthWrite:false}));sp.scale.set(w,w*96/512,1);return sp;}
function liberar(o){if(!o)return;const cache=new Set();o.traverse(x=>{if(x.geometry)x.geometry.dispose();for(const m of [].concat(x.material||[])){if(!m||cache.has(m))continue;cache.add(m);if(m.map&&m.map.isCanvasTexture)m.map.dispose();m.dispose();}});if(o.parent)o.parent.remove(o);}

/* posição da cabeça e direção do olhar (no plano do chão) */
function ancora(){const cam=renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera;const p=new T.Vector3(),q=new T.Quaternion();cam.getWorldPosition(p);cam.getWorldQuaternion(q);
 const f=new T.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.lengthSq()<.01)f.set(0,0,-1);f.normalize();return{p,f,yaw:Math.atan2(-f.x,-f.z)};}
/* coloca um grupo à frente do visitante, virado para ele */
function aFrente(g,a,dist,dy){g.position.copy(a.p).addScaledVector(a.f,dist);g.position.y=a.p.y+(dy||0);g.rotation.y=a.yaw;return g;}
/* luz de estúdio vinda de onde está o visitante (frente, um pouco acima e à direita) */
function luzFrente(g,k){const l=new T.DirectionalLight(0xffffff,k||1.1);l.position.set(1.2,1.6,3);l.target=g;g.add(l);const f=new T.DirectionalLight(0x9fc8ff,.35);f.position.set(-2,.5,1);f.target=g;g.add(f);}

/* ---------- som: narração (MP3 gravado ou voz do navegador) + trilha ---------- */
const musica=new Audio('audio/fundo.mp3');musica.loop=true;musica.volume=.18;
const voz=new Audio();voz.preload='auto';let falando=false,falaSeq=0;
function musicaVol(v){musica.volume=v;}
function narrar(chave,texto){falaSeq++;const seq=falaSeq;pararVoz(true);falando=true;musicaVol(.06);
 const fim=()=>{if(seq!==falaSeq)return;falando=false;musicaVol(.18);if(fala)fala.fimEm=performance.now();};
 fala={chave,texto,itens:(window.LEGENDAS||{})[chave]||null,fimEm:0};legendaTexto('');
 const sintetica=()=>{if(seq!==falaSeq)return;if(fala){fala.itens=null;legendaTexto(texto);}try{const u=new SpeechSynthesisUtterance(texto);u.lang='pt-BR';u.rate=1.0;u.onend=u.onerror=fim;speechSynthesis.speak(u);}catch(_){fim();}};
 voz.onended=fim;voz.onerror=()=>sintetica();voz.src='audio/estande-'+chave+'.mp3';const p=voz.play();if(p&&p.catch)p.catch(()=>sintetica());}
let fala=null;/* narração em curso, para a legenda frase por frase */
function pararVoz(silencio){fala=null;try{voz.pause();}catch(_){}try{speechSynthesis.cancel();}catch(_){}if(!silencio){falando=false;musicaVol(.18);}}

/* ---------- contador de demonstrações (fica neste aparelho) ---------- */
const CHAVE='pde_estande_contagem';
function hoje(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function lerContagem(){try{return JSON.parse(localStorage.getItem(CHAVE)||'{}');}catch(_){return{};}}
function somar(){const c=lerContagem();c[hoje()]=(c[hoje()]||0)+1;try{localStorage.setItem(CHAVE,JSON.stringify(c));}catch(_){}mostrarContagem();}
function mostrarContagem(){const c=lerContagem(),h=c[hoje()]||0,tot=Object.values(c).reduce((a,b)=>a+b,0);const p=lerPesquisa()[hoje()]||{};
 $('contador').textContent='Demonstrações hoje: '+h+' · total neste aparelho: '+tot+' · pesquisa hoje: muita '+(p.muita||0)+', alguma '+(p.alguma||0)+', pouca '+(p.pouca||0);}
/* respostas da pesquisa rápida, por dia, neste aparelho */
const CHAVE_P='pde_estande_pesquisa';
function lerPesquisa(){try{return JSON.parse(localStorage.getItem(CHAVE_P)||'{}');}catch(_){return{};}}
function registrarPesquisa(v){const c=lerPesquisa(),d=c[hoje()]=c[hoje()]||{};d[v]=(d[v]||0)+1;try{localStorage.setItem(CHAVE_P,JSON.stringify(c));}catch(_){}mostrarContagem();}
mostrarContagem();

/* ---------- efeitos sonoros sintetizados (sem arquivos): subida, explosão, passagem, batimento ---------- */
let actx=null,mestre=null;
function sfx(){try{if(!actx){actx=new (window.AudioContext||window.webkitAudioContext)();mestre=actx.createGain();mestre.gain.value=.8;mestre.connect(actx.destination);}if(actx.state!=='running')actx.resume();}catch(_){}return actx;}
function ruido(ctx,dur){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*dur),ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;return s;}
function env(ctx,g,t0,pico,ataque,queda){g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(pico,t0+ataque);g.gain.exponentialRampToValueAtTime(0.0001,t0+ataque+queda);}
function somSubida(dur){const c=sfx();if(!c)return;const t=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(40,t);o.frequency.exponentialRampToValueAtTime(160,t+dur);
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(200,t);lp.frequency.exponentialRampToValueAtTime(2400,t+dur);o.connect(lp);lp.connect(g);g.connect(mestre);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+dur*.95);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.05);o.start(t);o.stop(t+dur+.1);
 const n=ruido(c,dur),bp=c.createBiquadFilter(),gn=c.createGain();bp.type='bandpass';bp.Q.value=1.2;bp.frequency.setValueAtTime(300,t);bp.frequency.exponentialRampToValueAtTime(4000,t+dur);n.connect(bp);bp.connect(gn);gn.connect(mestre);gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.12,t+dur*.95);gn.gain.exponentialRampToValueAtTime(.0001,t+dur+.05);n.start(t);}
function somExplosao(forca){const c=sfx();if(!c)return;const t=c.currentTime,k=forca||1;const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(28,t+1.4);o.connect(g);g.connect(mestre);env(c,g,t,.95*k,.01,1.6);o.start(t);o.stop(t+1.8);
 const n=ruido(c,2.2),lp=c.createBiquadFilter(),gn=c.createGain();lp.type='lowpass';lp.frequency.setValueAtTime(5000,t);lp.frequency.exponentialRampToValueAtTime(150,t+2);n.connect(lp);lp.connect(gn);gn.connect(mestre);env(c,gn,t,.7*k,.005,2.0);n.start(t);}
function somPassagem(){const c=sfx();if(!c)return;const t=c.currentTime;const n=ruido(c,1.3),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.Q.value=2;bp.frequency.setValueAtTime(250,t);bp.frequency.exponentialRampToValueAtTime(3200,t+.55);bp.frequency.exponentialRampToValueAtTime(500,t+1.2);n.connect(bp);bp.connect(g);g.connect(mestre);env(c,g,t,.32,.45,.8);n.start(t);}
function somBatida(forte){const c=sfx();if(!c)return;const t=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(forte?62:52,t);o.frequency.exponentialRampToValueAtTime(34,t+.16);o.connect(g);g.connect(mestre);env(c,g,t,forte?.9:.55,.008,.2);o.start(t);o.stop(t+.3);}
function somAcerto(){const c=sfx();if(!c)return;const t=c.currentTime;[[660,0],[880,.11],[1320,.22]].forEach(([f,d])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(mestre);env(c,g,t+d,.35,.01,.5);o.start(t+d);o.stop(t+d+.6);});}
const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3),easeIn=x=>Math.pow(Math.min(1,Math.max(0,x)),3);
const elastico=x=>{x=Math.min(1,Math.max(0,x));return x===1?1:Math.pow(2,-10*x)*Math.sin((x*10-.75)*(2*Math.PI)/3)+1;};
/* textura de brilho (radial) e o logo recortado em círculo, prontos desde o início */
function texBrilho(r,g,b){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const gr=x.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,`rgba(${r},${g},${b},1)`);gr.addColorStop(.25,`rgba(${r},${g},${b},.55)`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,256,256);return texCanvas(c);}
const BRILHO_AZUL=texBrilho(140,220,255),BRILHO_BRANCO=texBrilho(255,255,255);
const LOGO=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const t=texCanvas(c);const im=new Image();im.onload=()=>{const x=c.getContext('2d');x.save();x.beginPath();x.arc(256,256,256,0,Math.PI*2);x.clip();x.drawImage(im,0,0,512,512);x.restore();t.needsUpdate=true;};im.src='assets/logo.png';return t;})();
function spriteBrilho(tex,cor){return new T.Sprite(new T.SpriteMaterial({map:tex,color:cor||0xffffff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));}
/* logo do Portal com halo, usado na abertura, na espera e no final */
function logoComHalo(r){const g=new T.Group();const h=spriteBrilho(BRILHO_AZUL);h.scale.set(r*5,r*5,1);g.add(h);const m=new T.Mesh(new T.CircleGeometry(r,72),new T.MeshBasicMaterial({map:LOGO,transparent:true,depthWrite:false,toneMapped:false}));m.position.z=.01;g.add(m);g.userData.halo=h;return g;}
/* nuvem de partículas: implode até o logo e explode para fora, passando pelo visitante */
function nuvemExplosiva(n,raioIni,raioFim){const pos=new Float32Array(n*3),ini=new Float32Array(n*3),alvo=new Float32Array(n*3),vel=new Float32Array(n*3);
 for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u),r=raioIni[0]+Math.random()*(raioIni[1]-raioIni[0]);ini[i*3]=Math.cos(a)*s*r;ini[i*3+1]=u*r;ini[i*3+2]=Math.sin(a)*s*r;
  const ra=Math.sqrt(Math.random())*raioFim,b=Math.random()*Math.PI*2;alvo[i*3]=Math.cos(b)*ra;alvo[i*3+1]=Math.sin(b)*ra;alvo[i*3+2]=(Math.random()-.5)*.1;}
 pos.set(ini);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
 const p=new T.Points(geo,new T.PointsMaterial({color:0xa8ecff,size:.045,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,map:BRILHO_BRANCO}));
 p.userData={ini,alvo,vel,explodiu:false};
 p.userData.implodir=k=>{const e=easeIn(k);for(let i=0;i<pos.length;i++)pos[i]=ini[i]+(alvo[i]-ini[i])*e;geo.attributes.position.needsUpdate=true;p.material.opacity=Math.min(1,k*2);};
 p.userData.explodir=()=>{for(let i=0;i<n;i++){const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2]+.02;const l=Math.hypot(x,y,z)||1,v=4+Math.random()*11;vel[i*3]=x/l*v+(Math.random()-.5)*3;vel[i*3+1]=y/l*v+(Math.random()-.5)*3;vel[i*3+2]=Math.abs(z/l)*v+2+Math.random()*9;}p.userData.explodiu=true;};
 p.userData.voar=(dt,f)=>{for(let i=0;i<pos.length;i++){pos[i]+=vel[i]*dt;vel[i]*=1-dt*.7;}geo.attributes.position.needsUpdate=true;p.material.opacity=Math.max(0,f);};
 return p;}

/* passagem em velocidade da luz entre as cenas: riscos de luz que vêm na direção do visitante (presos à cabeça) */
const warp=(()=>{const n=420,pos=new Float32Array(n*6),dados=[];for(let i=0;i<n;i++){const r=.7+Math.random()*4,a=Math.random()*Math.PI*2,z=-Math.random()*44,l=.8+Math.random()*2.4;dados.push([Math.cos(a)*r,Math.sin(a)*r,z,l]);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));const m=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xcdeeff,transparent:true,opacity:0,depthTest:false,depthWrite:false,blending:T.AdditiveBlending}));m.renderOrder=3001;m.frustumCulled=false;camera.add(m);
 m.userData.passo=(dt,k)=>{m.visible=k>.02;if(!m.visible)return;m.material.opacity=k;for(let i=0;i<n;i++){const d=dados[i];d[2]+=dt*70*k;if(d[2]>1)d[2]-=45;pos[i*6]=d[0];pos[i*6+1]=d[1];pos[i*6+2]=d[2];pos[i*6+3]=d[0];pos[i*6+4]=d[1];pos[i*6+5]=d[2]-d[3]*(.4+k);}geo.attributes.position.needsUpdate=true;};return m;})();
/* aproxima um grupo do visitante: de d0 a d1 metros em "dur" segundos */
function aproximar(g,a,d0,d1,dy,t,dur){const d=d0+(d1-d0)*ease(t/dur);g.position.copy(a.p).addScaledVector(a.f,d);g.position.y=a.p.y+(dy||0);}

/* ---------- coração (anatomia real Z-Anatomy, CC BY-SA 4.0) ---------- */
let coracaoGLB=null;
try{new T.GLTFLoader().load('modelos/coracao.glb',g=>{coracaoGLB=g.scene;},undefined,()=>{coracaoGLB=null;});}catch(_){}
/* realismo do coração: tecido úmido (verniz + reflexo de ambiente), fibras musculares em relevo, cores reais
   (músculo vermelho-escuro, aorta e tronco pulmonar claros, veias cavas roxo-azuladas), sombreamento suave,
   veia cava cortada rente ao coração e batimento por câmara (átrios primeiro, depois os ventrículos). */
const ENV_TECIDO=(()=>{try{const pm=new T.PMREMGenerator(renderer);const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
 const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#dfe6f2');gr.addColorStop(.42,'#6b6f7c');gr.addColorStop(.6,'#2a2228');gr.addColorStop(1,'#0c0a0e');x.fillStyle=gr;x.fillRect(0,0,512,256);
 x.fillStyle='rgba(255,255,255,1)';x.fillRect(296,34,110,46);x.fillRect(70,60,64,34);x.fillStyle='rgba(255,214,190,.8)';x.fillRect(440,110,50,26);
 const t=new T.CanvasTexture(c);t.mapping=T.EquirectangularReflectionMapping;t.encoding=T.sRGBEncoding;const rt=pm.fromEquirectangular(t);t.dispose();pm.dispose();return rt.texture;}catch(_){return null;}})();
function texTecido(tipo){const N=512,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');let sd=tipo==='fibra'?7:13;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
 if(tipo==='fibra'){x.fillStyle='#808080';x.fillRect(0,0,N,N);
  for(let i=0;i<2600;i++){const y0=rnd()*N,x0=rnd()*N,l=40+rnd()*160,w=1+rnd()*2.5,cl=rnd()<.5?120+rnd()*40:60+rnd()*40;x.strokeStyle=`rgba(${cl},${cl},${cl},.55)`;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.bezierCurveTo(x0+l*.33,y0+(rnd()-.5)*14,x0+l*.66,y0+(rnd()-.5)*14,x0+l,y0+(rnd()-.5)*10);x.stroke();}
  for(let i=0;i<900;i++){const v=rnd()<.5?40:200;x.fillStyle=`rgba(${v},${v},${v},.10)`;x.beginPath();x.arc(rnd()*N,rnd()*N,2+rnd()*14,0,Math.PI*2);x.fill();}}
 else{x.fillStyle='#b9b9b9';x.fillRect(0,0,N,N);
  for(let i=0;i<1600;i++){const v=150+rnd()*90;x.fillStyle=`rgba(${v},${v*.92},${v*.86},.22)`;x.beginPath();x.arc(rnd()*N,rnd()*N,3+rnd()*22,0,Math.PI*2);x.fill();}
  for(let i=0;i<260;i++){const x0=rnd()*N,y0=rnd()*N;x.strokeStyle=`rgba(${90+rnd()*40},40,50,.35)`;x.lineWidth=.8+rnd()*1.4;x.beginPath();x.moveTo(x0,y0);let px=x0,py=y0;for(let k=0;k<6;k++){px+=(rnd()-.5)*40;py+=(rnd()-.5)*40;x.lineTo(px,py);}x.stroke();}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(tipo==='cor')t.encoding=T.sRGBEncoding;return t;}
const TEX_FIBRA=texTecido('fibra'),TEX_COR=texTecido('cor');
/* sombreamento suave: junta os vértices na mesma posição e tira a média das normais */
function suavizar(geo){const p=geo.attributes.position,n=geo.attributes.normal;if(!n)return;const m=new Map(),k=i=>Math.round(p.getX(i)*1e5)+'_'+Math.round(p.getY(i)*1e5)+'_'+Math.round(p.getZ(i)*1e5);
 for(let i=0;i<p.count;i++){const key=k(i);const a=m.get(key)||[0,0,0];a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);m.set(key,a);}
 for(let i=0;i<p.count;i++){const a=m.get(k(i)),l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;}
/* coordenadas de textura por projeção em caixa (o modelo não tem UV); ESC define o tamanho das fibras */
function uvCaixa(geo,esc){const p=geo.attributes.position,n=geo.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(ax>=ay&&ax>=az){u=p.getZ(i);v=p.getY(i);}else if(ay>=az){u=p.getX(i);v=p.getZ(i);}else{u=p.getX(i);v=p.getY(i);}uv[i*2]=u*esc;uv[i*2+1]=v*esc;}
 geo.setAttribute('uv',new T.BufferAttribute(uv,2));}
const TECIDO={atrioD:{cor:0x7a2a31,fibra:.45},atrioE:{cor:0x8a2f34,fibra:.45},ventD:{cor:0x8e3230,fibra:.55},ventE:{cor:0x993532,fibra:.55},
 aorta:{cor:0xe3c2b6,fibra:.25},pulmonar:{cor:0xd9b0a6,fibra:.25},cavas:{cor:0x4f3a5c,fibra:.2},veiasPulm:{cor:0x8c3a44,fibra:.2},coronarias:{cor:0xa8222c,fibra:.1}};
function materialTecido(nome){const t=TECIDO[nome]||TECIDO.ventE;
 const m=new T.MeshPhysicalMaterial({color:new T.Color(t.cor).convertSRGBToLinear(),map:TEX_COR,bumpMap:TEX_FIBRA,bumpScale:.012*t.fibra,roughness:.5,roughnessMap:TEX_FIBRA,metalness:0,clearcoat:.75,clearcoatRoughness:.2,envMap:ENV_TECIDO,envMapIntensity:.9});
 if(nome==='cavas'){m.clippingPlanes=[CORTE_CAVA];m.side=T.DoubleSide;}if(nome==='pulmonar'){m.clippingPlanes=CORTE_PULM;m.side=T.DoubleSide;}return m;}
const CORTE_CAVA=new T.Plane(new T.Vector3(0,1,0),0),CORTE_PULM=[new T.Plane(),new T.Plane()];
function coracaoModelo(){const g=new T.Group();
 if(coracaoGLB){const m=coracaoGLB.clone(true);const partes={};
  m.traverse(o=>{if(o.isMesh){let n=o.name,p=o;while(p&&!TECIDO[n]){p=p.parent;n=p&&p.name;}o.geometry=o.geometry.clone();suavizar(o.geometry);uvCaixa(o.geometry,n&&n.indexOf('vent')===0?9:12);o.material=materialTecido(n);
   o.geometry.computeBoundingBox();const no=p||o;partes[n]={no,centro:o.geometry.boundingBox.getCenter(new T.Vector3()),pos:no.position.clone()};}});
  /* o tamanho vem só do coração (sem as veias cavas, que são longas), para ele aparecer grande */
  const box=new T.Box3();m.updateMatrixWorld(true);m.traverse(o=>{if(o.isMesh){let q=o,cava=false;while(q){if(q.name==='cavas')cava=true;q=q.parent;}if(!cava)box.expandByObject(o);}});if(box.isEmpty())box.setFromObject(m);
  const tam=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());m.position.sub(c);const k=1.1/Math.max(tam.x,tam.y,tam.z);const piv=new T.Group();piv.add(m);piv.scale.setScalar(k);g.add(piv);g.userData.piv=piv;g.userData.k=k;g.userData.c=c.clone();
  /* corte da veia cava: plano logo abaixo da base do coração, acompanhando o giro */
  const pontoCorte=new T.Vector3(c.x,box.min.y-.004,c.z).sub(c),pE=new T.Vector3(-.03,c.y,c.z).sub(c),pD=new T.Vector3(.066,c.y,c.z).sub(c),/* largura das câmaras (m, Z-Anatomy) */_p=new T.Vector3(),_n=new T.Vector3();
  g.userData.corte=()=>{piv.updateMatrixWorld(true);_p.copy(pontoCorte).applyMatrix4(piv.matrixWorld);_n.set(0,1,0).transformDirection(piv.matrixWorld);CORTE_CAVA.setFromNormalAndCoplanarPoint(_n,_p);/* ramos das artérias pulmonares cortados na largura do coração */_p.copy(pE).applyMatrix4(piv.matrixWorld);_n.set(1,0,0).transformDirection(piv.matrixWorld);CORTE_PULM[0].setFromNormalAndCoplanarPoint(_n,_p);_p.copy(pD).applyMatrix4(piv.matrixWorld);_n.set(-1,0,0).transformDirection(piv.matrixWorld);CORTE_PULM[1].setFromNormalAndCoplanarPoint(_n,_p);};
  /* batimento: átrios contraem primeiro, depois os ventrículos (sístole), cada um em volta do próprio centro */
  const env=(x,a,b)=>x<a||x>b?0:Math.sin((x-a)/(b-a)*Math.PI);
  const escalar=(nome,sx,sy)=>{const P=partes[nome];if(!P)return;P.no.scale.set(sx,sy,sx);P.no.position.set(P.pos.x+P.centro.x*(1-sx),P.pos.y+P.centro.y*(1-sy),P.pos.z+P.centro.z*(1-sx));};
  g.userData.bater=ciclo=>{const a=env(ciclo,0,.12),v=env(ciclo,.08,.36);escalar('atrioD',1-.09*a,1-.06*a);escalar('atrioE',1-.09*a,1-.06*a);escalar('ventD',1-.06*v,1-.035*v);escalar('ventE',1-.07*v,1-.04*v);
   m.rotation.y=-.04*v;g.userData.corte();};}
 else{const piv=new T.Group();const v=new T.Mesh(new T.SphereGeometry(.42,40,28),new T.MeshStandardMaterial({color:0xb52a35,roughness:.4}));v.scale.set(1,1.2,.9);piv.add(v);const ao=new T.Mesh(new T.TorusGeometry(.22,.07,12,32,Math.PI),new T.MeshStandardMaterial({color:0xc8323c}));ao.position.set(0,.5,0);piv.add(ao);g.add(piv);g.userData.piv=piv;g.userData.k=1;g.userData.c=new T.Vector3(.022,1.284,.019);}
 return g;}

/* ---------- corpo humano de fundo (Z-Anatomy, CC BY-SA 4.0): pele translúcida, costelas e órgãos, SEM o coração ----------
   Todos os arquivos estão no mesmo referencial (metros, origem nos pés, corpo de frente para +z), então basta somar. */
const ORGAOS={silhueta:0x8fc3dd,costelas:0xe9e4d6,pulmoes:0xd98585,traqueia:0x9ed6ef,esofago:0xe9a070,figado:0x9e4d40,estomago:0xe08a50,intestino_delgado:0xf0c07a,intestino_grosso:0xc99a6b,aorta:0xe8484f,rins:0xa0433f,bexiga:0xe9c27a,pancreas:0xf2d39b,vesicula:0x6f9f52};
const CORPO_GLB={};
try{const ld=new T.GLTFLoader();Object.keys(ORGAOS).forEach(k=>ld.load('modelos/corpo-'+k+'.glb',g=>{CORPO_GLB[k]=g.scene;},undefined,()=>{}));}catch(_){}
function corpoFundo(){const g=new T.Group();
 for(const k of Object.keys(ORGAOS)){const src=CORPO_GLB[k];if(!src)continue;const o=src.clone(true);
  o.traverse(x=>{if(!x.isMesh)return;const m=new T.MeshStandardMaterial({color:new T.Color(ORGAOS[k]).convertSRGBToLinear(),roughness:.5,metalness:.03});
   if(k==='silhueta'){m.transparent=true;m.opacity=.16;m.depthWrite=false;m.side=T.DoubleSide;m.emissive=new T.Color(0x0d3550);}
   else if(k==='costelas'){m.transparent=true;m.opacity=.6;}
   x.material=m;});
  g.add(o);}
 return g;}

/* ---------- as cenas do tour ---------- */
/* texturas reais dos planetas (as mesmas do Sistema Solar VR, extraídas para arquivos) */
const TEXL=new T.TextureLoader(),TXP={};
function txPlaneta(n){if(TXP[n])return TXP[n];const t=TEXL.load('assets/planeta-'+n+(n==='anel'?'.png':'.jpg'));t.encoding=T.sRGBEncoding;t.anisotropy=8;TXP[n]=t;return t;}
/* dica de interação embaixo do objeto: aparece nos primeiros segundos de cada cena */
function dicaGiro(g,y,z){const d=placa('','✋ Segure o gatilho e mova a mão para girar',1.25,.12,{fundo:'rgba(10,60,40,.85)',borda:'rgba(124,255,184,.7)',tamC:40,y0:72,corC:'#eafff3'});d.position.set(0,y,z||0);g.add(d);g.userData.dica=d;}
/* grupo "giro": é ele que o visitante gira com o gatilho; a animação própria do modelo fica dentro dele */
function comGiro(g,obj){const giro=new T.Group();giro.add(obj);g.add(giro);g.userData.alvo=giro;return giro;}
/* carinhas da pesquisa, desenhadas (não dependem de emoji do navegador do óculos) */
const PESQ=[{valor:'pouca',rotulo:'Pouca',cor:'#e2574c',boca:-1},{valor:'alguma',rotulo:'Alguma',cor:'#f2c14e',boca:0},{valor:'muita',rotulo:'Muita',cor:'#3fcf7f',boca:1}];
function carinha(o){const W=320,H=400,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 x.fillStyle='rgba(4,18,32,.88)';x.strokeStyle=o.cor;x.lineWidth=8;x.beginPath();x.roundRect?x.roundRect(6,6,W-12,H-12,36):x.rect(6,6,W-12,H-12);x.fill();x.stroke();
 const cx=W/2,cy=150,r=105;x.fillStyle=o.cor;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();
 x.fillStyle='#14202b';[-38,38].forEach(dx=>{x.beginPath();x.ellipse(cx+dx,cy-25,12,17,0,0,Math.PI*2);x.fill();});
 x.strokeStyle='#14202b';x.lineWidth=13;x.lineCap='round';x.beginPath();
 if(o.boca>0)x.arc(cx,cy+8,52,.18*Math.PI,.82*Math.PI);else if(o.boca<0)x.arc(cx,cy+78,50,1.2*Math.PI,1.8*Math.PI);else{x.moveTo(cx-45,cy+42);x.lineTo(cx+45,cy+42);}x.stroke();
 x.fillStyle='#ffffff';x.font='700 58px Segoe UI,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(o.rotulo,cx,322);
 const m=new T.Mesh(new T.PlaneGeometry(.48,.6),new T.MeshBasicMaterial({map:texCanvas(c),transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false}));m.renderOrder=510;m.userData.valor=o.valor;return m;}
const CENAS=[
 {id:'abertura',dur:15.5,falaEm:4.2,legenda:'Isto é imersão. Com o Portal 360º VR, o aluno não olha para o conteúdo: ele entra nele.',
  montar(a){const g=new T.Group();aFrente(g,a,3.2,.15);
   const nuvem=nuvemExplosiva(2600,[7,22],.55);g.add(nuvem);
   const flash=spriteBrilho(BRILHO_BRANCO);flash.scale.set(.01,.01,1);g.add(flash);
   const anel=new T.Mesh(new T.RingGeometry(.96,1,128),new T.MeshBasicMaterial({color:0x7CFFB8,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));g.add(anel);
   const anel2=anel.clone();anel2.material=anel.material.clone();anel2.material.color.setHex(0x7fd6ff);g.add(anel2);
   const logo=logoComHalo(.55);logo.scale.setScalar(.001);g.add(logo);
   const tit=placa('Portal 360º VR','',2.4,.34,{fundo:false,tamT:120,y0:100});tit.position.y=-.92;tit.material.opacity=0;g.add(tit);
   const sub=placa('','Isto é imersão.',1.8,.18,{fundo:false,tamC:76,y0:90,corC:'#7CFFB8'});sub.position.y=-1.22;sub.material.opacity=0;g.add(sub);
   const T1=2.6;let somou=false;
   g.userData.tick=(t,dt)=>{if(!somou){somou=true;somSubida(T1);}
    if(t<T1){nuvem.userData.implodir(t/T1);logo.scale.setScalar(.001);return;}
    if(!nuvem.userData.explodiu){nuvem.userData.explodir();somExplosao(1);}
    const e=t-T1;nuvem.userData.voar(dt,1-e/3.5);
    const fl=e<.18?e/.18:Math.max(0,1-(e-.18)/.9);flash.scale.setScalar(.1+fl*9);flash.material.opacity=fl;
    anel.scale.setScalar(.2+e*7);anel.material.opacity=Math.max(0,1-e/1.5);anel2.scale.setScalar(.2+Math.max(0,e-.25)*5);anel2.material.opacity=Math.max(0,1-(e-.25)/1.8)*(e>.25?1:0);
    logo.scale.setScalar(Math.max(.001,elastico(e/1.1)));logo.userData.halo.material.opacity=.75+.25*Math.sin(t*2.2);logo.rotation.y=Math.sin(t*.5)*.12;
    tit.material.opacity=ease((e-1.0)/1.0);sub.material.opacity=ease((e-2.2)/1.0);
    if(t>13.5){const k=(t-13.5)/2;logo.scale.setScalar(1+easeIn(k)*1.5);}};
   return g;}},
 {id:'solar',dur:40,legenda:'Você está no meio do Sistema Solar. Segure o gatilho e gire os planetas com a mão. Na experiência completa, o aluno examina cada planeta, compara tamanhos, entende o dia e a noite, as fases da Lua e os eclipses.',
  montar(a){const g=new T.Group();const sist=new T.Group();sist.rotation.x=.12;
   const sun=new T.Mesh(new T.SphereGeometry(.7,64,40),new T.MeshBasicMaterial({map:txPlaneta('sol'),color:0xfff1d6}));sist.add(sun);
   const gc=document.createElement('canvas');gc.width=gc.height=256;const gx=gc.getContext('2d');const gr=gx.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'rgba(255,220,140,.85)');gr.addColorStop(.4,'rgba(255,160,60,.3)');gr.addColorStop(1,'rgba(255,120,30,0)');gx.fillStyle=gr;gx.fillRect(0,0,256,256);
   const brilho=new T.Sprite(new T.SpriteMaterial({map:texCanvas(gc),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));brilho.scale.set(3.6,3.6,1);sist.add(brilho);
   const luz=new T.PointLight(0xfff4e0,1.15,0,1);sist.add(luz);sist.add(new T.AmbientLight(0x334466,.35));
   /* [nome, textura, raio, distância ao Sol, velocidade da órbita] · tamanhos e distâncias fora de escala, como no app */
   const P=[['Mercúrio','mercurio',.06,1.25,1.6],['Vênus','venus',.1,1.75,1.2],['Terra','terra',.11,2.3,1.0],['Marte','marte',.08,2.85,.8],['Júpiter','jupiter',.32,3.75,.45],['Saturno','saturno',.27,4.75,.33],['Urano','urano',.17,5.55,.24],['Netuno','netuno',.17,6.2,.19]];
   const corpos=[];let lua=null;P.forEach(([n,tx,r,d,vel],i)=>{const piv=new T.Group();piv.rotation.y=i*1.7;sist.add(piv);
    const m=new T.Mesh(new T.SphereGeometry(r,48,32),new T.MeshStandardMaterial({map:txPlaneta(tx),roughness:.85,metalness:0}));m.position.x=d;m.rotation.z=n==='Urano'?1.7:.4;piv.add(m);
    if(n==='Saturno'){const ri=r*1.25,re=r*2.3,geo=new T.RingGeometry(ri,re,96,1);const pos=geo.attributes.position,uv=geo.attributes.uv,v3=new T.Vector3();for(let k=0;k<pos.count;k++){v3.fromBufferAttribute(pos,k);uv.setXY(k,(v3.length()-ri)/(re-ri),.5);}
     const an=new T.Mesh(geo,new T.MeshStandardMaterial({map:txPlaneta('anel'),side:T.DoubleSide,transparent:true,roughness:.9,depthWrite:false}));an.rotation.x=Math.PI/2.3;m.add(an);}
    if(n==='Terra'){const lp=new T.Group();m.add(lp);lua=new T.Mesh(new T.SphereGeometry(.03,24,16),new T.MeshStandardMaterial({map:txPlaneta('lua'),roughness:.95}));lua.position.x=.24;lp.add(lua);lua.userData.piv=lp;}
    const rt=rotulo(n,'#e7f6ff',.5);rt.position.set(d,r+.18,0);piv.add(rt);
    const orb=new T.Mesh(new T.RingGeometry(d-.006,d+.006,160),new T.MeshBasicMaterial({color:0x5f86a8,side:T.DoubleSide,transparent:true,opacity:.3}));orb.rotation.x=-Math.PI/2;sist.add(orb);corpos.push([piv,m,vel]);});
   comGiro(g,sist);dicaGiro(g,1.6,0);
   /* o Sol fica 6 m à frente, abaixo da linha dos olhos: as órbitas externas passam em volta do visitante */
   aFrente(g,a,16,-.7);g.userData.tick=(t,dt)=>{aproximar(g,a,16,6,-.7,t,5);for(const [piv,m,vel] of corpos){piv.rotation.y+=dt*vel*.35;m.rotation.y+=dt*1.2;}sun.rotation.y+=dt*.08;if(lua)lua.userData.piv.rotation.y+=dt*2.2;};return g;}},
 {id:'terra',dur:38,legenda:'A Terra aberta ao meio: crosta, manto e núcleo. Gire o planeta com o gatilho. Na experiência completa, o aluno viaja até o centro da Terra e estuda placas, vulcões e rochas.',
  montar(a){const g=new T.Group();const pai=new T.Group();const inteira=TM.terra({});inteira.scale.setScalar(.42);pai.add(inteira);const te=TM.terra({corte:true,rotulos:true});te.scale.setScalar(.42);te.visible=false;pai.add(te);comGiro(g,pai);dicaGiro(g,-1.6,.3);luzFrente(g,1.0);
   const fl=spriteBrilho(BRILHO_BRANCO,0xffd9a0);fl.scale.set(.01,.01,1);g.add(fl);aFrente(g,a,12,0);let abriu=false;
   g.userData.tick=(t,dt)=>{aproximar(g,a,12,3,0,t,3.4);if(inteira.userData.tick)inteira.userData.tick(t,dt);if(te.userData.tick)te.userData.tick(t,dt);
    if(!abriu&&t>4){abriu=true;inteira.visible=false;te.visible=true;somExplosao(.6);}const e=t-4;const k=e>0&&e<1.2?(e<.15?e/.15:1-(e-.15)/1.05):0;fl.scale.setScalar(.01+k*4.5);fl.material.opacity=k;
    if(!g.userData.mexeu){inteira.rotation.y=t*.5;te.rotation.y=Math.sin(t*.25)*.35;}};g.userData.liberar=()=>TM.dispose(g);return g;}},
 {id:'celula',dur:40,legenda:'Agora você encolheu até o tamanho de uma célula. Gire e observe o núcleo e as mitocôndrias. Na experiência completa, o aluno entra na célula, monta a fábrica de proteínas e compara a célula animal com a vegetal.',
  montar(a){const g=new T.Group();const c=CM.celula('animal');c.scale.setScalar(.62);comGiro(g,c);dicaGiro(g,-1.55,.3);luzFrente(g,1.0);aFrente(g,a,2.7,0);
   g.userData.tick=(t,dt)=>{if(c.userData.tick)c.userData.tick(t,dt);if(!g.userData.mexeu){c.rotation.y=Math.sin(t*.3)*.45;c.rotation.x=Math.sin(t*.2)*.08;}const k=t<3.5?.02+.6*ease(t/3.5):.62+Math.min(t-3.5,10)*.012;c.scale.setScalar(k);};g.userData.liberar=()=>CM.dispose(g);return g;}},
 {id:'dna',dur:32,legenda:'Mais fundo ainda: a molécula de DNA, a receita da vida. Na experiência completa, o aluno monta a dupla hélice, pareia as bases e acompanha o DNA se copiando.',
  montar(a){const g=new T.Group();const h=DM.helix();h.scale.setScalar(.36);comGiro(g,h);dicaGiro(g,-1.5,.4);luzFrente(g,1.9);g.add(new T.AmbientLight(0xffffff,1.1));aFrente(g,a,2.3,0);
   g.userData.tick=(t,dt)=>{if(!g.userData.mexeu)h.rotation.y+=dt*(.35+2.4*(1-ease(t/3.5)));h.position.y=-3.2*(1-ease(t/3.2))+Math.sin(t*.4)*.12;};g.userData.liberar=()=>DM.dispose(g);return g;}},
 {id:'coracao',dur:38,falaEm:5.4,legenda:'Este coração acabou de sair de um corpo humano. Sinta o ritmo. Atrás dele está o corpo inteiro: costelas, pulmões, fígado, intestinos. Tudo pode ser explorado por dentro.',
  montar(a){const g=new T.Group();aFrente(g,a,0,0);
   /* o corpo fica de frente para o visitante; o coração começa no lugar dele, batendo, e sai do peito até a mão do visitante */
   const S=1.6,HC=new T.Vector3(.022,1.284,.019);const corpo=corpoFundo();corpo.scale.setScalar(S);g.add(corpo);
   const P0=new T.Vector3(0,.12,-3.0),P1=new T.Vector3(.62,.3,-4.3),FRENTE=new T.Vector3(-.62,.26,-1.95);
   const vazio=spriteBrilho(BRILHO_BRANCO,0xff3040);vazio.material.opacity=0;vazio.material.depthTest=false;vazio.renderOrder=400;g.add(vazio);
   const h=coracaoModelo();const giro=comGiro(g,h);const piv=h.userData.piv,kf=h.userData.k,dc=h.userData.c.clone().sub(HC).multiplyScalar(S);
   dicaGiro(g,-.42,-1.8);g.userData.dica.position.x=-.62;luzFrente(g,1.1);const brilho=new T.PointLight(0xff4050,0,4);brilho.position.set(-.5,.45,-1.15);g.add(brilho);const contra=new T.SpotLight(0xffd8c8,1.6,6,.6,.6);contra.position.set(-.2,1.6,-3.4);contra.target=giro;g.add(contra);
   const T0=2.4,T1=5.2,spot=new T.Vector3(),ini=new T.Vector3();let ultimo=-1,saiu=false;
   g.userData.tick=(t,dt)=>{const ciclo=(t*1.15)%1,pulso=Math.exp(-Math.pow((ciclo-.08)/.05,2))+.6*Math.exp(-Math.pow((ciclo-.3)/.06,2));
    const r=ease((t-T0)/(T1-T0+1.8));spot.lerpVectors(P0,P1,r);corpo.position.copy(spot).addScaledVector(HC,-S);
    const u=ease((t-T0)/(T1-T0));if(!saiu&&t>T0){saiu=true;somPassagem();}
    ini.copy(spot).add(dc);giro.position.lerpVectors(ini,FRENTE,u);const base=S+(kf*.82-S)*u;piv.scale.setScalar(base*(1+.015*pulso));if(h.userData.bater)h.userData.bater(ciclo);
    vazio.position.copy(spot).z+=.12;vazio.scale.setScalar(.3+.35*pulso+.2*u);vazio.material.opacity=.3+.6*pulso;
    brilho.intensity=pulso*1.4*u;const fase=ciclo<.08?0:ciclo<.3?1:2;if(fase!==ultimo){if(fase===1)somBatida(true);if(fase===2)somBatida(false);ultimo=fase;}
    if(!g.userData.mexeu&&u>=1)h.rotation.y=Math.sin((t-T1)*.3)*.6;};return g;}},
 {id:'comeco',dur:24,legenda:'Isto é só o começo. Com o Portal 360º VR, qualquer conteúdo pode virar uma experiência: do átomo ao universo, da célula ao corpo humano. O limite é a imaginação.',
  montar(a){const g=new T.Group();g.position.copy(a.p);g.rotation.y=a.yaw;
   const tit=placa('Isto é só o começo','',2.2,.28,{fundo:false,tamT:96,y0:96});tit.position.set(0,.35,-2.6);tit.material.opacity=0;g.add(tit);
   const sub=placa('','Qualquer conteúdo pode virar uma experiência imersiva.',2.6,.32,{fundo:false,tamC:46,y0:54,corC:'#7CFFB8'});sub.position.set(0,0,-2.6);sub.material.opacity=0;g.add(sub);
   const FR=['Explorar o universo','Entrar no corpo humano','Mergulhar numa célula','Descer ao centro da Terra','Montar moléculas','Ver a física acontecer','Caminhar por ecossistemas','Visitar a história','Enxergar a matemática','Viajar pelo planeta','Dar vida à geografia','Aprender fazendo'];
   const anel=new T.Group();g.add(anel);const itens=[];FR.forEach((f,i)=>{const ang=i/FR.length*Math.PI*2,r=3.3,y=(i%3-1)*.45+.25;const p=placa('',f,1.3,.16,{fundo:'rgba(6,30,44,.72)',borda:'rgba(124,255,184,.55)',tamC:56,y0:88});
    p.position.set(Math.sin(ang)*r,y,-Math.cos(ang)*r);p.rotation.y=-ang;p.material.opacity=0;anel.add(p);itens.push(p);});
   const brilho=spriteBrilho(BRILHO_AZUL);brilho.scale.set(5,5,1);brilho.position.set(0,.2,-3.4);brilho.material.opacity=.35;g.add(brilho);
   let som=false;g.userData.tick=(t,dt)=>{if(!som){som=true;somPassagem();}tit.material.opacity=ease(t/1.2);sub.material.opacity=ease((t-1.2)/1.2);
    itens.forEach((p,i)=>{p.material.opacity=ease((t-2.2-i*.55)/.8);});anel.rotation.y=t*.06;brilho.material.opacity=.3+.12*Math.sin(t*1.5);};return g;}},
 {id:'final',dur:9,legenda:'Portal 360º VR, da NEWPC: o conhecimento por dentro.',
  montar(a){const g=new T.Group();aFrente(g,a,2.6,.25);const nuvem=nuvemExplosiva(1200,[.05,.2],.4);nuvem.userData.implodir(1);nuvem.material.opacity=0;g.add(nuvem);
   const logo=logoComHalo(.42);logo.scale.setScalar(.001);g.add(logo);
   const tit=placa('Portal 360º VR','O conhecimento por dentro',2.0,.42,{fundo:false,tamT:104,tamC:56,corC:'#9fe8ff'});tit.position.y=-.78;tit.material.opacity=0;g.add(tit);
   const cr=placa('','Modelos anatômicos: Z-Anatomy (CC BY-SA 4.0) · NEWPC Educação',1.4,.08,{fundo:false,tamC:30,corC:'#7f9aae'});cr.position.y=-1.1;g.add(cr);
   let bum=false;g.userData.tick=(t,dt)=>{if(!bum&&t>.3){bum=true;somExplosao(.55);nuvem.userData.explodir();}if(bum)nuvem.userData.voar(dt,1-(t-.3)/2.5);
    logo.scale.setScalar(Math.max(.001,elastico((t-.3)/1.1)));logo.userData.halo.material.opacity=.7+.3*Math.sin(t*2);tit.material.opacity=ease((t-1)/1);};return g;}},
 /* pesquisa rápida: uma pergunta, três carinhas; o visitante aponta e aperte o gatilho. Depois, o convite para o consultor. */
 {id:'pesquisa',dur:24,legenda:'Uma pergunta rápida antes de tirar o óculos: quanto isso faria diferença nas escolas da sua rede? Aponte para uma carinha e aperte o gatilho.',
  montar(a){const g=new T.Group();aFrente(g,a,2.2,.05);
   const q=placa('Quanto isso faria diferença nas escolas da sua rede?','',1.9,.34,{fundo:false,tamT:70});q.position.y=.56;q.material.opacity=0;g.add(q);
   const bts=PESQ.map((o,i)=>{const b=carinha(o);b.position.set((i-1)*.6,0,0);b.material.opacity=0;g.add(b);return b;});
   const inst=placa('','Aponte e aperte o gatilho',1.2,.09,{fundo:false,tamC:44,corC:'#8fb0c2'});inst.position.y=-.42;inst.material.opacity=0;g.add(inst);
   const obg=placa('Obrigado!','Agora tire o óculos e fale com nosso consultor aqui no estande.',1.7,.42,{fundo:'rgba(10,70,46,.94)',borda:'rgba(124,255,184,.85)',tamT:88,tamC:50});obg.position.set(0,.05,.08);obg.visible=false;obg.material.opacity=0;g.add(obg);
   let resp=null,tR=0,tA=0;g.userData.botoes=bts;
   g.userData.escolher=b=>{if(resp)return;resp=b;tR=tA;registrarPesquisa(b.userData.valor);pararVoz();somAcerto();legendaTexto('Obrigado! Agora tire o óculos e fale com nosso consultor aqui no estande.');};
   g.userData.tick=(t,dt)=>{tA=t;q.material.opacity=ease(t/.8);inst.material.opacity=resp?Math.max(0,1-(t-tR)*3):ease((t-1.4)/.8);
    bts.forEach((b,i)=>{const alvo=resp?(b===resp?1.35:.7):(b.userData.hover?1.18:1);const s=b.scale.x+(alvo-b.scale.x)*Math.min(1,dt*10);b.scale.setScalar(s);
     b.material.opacity=resp?(b===resp?Math.max(0,1-(t-tR-.5)*2):Math.max(0,.9-(t-tR)*3)):ease((t-.5-i*.25)/.6);});
    if(resp){const e=t-tR-.5;if(e>0){obg.visible=true;obg.material.opacity=ease(e/.6);obg.scale.setScalar(.8+.2*elastico(e/.9));}if(t-tR>6.5)g.userData.acabou=true;}};
   return g;}}
];

/* ---------- interação: segurar o gatilho e mover a mão gira o objeto da cena ---------- */
const pegas=new Map(),_d=new T.Vector3(),_q=new T.Quaternion();
function direcao(ctrl){ctrl.getWorldQuaternion(_q);_d.set(0,0,-1).applyQuaternion(_q);return{yaw:Math.atan2(_d.x,-_d.z),pitch:Math.asin(Math.max(-1,Math.min(1,_d.y)))};}
const ray=new T.Raycaster(),_m4=new T.Matrix4();
/* setas de navegação do visitante: "Voltar" e "Avançar", fixas nos cantos de baixo da cena; apontar e apertar o gatilho.
   Quem não quer esperar a narração terminar pula; quem perdeu algo volta. Sem toque, o tour segue sozinho como antes. */
function botaoSeta(dir){const c=document.createElement('canvas');c.width=256;c.height=300;const x=c.getContext('2d');
 /* discreta: anel fino, fundo quase transparente, seta em traço; acende ao apontar */
 x.fillStyle='rgba(4,16,28,.35)';x.strokeStyle='rgba(220,240,255,.85)';x.lineWidth=5;x.beginPath();x.arc(128,116,92,0,Math.PI*2);x.fill();x.stroke();
 x.strokeStyle='#ffffff';x.lineWidth=14;x.lineCap='round';x.lineJoin='round';x.beginPath();if(dir>0){x.moveTo(108,72);x.lineTo(152,116);x.lineTo(108,160);}else{x.moveTo(148,72);x.lineTo(104,116);x.lineTo(148,160);}x.stroke();
 x.font='500 38px Segoe UI,Arial';x.textAlign='center';x.fillStyle='rgba(220,240,255,.9)';x.fillText(dir>0?'avançar':'voltar',128,270);
 const m=new T.Mesh(new T.PlaneGeometry(.13,.152),new T.MeshBasicMaterial({map:texCanvas(c),transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));m.renderOrder=2500;m.userData.nav=dir;return m;}
const NAV=new T.Group(),NAV_B=[botaoSeta(-1),botaoSeta(1)];NAV.add(NAV_B[0],NAV_B[1]);NAV.visible=false;scene.add(NAV);
/* nas laterais da legenda, na mesma altura (abaixo da linha dos olhos), fora do centro da cena */
function posicionarNav(a){NAV.position.copy(a.p);NAV.rotation.y=a.yaw;NAV_B[0].position.set(-.86,-.5,-1.6);NAV_B[0].rotation.y=.5;NAV_B[1].position.set(.86,-.5,-1.6);NAV_B[1].rotation.y=-.5;}
function alvosRaio(){const bs=atual&&atual.userData.botoes?atual.userData.botoes.slice():[];if(NAV.visible)bs.push(NAV_B[0],NAV_B[1]);return bs;}
function acionar(obj){if(obj.userData.nav){if(!pendente){if(obj.userData.nav>0)proxima();else anterior();}return true;}if(atual&&atual.userData.escolher){atual.userData.escolher(obj);return true;}return false;}
function botaoNoRaio(){const bs=alvosRaio();if(!bs.length)return null;const h=ray.intersectObjects(bs,false).find(x=>x.object.material.opacity>.3||(x.object.userData.nav&&NAV.visible&&x.object.material.opacity>.2));return h||null;}
function raioDoControle(ctrl){_m4.identity().extractRotation(ctrl.matrixWorld);ray.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(_m4);return botaoNoRaio();}
function pegar(ctrl){const alvo=atual&&atual.userData.alvo;if(!alvo)return;const d=direcao(ctrl);pegas.set(ctrl,{y0:d.yaw,p0:d.pitch,ry:alvo.rotation.y,rx:alvo.rotation.x});atual.userData.mexeu=true;}
function soltar(ctrl){pegas.delete(ctrl);}
function girarComMao(){const alvo=atual&&atual.userData.alvo;if(!alvo)return;for(const [ctrl,p] of pegas){const d=direcao(ctrl);alvo.rotation.y=p.ry+(d.yaw-p.y0)*2.6;alvo.rotation.x=Math.max(-.9,Math.min(.9,p.rx-(d.pitch-p.p0)*2.2));}}
/* ---------- máquina do tour ---------- */
let falaPend=null,estado='parado',ind=-1,atual=null,tCena=0,anc=null,fade=0,fadeAlvo=0,pendente=null,espera=null,sessao=null,aguardaPose=0;
/* ---------- legenda de cinema: uma frase por vez, sincronizada com a voz, palavra falada em destaque ---------- */
const LEG=(()=>{const c=document.createElement('canvas');c.width=1024;c.height=216;const t=texCanvas(c);
 const m=new T.Mesh(new T.PlaneGeometry(1.5,1.5*216/1024),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,side:T.DoubleSide}));m.renderOrder=2400;m.visible=false;scene.add(m);
 return{c,g:c.getContext('2d'),t,m,chave:''};})();
function linhasLegenda(g,palavras,tam,larg){const L=[];let l=[];for(let i=0;i<palavras.length;i++){const teste=l.concat(i).map(k=>palavras[k]).join(' ');if(l.length&&g.measureText(teste).width>larg){L.push(l);l=[i];}else l.push(i);}if(l.length)L.push(l);return L;}
function desenharLegenda(txt,iPal){const {c,g}=LEG,W=c.width,H=c.height;g.clearRect(0,0,W,H);if(!txt)return;
 const palavras=txt.split(/\s+/);let tam=50,L;for(;tam>26;tam-=2){g.font='600 '+tam+'px Segoe UI,Arial';L=linhasLegenda(g,palavras,tam,W-80);if(L.length*tam*1.3<=H-36)break;}
 const alt=L.length*tam*1.3+30,y0=(H-alt)/2;g.fillStyle='rgba(3,12,24,.82)';const r=26;g.beginPath();if(g.roundRect)g.roundRect(4,y0,W-8,alt,r);else g.rect(4,y0,W-8,alt);g.fill();
 g.textBaseline='middle';g.font='600 '+tam+'px Segoe UI,Arial';const esp=g.measureText(' ').width;
 L.forEach((ln,k)=>{const larg=ln.reduce((a,i)=>a+g.measureText(palavras[i]).width,0)+esp*(ln.length-1);let x=(W-larg)/2;const y=y0+15+tam*1.3*(k+.5);
  for(const i of ln){g.fillStyle=iPal<0||i<iPal?'#ffffff':i===iPal?'#7CFFB8':'#8ea8ba';g.fillText(palavras[i],x,y);x+=g.measureText(palavras[i]).width+esp;}});}
function mostrarFrase(txt,iPal){const chave=(txt||'')+'|'+iPal;if(chave===LEG.chave)return;LEG.chave=chave;
 /* tela: mesma frase, com a palavra atual em destaque */
 const el=$('legenda');el.textContent='';if(txt){txt.split(/\s+/).forEach((w,i)=>{const sp=document.createElement('span');sp.textContent=w+' ';if(iPal>=0)sp.style.color=i<iPal?'#ffffff':i===iPal?'#7CFFB8':'#8ea8ba';el.appendChild(sp);});}
 desenharLegenda(txt,iPal);LEG.t.needsUpdate=true;LEG.m.visible=!!txt&&renderer.xr.isPresenting;
 if(LEG.m.visible&&anc)aFrente(LEG.m,anc,2.1,-.62);}
function legendaTexto(txt){mostrarFrase(txt||'',-1);}
/* a cada quadro: qual frase e qual palavra o narrador está falando agora */
function atualizarLegenda(){if(!fala||!fala.itens)return;const it=fala.itens;
 if(fala.fimEm){if(performance.now()-fala.fimEm>2200){fala=null;mostrarFrase('',-1);}return;}
 const t=voz.currentTime||0;let k=-1;for(let i=0;i<it.length;i++)if(it[i].t<=t+.05)k=i;if(k<0){mostrarFrase('',-1);return;}
 const f=it[k],palavras=f.txt.split(/\s+/),tot=f.txt.length,frac=Math.min(1,Math.max(0,(t-f.t)/Math.max(.3,f.f-f.t)));let acc=0,w=palavras.length;
 for(let i=0;i<palavras.length;i++){acc+=palavras[i].length+1;if(acc/tot>frac){w=i;break;}}mostrarFrase(f.txt,t>f.f?palavras.length:w);}
function limparCena(){pegas.clear();if(atual){if(atual.userData.liberar)atual.userData.liberar();else liberar(atual);atual=null;}}
function trocar(fn){pendente=fn;fadeAlvo=1;}
function montarEspera(){limparEspera();anc=ancora();const g=new T.Group();aFrente(g,anc,4.2,.1);
 const n=2200,pos=new Float32Array(n*3),cor=new Float32Array(n*3);for(let i=0;i<n;i++){const braco=i%3,r=.3+Math.pow(Math.random(),.7)*2.6,ang=braco*2.094+r*1.9+(Math.random()-.5)*.5;pos[i*3]=Math.cos(ang)*r;pos[i*3+1]=(Math.random()-.5)*.18*(3-r);pos[i*3+2]=Math.sin(ang)*r;const k=1-r/3;cor[i*3]=.5+.5*k;cor[i*3+1]=.75+.25*k;cor[i*3+2]=1;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(cor,3));
 const gal=new T.Points(geo,new T.PointsMaterial({size:.05,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending,map:BRILHO_BRANCO}));gal.rotation.x=1.15;g.add(gal);
 const logo=logoComHalo(.38);logo.position.y=.15;g.add(logo);
 const p=placa('','Portal 360º VR',1.6,.2,{fundo:false,tamC:90,y0:110});p.position.y=-.55;g.add(p);
 const c=lerContagem();const cont=placa('','Aperte o gatilho  ·  demonstrações hoje: '+(c[hoje()]||0),1.3,.08,{fundo:false,tamC:40,y0:52,corC:'#8fb0c2'});cont.position.y=-.8;g.add(cont);
 g.userData.tick=t=>{gal.rotation.z=t*.08;logo.userData.halo.material.opacity=.6+.4*Math.sin(t*1.6);logo.position.y=.15+Math.sin(t*.9)*.04;};scene.add(g);espera=g;}
function limparEspera(){if(espera){liberar(espera);espera=null;}}
function irEspera(){pararVoz();estado='espera';ind=-1;trocar(()=>{limparCena();legendaTexto('');montarEspera();});}
const CENA_INI=Math.max(0,CENAS.findIndex(c=>c.id===new URLSearchParams(location.search).get('cena')));/* ?cena=coracao abre direto numa cena (ensaio da equipe) */
function iniciar(){if(estado==='tour')return;sfx();try{musica.play().catch(()=>{});}catch(_){}estado='tour';ind=CENA_INI-1;proxima();}
function anterior(){if(estado!=='tour'||ind<=0)return;ind-=2;proxima();}
function proxima(){pararVoz();falaPend=null;ind++;if(ind>=CENAS.length){somar();irEspera();return;}
 const cena=CENAS[ind];if(ind>0)somPassagem();trocar(()=>{limparEspera();limparCena();if(ind===0||!anc||cena.id==='abertura')anc=ancora();atual=cena.montar(anc);scene.add(atual);posicionarNav(anc);tCena=0;falaPend=cena.falaEm?cena:null;legendaTexto('');if(!cena.falaEm)narrar(cena.id,cena.legenda);});}
function encerrarTela(){pararVoz();musica.pause();estado='parado';limparCena();limparEspera();legendaTexto('');$('barra').hidden=true;$('painel').classList.remove('oculto');}

/* ---------- entrada: VR, tela, controles ---------- */
const ctrls=[0,1].map(i=>{const c=renderer.xr.getController(i);const l=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x7fd6ff}));l.scale.z=1.2;c.add(l);
 c.userData.linha=l;c.addEventListener('selectstart',()=>{if(estado==='espera')iniciar();else if(estado==='tour'){const h=raioDoControle(c);if(!(h&&acionar(h.object)))pegar(c);}});c.addEventListener('selectend',()=>soltar(c));scene.add(c);return c;});
async function entrarVR(){sfx();if(!navigator.xr||!window.isSecureContext){alert('Abra este endereço no navegador do óculos (HTTPS).');return;}
 try{const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});renderer.xr.setReferenceSpaceType('local-floor');await renderer.xr.setSession(s);sessao=s;
  s.addEventListener('end',()=>{sessao=null;encerrarTela();});s.addEventListener('visibilitychange',()=>{if(s.visibilityState==='visible'&&estado==='espera'&&!pendente&&espera)setTimeout(()=>{if(estado==='espera')iniciar();},1200);});$('painel').classList.add('oculto');try{musica.play().catch(()=>{});}catch(_){}estado='espera';aguardaPose=20;fade=1;fadeAlvo=1;}
 catch(e){alert('Não foi possível abrir o VR: '+(e&&e.message||e));}}
function verNaTela(){$('painel').classList.add('oculto');$('barra').hidden=false;camera.position.set(0,1.6,0);camera.rotation.set(0,0,0);anc=null;iniciar();}
let arr=null;canvas.addEventListener('pointerdown',e=>{if(atual){ray.setFromCamera({x:e.clientX/innerWidth*2-1,y:-(e.clientY/innerHeight)*2+1},camera);const h=botaoNoRaio();if(h&&acionar(h.object))return;}const al=atual&&atual.userData.alvo;if(!al)return;arr={x:e.clientX,y:e.clientY,ry:al.rotation.y,rx:al.rotation.x};atual.userData.mexeu=true;});
addEventListener('pointermove',e=>{if(atual&&!arr&&!sessao){ray.setFromCamera({x:e.clientX/innerWidth*2-1,y:-(e.clientY/innerHeight)*2+1},camera);const h=botaoNoRaio();alvosRaio().forEach(b=>b.userData.hover=!!h&&h.object===b);canvas.style.cursor=h?'pointer':'';}const al=atual&&atual.userData.alvo;if(!arr||!al)return;al.rotation.y=arr.ry+(e.clientX-arr.x)*.008;al.rotation.x=Math.max(-.9,Math.min(.9,arr.rx+(e.clientY-arr.y)*.006));});addEventListener('pointerup',()=>{arr=null;});
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
 if(a==='vr')entrarVR();else if(a==='tela')verNaTela();else if(a==='pular'){if(estado==='tour')proxima();}else if(a==='voltar'){anterior();}else if(a==='parar')encerrarTela();});
addEventListener('keydown',e=>{if(estado==='parado')return;if(e.key==='ArrowRight'||e.key===' '){if(estado==='tour')proxima();else iniciar();}if(e.key==='ArrowLeft')anterior();if(e.key==='Escape')encerrarTela();});
if(!navigator.xr)$('btnVR').textContent='🥽 VR (abra no navegador do óculos)';

/* ---------- laço ---------- */
const relogio=new T.Clock();const prevBtn={};
const ACEL=Math.max(1,+(new URLSearchParams(location.search).get('acel'))||1);/* só para testes automáticos */
renderer.setAnimationLoop(()=>{const dt=Math.min(.05,relogio.getDelta())*ACEL;
 if(aguardaPose){aguardaPose--;if(!aguardaPose&&estado==='espera'){montarEspera();fadeAlvo=0;}}
 /* transição: escurece, troca, clareia */
 const vel=dt/.55;if(fade<fadeAlvo)fade=Math.min(fadeAlvo,fade+vel);else if(fade>fadeAlvo)fade=Math.max(fadeAlvo,fade-vel);
 if(pendente&&fade>=1){const f=pendente;pendente=null;f();fadeAlvo=0;}
 cortina.material.opacity=fade*(estado==='tour'&&ind>0?.88:1);cortina.visible=fade>.001;warp.userData.passo(dt,estado==='tour'&&ind>0?fade:0);
 if(falaPend&&tCena>=falaPend.falaEm){const c=falaPend;falaPend=null;narrar(c.id,c.legenda);}
 atualizarLegenda();
 if(atual&&atual.userData.tick){tCena+=dt;atual.userData.tick(tCena,dt);}
 {const cena=estado==='tour'&&ind>=0?CENAS[ind]:null,vis=!!(cena&&atual&&cena.id!=='pesquisa'&&!pendente&&tCena>1.2);NAV.visible=vis||NAV_B[0].material.opacity>.02;
  NAV_B.forEach(b=>{const alvo=!vis?0:b.userData.nav<0&&ind<=0?.15:b.userData.hover?1:.45;b.material.opacity+=(alvo-b.material.opacity)*Math.min(1,dt*6);const k=b.userData.hover&&vis?1.25:1;b.scale.setScalar(b.scale.x+(k-b.scale.x)*Math.min(1,dt*10));});}
 if(atual&&sessao){const bs=alvosRaio();bs.forEach(b=>b.userData.hover=false);for(const c of ctrls){const h=raioDoControle(c);if(h)h.object.userData.hover=true;c.userData.linha.scale.z=h?h.distance:2.4;}}
 if(atual){girarComMao();const dc=atual.userData.dica;if(dc){const vis=tCena<12&&!atual.userData.mexeu;dc.material.opacity+=((vis?1:0)-dc.material.opacity)*Math.min(1,dt*4);dc.visible=dc.material.opacity>.02;}}
 if(espera&&espera.userData.tick)espera.userData.tick(relogio.elapsedTime);
 if(estado==='tour'&&ind>=0&&ind<CENAS.length&&!pendente&&(tCena>CENAS[ind].dur||(atual&&atual.userData.acabou)))proxima();
 /* botões da equipe: A/X pula a cena, B/Y volta à espera */
 if(sessao)for(const src of sessao.inputSources){const gp=src.gamepad;if(!gp)continue;const k=src.handedness;const ax=gp.axes[2]||0;if(Math.abs(ax)>.2&&atual&&atual.userData.alvo){atual.userData.alvo.rotation.y+=ax*dt*1.6;atual.userData.mexeu=true;}const a=!!(gp.buttons[4]&&gp.buttons[4].pressed),b=!!(gp.buttons[5]&&gp.buttons[5].pressed);
  if(a&&!prevBtn[k+'a']&&estado==='tour')proxima();if(b&&!prevBtn[k+'b']&&estado==='tour')irEspera();prevBtn[k+'a']=a;prevBtn[k+'b']=b;}
 renderer.render(scene,camera);});

/* uso sem internet no estande: guarda tudo no aparelho na primeira visita */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
window.PortalEstande={versao:VERSAO,PLACAS,legCanvas:LEG.c,get atual(){return atual;},CENAS,iniciar,proxima,irEspera,get estado(){return estado;},get ind(){return ind;},get t(){return tCena;}};
})();
