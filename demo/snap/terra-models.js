/* Terra por Dentro · modelos procedurais (v1.0)
   Tudo gerado no navegador: superfície com continentes por ruído, camadas em esferas aninhadas, corte com plano de recorte
   e "tampas" em anel (secção), viagem ao centro em túnel helicoidal com cores por camada. Sem arquivos externos. */
(function(){'use strict';
const T=THREE,D=window.TERRA_DATA,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const R=3; /* raio da Terra na cena */
/* proporções didáticas (a crosta real teria 0,5% do raio e ficaria invisível) */
const CAMADAS=[
 {key:'crosta',r:1.0,r0:.965,cor:0x8fd0a0,emis:0x0a2a14},
 {key:'manto_superior',r:.965,r0:.89,cor:0xe07a3c,emis:0x3a1a08},
 {key:'manto_inferior',r:.89,r0:.55,cor:0xc84a28,emis:0x3a0e06},
 {key:'nucleo_externo',r:.55,r0:.25,cor:0xf0a030,emis:0x6a3a08},
 {key:'nucleo_interno',r:.25,r0:0,cor:0xfff0a0,emis:0x8a7030}
];
const mat=(color,extra={})=>new T.MeshStandardMaterial(Object.assign({color,roughness:.7,metalness:.05},extra));
function tag(o,data){o.traverse(x=>{if(x.isMesh)x.userData.hit=data;});o.userData.hit=data;return o;}
function ball(r,color,pos,extra,seg=24){const m=new T.Mesh(new T.SphereGeometry(r,seg,Math.max(10,seg*.7|0)),mat(color,extra));if(pos)m.position.copy(pos);return m;}
function label(text,color='#e7f6ff',width=1.5,size=56){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='600 '+size+'px Segoe UI,Arial';while(ctx.measureText(text).width>490&&size>17){size-=2;ctx.font='600 '+size+'px Segoe UI,Arial';}ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#031220';ctx.shadowBlur=7;ctx.fillStyle=color;ctx.fillText(text,256,64);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.anisotropy=8;const sp=new T.Sprite(new T.SpriteMaterial({toneMapped:false,map:tx,transparent:true,depthWrite:false,depthTest:true}));sp.scale.set(width,width/4,1);return sp;}
function textAt(g,text,x,y,z=0,width=1.5,color){const sp=label(text,color,width);sp.position.set(x,y,z);g.add(sp);return sp;}
function rotuloFixo(text,color='#e7f6ff',width=1.5,size=56){const sp=label(text,color,width,size);const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:sp.material.map,transparent:true,depthWrite:false,side:T.DoubleSide}));sp.material.dispose();return m;}
function textFixo(g,text,x,y,z=0,width=1.5,color){const m=rotuloFixo(text,color,width);m.position.set(x,y,z);g.add(m);return m;}
/* ruído de valor com 4 oitavas (determinístico) */
function ruido2(){const P=new Uint8Array(512);let s=1337;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};const p=[];for(let i=0;i<256;i++)p.push(i);for(let i=255;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<512;i++)P[i]=p[i&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+t*(b-a),grad=(h,x,y)=>{const u=(h&1)?-x:x,v=(h&2)?-y:y;return u+v;};
  const n=(x,y)=>{const X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);const u=fade(x),v=fade(y);const A=P[X]+Y,B=P[X+1]+Y;return lerp(lerp(grad(P[A],x,y),grad(P[B],x-1,y),u),lerp(grad(P[A+1],x,y-1),grad(P[B+1],x-1,y-1),u),v);};
  return(x,y)=>{let a=0,f=1,amp=1,tot=0;for(let o=0;o<5;o++){a+=n(x*f,y*f)*amp;tot+=amp;amp*=.5;f*=2.1;}return a/tot;};}
/* superfície: Blue Marble da NASA (domínio público; cópias dos exemplos do three.js r128, convertidas para WebP) */
const TEX={};const loader=new T.TextureLoader();
function textura(nome,opt={}){if(TEX[nome])return TEX[nome];const tx=loader.load('assets/'+nome,t=>{if(opt.aoCarregar)opt.aoCarregar(t);});if(opt.srgb!==false)tx.encoding=T.sRGBEncoding;tx.anisotropy=8;TEX[nome]=tx;return tx;}
let mascara=null;
function carregarMascara(){if(mascara||carregarMascara.indo)return;carregarMascara.indo=true;const im=new Image();im.onload=()=>{const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(im,0,0,W,H);const d=x.getImageData(0,0,W,H).data;mascara=new Uint8Array(W*H);for(let k=0;k<W*H;k++)mascara[k]=d[k*4]>110?0:1;/* mapa especular: oceano claro, continente escuro */};im.src='assets/terra-oceano.webp';}
function superficie(){carregarMascara();return textura('terra-cor.webp');}
/* textura repetida (chave própria no cache; o dispose preserva tudo que está em TEX) */
function texRep(nome,rx=1,ry=1,opt={}){const k=nome+'@'+rx+'x'+ry+(opt.tag||'');if(TEX[k])return TEX[k];const tx=loader.load('assets/'+nome);if(opt.srgb!==false)tx.encoding=T.sRGBEncoding;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(rx,ry);tx.anisotropy=8;TEX[k]=tx;return tx;}
const ROCHA=(rx,ry)=>({map:texRep('vulcao-rocha.webp',rx,ry),normalMap:texRep('vulcao-rocha-normal.webp',rx,ry,{srgb:false}),normalScale:new T.Vector2(.9,.9)});
const LAVA=(tag,rx=1,ry=1)=>{const t=texRep('vulcao-lava.webp',rx,ry,{tag});return {map:t,emissiveMap:t,emissive:0xff8a30,emissiveIntensity:.9,roughness:.55};};
function fumaca(){return textura('fumaca.png',{srgb:false});}
/* é continente ou oceano no ponto (uv) tocado? */
function tipoCrosta(uv){if(!mascara||!uv)return 'crosta';const W=1024,H=512;const i=Math.floor(uv.x*W)&(W-1),j=Math.min(H-1,Math.floor((1-uv.y)*H));return mascara[j*W+i]?'crosta_continental':'crosta_oceanica';}
/* texturas procedurais (geradas uma vez): rocha/magma por camada para a secção; rocha e veias para o túnel */
const TEXP={};
function texRuido(nome,W,fn){if(TEXP[nome])return TEXP[nome];const c=document.createElement('canvas');c.width=c.height=W;const x=c.getContext('2d');const img=x.createImageData(W,W),d=img.data;const nz=ruido2();for(let j=0;j<W;j++)for(let i=0;i<W;i++){const k=(j*W+i)*4;const [r,g,b,a]=fn(i/W,j/W,nz);d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=a===undefined?255:a;}x.putImageData(img,0,0);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.wrapS=tx.wrapT=T.MirroredRepeatWrapping;tx.anisotropy=8;TEXP[nome]=tx;return tx;}
const GRAO={crosta:[.55,.3],manto_superior:[.6,.35],manto_inferior:[.6,.4],nucleo_externo:[.3,.5],nucleo_interno:[.2,.3]};
function texTampa(key){const cam=CAMADAS.find(c=>c.key===key);const base=new T.Color(cam.cor);const [amp,vei]=GRAO[key]||[.5,.3];
  return texRuido('tampa-'+key,512,(u,v,nz)=>{const dx=u-.5,dy=v-.5;const rr=Math.sqrt(dx*dx+dy*dy)*2;/* raio normalizado da Terra (a tampa usa UV centrado) */
    const g1=nz(u*48,v*48)*.5+.5,g2=nz(u*160+9,v*160)*.5+.5,g3=Math.abs(nz(u*22+40,v*22+7));/* grão, grão fino, veios */
    let k=(1-amp)+amp*(0.45*g1+0.55*g2);if(key!=='crosta'&&key!=='nucleo_interno')k*=1-vei*Math.pow(1-Math.min(1,g3*2.2),6)*.9;/* veios escuros ou claros */
    if(key==='nucleo_externo')k*=.9+.35*Math.pow(1-Math.min(1,g3*2.5),4);/* metal líquido: veios claros */
    const calor=key==='crosta'?1:1+(1-rr)*.25;/* mais claro para dentro */const r=Math.min(255,base.r*255*k*calor),g=Math.min(255,base.g*255*k*calor),b=Math.min(255,base.b*255*k*calor);return [r,g,b];});}
function texVeias(){return texRuido('veias',512,(u,v,nz)=>{const g3=Math.abs(nz(u*22+40,v*22+7));const w=Math.pow(1-Math.min(1,g3*2.2),7);const k=255*w;return [k,k*.7,k*.3];});}
function texRocha(){return texRuido('rocha',512,(u,v,nz)=>{const g1=nz(u*9,v*9)*.5+.5,g2=nz(u*40+3,v*40)*.5+.5,g3=Math.abs(nz(u*14+40,v*14+7));const fenda=Math.pow(Math.min(1,g3*3),.5);const k=(.35+.65*(0.5*g1+0.5*g2))*(.45+.55*fenda);const c=255*k;return [c,c,c];});}
function texMagma(){return texRuido('magma',512,(u,v,nz)=>{const g3=Math.abs(nz(u*7+40,v*7+7)),g4=nz(u*60,v*60)*.5+.5;const w=Math.pow(1-Math.min(1,g3*2.6),9)*(.5+.5*g4);const k=255*w;return [k,k*.5,k*.12];});}
/* núcleo externo: metal líquido em redemoinhos largos, sem veios */
function texMetal(){return texRuido('metal',512,(u,v,nz)=>{const g1=nz(u*4+11,v*4)*.5+.5,g2=nz(u*18+3,v*18+9)*.5+.5;const w=.25+.75*Math.pow(.35*g1+.65*g2,1.6);const k=255*w;return [k,k*.72,k*.3];});}
/* a Terra: esferas aninhadas; com corte, plano de recorte + tampas (anéis) na secção; destaque opcional de camadas */
function terra(opt={}){
  const g=new T.Group();const R0=opt.raio||R;const corte=!!opt.corte;const d=(opt.cortePos||0)*R0;/* 0 = pelo centro */
  const destaque=opt.destaque||null;const dim=k=>destaque&&!destaque.includes(k);
  const giro=new T.Group();g.add(giro);const tampas=new T.Group();tampas.rotation.y=opt.anguloCorte!==undefined?opt.anguloCorte:1.0;/* corte oblíquo: vê-se a secção e um pedaço da superfície */g.add(tampas);
  const plano=new T.Plane(V(0,0,-1),d);const local=plano.clone();
  CAMADAS.forEach((c,i)=>{const esf=new T.Mesh(new T.SphereGeometry(c.r*R0,i===0?64:40,i===0?48:28),mat(c.cor,{emissive:c.emis,roughness:i>=3?.45:.8,metalness:i>=3?.25:.02}));
    if(i===0){esf.material.dispose();esf.material=new T.MeshPhongMaterial({map:superficie(),normalMap:textura('terra-normal.webp',{srgb:false}),normalScale:new T.Vector2(.85,.85),specularMap:textura('terra-oceano.webp',{srgb:false}),specular:new T.Color(0x3a4a5a),shininess:18});}
    if(corte){esf.material.clippingPlanes=[plano];esf.material.clipShadows=true;}
    if(dim(c.key)){esf.material.transparent=true;esf.material.opacity=.22;esf.material.depthWrite=false;}
    if(destaque&&destaque.includes(c.key)&&c.key!=='crosta'){esf.material.emissive=new T.Color(c.cor).multiplyScalar(.35);}
    esf.userData.camada=c.key;const hit=opt.hitFn?opt.hitFn(c.key):null;if(hit)esf.userData.hit=hit;if(i===0)esf.userData.dinamico='crosta';
    giro.add(esf);});
  /* nuvens e halo atmosférico (acompanham o corte) */
  if(!opt.semNuvens){const nuv=new T.Mesh(new T.SphereGeometry(R0*1.012,48,32),new T.MeshLambertMaterial({map:textura('terra-nuvens.webp'),transparent:true,opacity:.85,depthWrite:false}));if(corte)nuv.material.clippingPlanes=[plano];if(destaque)nuv.material.opacity=.25;nuv.userData.semEnquadre=true;giro.add(nuv);g.userData.nuvens=nuv;
    const halo=new T.Mesh(new T.SphereGeometry(R0*1.045,48,32),new T.MeshBasicMaterial({color:0x5aa8ff,transparent:true,opacity:.14,side:T.BackSide,depthWrite:false,blending:T.AdditiveBlending}));if(corte)halo.material.clippingPlanes=[plano];halo.userData.semEnquadre=true;giro.add(halo);}
  if(corte){CAMADAS.forEach(c=>{const ro=c.r*R0,ri=c.r0*R0;if(ro<=Math.abs(d))return;const rout=Math.sqrt(ro*ro-d*d),rin=ri>Math.abs(d)?Math.sqrt(ri*ri-d*d):0;
      const anel=new T.Mesh(rin>0?new T.RingGeometry(rin,rout,96):new T.CircleGeometry(rout,96),mat(c.cor,{emissive:c.emis,roughness:.9,side:T.DoubleSide}));
      const tx=texTampa(c.key);anel.material.map=tx;anel.material.color.setHex(0xffffff);if(c.key==='nucleo_externo'||c.key==='nucleo_interno'){anel.material.emissiveMap=tx;anel.material.emissive=new T.Color(c.key==='nucleo_interno'?0xffe9a0:0xff9a30);anel.material.emissiveIntensity=c.key==='nucleo_interno'?.55:.35;}else if(c.key!=='crosta'){anel.material.emissiveMap=texVeias();anel.material.emissive=new T.Color(0xff6a20);anel.material.emissiveIntensity=c.key==='manto_inferior'?.45:.28;}
      /* mapeia a textura radial da tampa pelo raio */const uv=anel.geometry.attributes.uv,pos=anel.geometry.attributes.position;for(let k=0;k<uv.count;k++){const px=pos.getX(k),py=pos.getY(k);const rr=Math.sqrt(px*px+py*py)/(R0);uv.setXY(k,.5+px/(2*R0),.5+py/(2*R0));}uv.needsUpdate=true;
      anel.position.z=d+.002;anel.userData.camada=c.key;if(dim(c.key)){anel.material.transparent=true;anel.material.opacity=.3;}
      if(destaque&&destaque.includes(c.key)){anel.material.emissive=new T.Color(c.cor).multiplyScalar(.5);}
      const hit=opt.hitFn?opt.hitFn(c.key):null;if(hit)anel.userData.hit=hit;tampas.add(anel);
      /* linha fina entre camadas */if(rin>0){const lin=new T.Mesh(new T.RingGeometry(rin-.006*R0,rin+.006*R0,96),new T.MeshBasicMaterial({color:0x140a04,transparent:true,opacity:.55,side:T.DoubleSide}));lin.position.z=d+.004;tampas.add(lin);}});
    /* rótulos nas tampas (opcional) */
    if(opt.rotulos){CAMADAS.forEach((c,i)=>{const rm=(c.r+c.r0)/2*R0;const ang=-.55+i*.42;const rot=rotuloFixo(D.info[c.key].name,'#ffffff',1.5,60);rot.position.set(Math.cos(ang)*rm*(i===0?1.0:1.0)+(i===0?.9:0),Math.sin(ang)*rm,d+.03);if(i===0)rot.position.set(R0*1.05+.75,R0*.55,d+.03);tampas.add(rot);});}
  }
  /* campo magnético (linhas) */
  if(opt.campo){const lin=new T.Group();for(let k=0;k<8;k++){const a=k/8*Math.PI*2;const pts=[];for(let i=0;i<=40;i++){const t=i/40*Math.PI;const rr=R0*(1.02+1.3*Math.sin(t));pts.push(V(Math.cos(a)*Math.sin(t)*rr,Math.cos(t)*rr*1.0,Math.sin(a)*Math.sin(t)*rr));}const cur=new T.CatmullRomCurve3(pts);const tb=new T.Mesh(new T.TubeGeometry(cur,60,.02,6,false),new T.MeshBasicMaterial({color:0xb0a0ff,transparent:true,opacity:.75}));lin.add(tb);}lin.userData.semEnquadre=true;g.add(lin);g.userData.campo=lin;}
  /* ondas sísmicas: anéis que se expandem a partir de um ponto da superfície (na secção) */
  if(opt.ondas){const ond=new T.Group();for(let k=0;k<6;k++){const an=new T.Mesh(new T.RingGeometry(.1,.14,64),new T.MeshBasicMaterial({color:0x9fd0ff,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));an.position.set(0,R0,d+.02);an.userData.f=k/6;ond.add(an);}const epi=new T.Mesh(new T.SphereGeometry(.07,12,10),new T.MeshBasicMaterial({color:0xffffff}));epi.position.set(0,R0,d+.02);ond.add(epi);tampas.add(ond);g.userData.ondas=ond;g.userData.ondasR=R0;}
  /* poço de Kola: marcador na superfície, na secção */
  if(opt.kola){const mk=new T.Mesh(new T.CylinderGeometry(.012,.012,.1,8),new T.MeshBasicMaterial({color:0xffe08a}));mk.position.set(0,R0-.05,d+.02);tampas.add(mk);textFixo(tampas,'Poço de Kola · 12 km',1.3,R0+.25,d+.03,2.2,'#ffe08a');}
  if(corte){g.userData.plano=plano;g.userData.local=local;}g.userData.giro=giro;g.userData.tampas=tampas;g.userData.raio=R0;
  const girar=opt.girar!==false;
  g.userData.tick=(t)=>{if(girar)giro.rotation.y=t*.08;if(g.userData.nuvens)g.userData.nuvens.rotation.y=t*.012;if(corte){tampas.updateMatrixWorld(true);plano.copy(local).applyMatrix4(tampas.matrixWorld);}
    const nuc=giro.children[4];if(nuc&&nuc.material&&nuc.material.emissive)nuc.material.emissiveIntensity=.8+.3*Math.sin(t*1.6);
    if(g.userData.ondas){const R1=g.userData.ondasR;g.userData.ondas.children.forEach(an=>{if(an.userData.f===undefined)return;const u=((t*.22)+an.userData.f)%1;const r=.15+u*R1*1.85;/* só o arco que está dentro da Terra: círculo centrado no epicentro, recortado pelo disco */const a0=Math.asin(Math.min(1,r/(2*R1)));an.geometry.dispose();an.geometry=new T.RingGeometry(Math.max(.01,r-.035),r,72,1,Math.PI+a0,Math.PI-2*a0);an.material.opacity=.9*(1-u*.8);});}
    if(g.userData.campo)g.userData.campo.rotation.y=t*.08;};
  return g;
}
/* contexto: 0 planeta inteiro · 1 aberto ao meio · 2 a casca fina (fatia da crosta em escala) */
function contexto(level){const g=new T.Group();
  if(level===0){const te=terra({hitFn:()=>({type:'context',target:'aberta'})});g.add(te);textAt(g,'TERRA · 12.742 km de diâmetro',0,-R-1.0,0,4.6,'#9fd0ff');g.userData.tick=te.userData.tick;return g;}
  if(level===1){const te=terra({corte:true,rotulos:true,hitFn:()=>({type:'context',target:'crosta'})});g.add(te);textAt(g,'A TERRA ABERTA AO MEIO',0,-R-1.0,0,4.2,'#f6c37a');g.userData.tick=te.userData.tick;return g;}
  /* nível 2: fatia de 100 km de profundidade, em escala, continente × oceano */
  const te=terra({corte:true,raio:1.4,girar:false});te.position.set(-3.1,.6,0);te.scale.setScalar(.9);g.add(te);
  const F=new T.Group();F.position.set(1.4,0,0);g.add(F);const esc=.05;/* 1 km = 0,05 unidade: 100 km = 5 unidades */
  const bloco=(x,w,topo,alt,cor,hit)=>{const m=new T.Mesh(new T.BoxGeometry(w,alt,1.2),mat(cor,{roughness:.85}));m.position.set(x,topo-alt/2,0);if(hit)tag(m,hit);F.add(m);return m;};
  /* continente (esquerda, 2.2 de largura) · oceano (direita) */
  bloco(-1.15,2.2,2.5,35*esc,0x8fd0a0,{type:'inspect',key:'crosta_continental'});bloco(-1.15,2.2,2.5-35*esc,65*esc,0xe07a3c,{type:'inspect',key:'manto_superior'});
  bloco(1.15,2.2,2.5,4*esc,0x2c5f9a,null);bloco(1.15,2.2,2.5-4*esc,7*esc,0x5fa8c8,{type:'inspect',key:'crosta_oceanica'});bloco(1.15,2.2,2.5-11*esc,89*esc,0xe07a3c,{type:'inspect',key:'manto_superior'});
  /* poço de Kola */const kola=new T.Mesh(new T.BoxGeometry(.05,12*esc,.06),new T.MeshBasicMaterial({color:0xffe08a}));kola.position.set(-1.9,2.5-6*esc,.62);F.add(kola);
  textFixo(F,'Continente · crosta de 35 km',-1.15,2.85,.7,2.2,'#bfe8c8');textFixo(F,'Oceano · crosta de 7 km',1.15,2.85,.7,2.0,'#aee0f0');
  textFixo(F,'Poço de Kola · 12 km',-1.5,1.55,.7,1.7,'#ffe08a');textFixo(F,'MANTO',0,-1.2,.7,1.6,'#ffc9a0');textFixo(F,'0 a 100 km de profundidade, em escala',0,-2.95,.7,3.4,'#9cbed0');
  const seta=new T.Mesh(new T.ConeGeometry(.12,.4,12),new T.MeshBasicMaterial({color:0xffe08a}));seta.position.set(-1.9,2.5+.3,.62);seta.rotation.x=Math.PI;F.add(seta);
  g.userData.tick=te.userData.tick;return g;}
function explorar(){const g=new T.Group();const te=terra({corte:true,hitFn:k=>({type:'inspect',key:k})});g.add(te);g.userData.tick=te.userData.tick;return g;}
/* ficha projetada: a Terra aberta com a camada em destaque (ou o fenômeno) */
const DESTAQUE={crosta:['crosta'],crosta_continental:['crosta'],crosta_oceanica:['crosta'],litosfera:['crosta','manto_superior'],astenosfera:['manto_superior'],moho:['crosta','manto_superior'],manto_superior:['manto_superior'],manto_inferior:['manto_inferior'],nucleo_externo:['nucleo_externo'],nucleo_interno:['nucleo_interno'],kola:['crosta']};
function inspection(key){const g=new T.Group();
  if(ROCHAS_KEYS.includes(key)){const a=amostra(key,{r:1.0});g.add(a);g.userData.tick=a.userData.tick;g.userData.pegavel=true;return g;}
  if(VUL_PARTES.includes(key)){const alvo={magma:'camara_magmatica',vulcao_ativo:'cratera'}[key]||key;const v=vulcao({destaque:alvo,hitFn:()=>({type:'inspect',key})});v.scale.setScalar(.6);g.add(v);g.userData.tick=v.userData.tick;g.userData.pegavel=true;return g;}
  if(['estratovulcao','escudo','caldeira'].includes(key)){const v=tipoVulcao(key);v.scale.setScalar(.6);g.add(v);g.userData.tick=v.userData.tick;g.userData.pegavel=true;return g;}
  if(key==='ponto_quente'){const v=painelOrigem('pontoquente',{hit:{type:'inspect',key}});g.add(v);g.userData.tick=v.userData.tick;g.userData.pegavel=true;return g;}
  if(D.placas.some(p=>p.key===key)||['terremoto','tsunami','anel_fogo','pangeia'].includes(key)){const ov=D.placas.some(p=>p.key===key)?{destaque:key}:key==='pangeia'?{tinta:false}:{sismos:true,tinta:false};const te=globoPlacas({overlay:ov,hit:{type:'inspect',key},girar:false});te.scale.setScalar(.55);const pl=D.placas.find(p=>p.key===key);if(pl){/* vira o globo para a placa ficar de frente */const c=centroide(pl);te.userData.giro.rotation.y=-c.lon*Math.PI/180-Math.PI/2;te.rotation.x=c.lat*Math.PI/180;}g.add(te);g.userData.tick=te.userData.tick;g.userData.pegavel=true;return g;}
  if(['divergente','convergente','transformante'].includes(key)){const d=diorama(key,{rotulo:true});g.add(d);g.userData.tick=d.userData.tick;g.userData.pegavel=true;return g;}
  const o={corte:true,raio:1.6,destaque:DESTAQUE[key]||null};
  if(key==='campo_magnetico'){o.campo=true;o.corte=false;}if(key==='ondas_sismicas'){o.ondas=true;}if(key==='kola'){o.kola=true;}if(key==='terra'){o.corte=false;}
  if(key==='crosta_continental'||key==='crosta_oceanica'){o.corte=false;}
  const te=terra(o);g.add(te);g.userData.tick=te.userData.tick;g.userData.pegavel=true;return g;}
/* sequência (fita): tabuleiro com posições + bandeja de peças (porte do Corpo Humano) */
function sequencia(state,cfg){
  const g=new T.Group();const n=cfg.ordem.length,dy=.62,top=(n-1)*dy/2+.3;
  textFixo(g,cfg.titulo,.9,top+.75,0,3.4,cfg.cor);
  for(let i=0;i<n;i++){const y=top-i*dy;const key=state.colocados[i];
    const num=rotuloFixo(String(i+1),i===state.target?'#ffdb9f':'#8fb0c2',.5,96);num.position.set(-.55,y,.05);g.add(num);
    const placa=new T.Mesh(new T.BoxGeometry(2.6,.46,.16),mat(key?0x5a3a1e:0x3a2616,{transparent:!key,opacity:key?1:.65}));placa.position.set(.9,y,0);tag(placa,{type:'seqSlot',index:i});g.add(placa);
    const txt=rotuloFixo(key?cfg.rotulos[key]:'?',key?'#fff4e0':'#ffe3a8',2.4,key?72:96);txt.position.set(.9,y,.1);g.add(txt);
    if(i===state.target&&!key){const marc=new T.Mesh(new T.BoxGeometry(2.72,.56,.06),new T.MeshBasicMaterial({color:0xefd094,wireframe:true}));marc.position.set(.9,y,.02);g.add(marc);}
    if(i<n-1){const seta=new T.ArrowHelper(V(0,-1,0),V(.9,y-.25,0),.12,0xc9a070,.08,.06);g.add(seta);}
  }
  const restantes=state.bandeja.filter(k=>!state.colocados.includes(k));
  restantes.forEach((k,i)=>{const cols=2,c=i%cols,r=Math.floor(i/cols);const x=-3.75+c*1.6,y=top-.1-r*.72;
    const cam=CAMADAS.find(x=>x.key===k);const peca=new T.Mesh(new T.BoxGeometry(1.48,.56,.2),mat(cam?cam.cor:0x8a6a3a,{roughness:.5}));peca.position.set(x,y,.1);peca.userData.draggable=true;tag(peca,{type:'seqPiece',key:k});g.add(peca);
    const t=rotuloFixo(cfg.rotulos[k],k==='nucleo_interno'||k==='nucleo_externo'||k==='crosta'?'#1a1208':'#ffffff',1.46,66);t.position.set(x,y,.22);g.add(t);
    if(state.selected===k){const anel=new T.Mesh(new T.BoxGeometry(1.6,.68,.08),new T.MeshBasicMaterial({color:0xffffff,wireframe:true}));anel.position.set(x,y,.1);g.add(anel);}
  });
  if(!state.done)textFixo(g,'PEÇAS',-2.95,top+.75,0,1.4,'#c9a070');
  if(state.done){const te=terra({corte:true,raio:1.55,rotulos:false,girar:true});te.position.set(-2.9,-.1,0);g.add(te);textFixo(g,'TERRA MONTADA',-2.9,1.95,0,2.4,'#ffe08a');g.userData.tick=te.userData.tick;}
  g.userData.slots={top,dy};
  return g;
}
/* ---- Viagem ao centro: túnel helicoidal, uma volta por trecho, cores por camada ---- */
const ESCALA_VR=5.5;const VOLTAS=D.viagem.length;
function helice(t){const a=t*Math.PI*2*VOLTAS;const rr=4.2;return V(Math.cos(a)*rr,3.6-7.6*t,Math.sin(a)*rr);}
let tuboCache=null;
function corTrecho(t){const i=Math.min(VOLTAS-1,Math.floor(t*VOLTAS));const f=t*VOLTAS-i;const a=new T.Color(D.viagem[i].cor),b=new T.Color(D.viagem[Math.min(VOLTAS-1,i+1)].cor);/* transição suave nos últimos 12% de cada volta */return f>.88?a.lerp(b,(f-.88)/.12):a;}
function tunel(){if(tuboCache)return tuboCache;const pts=[];for(let i=0;i<=420;i++)pts.push(helice(i/420));const curva=new T.CatmullRomCurve3(pts);const seg=2200,rad=28;const geo=new T.TubeGeometry(curva,seg,.42,rad,false);
  /* relevo rochoso: desloca os vértices radialmente com ruído */const pos=geo.attributes.position,nor=geo.attributes.normal;const nz=ruido2();const cols=new Float32Array(pos.count*3);const v=new T.Vector3(),nn=new T.Vector3();
  for(let i=0;i<=seg;i++){const t=i/seg;const base=corTrecho(t);for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;v.fromBufferAttribute(pos,k);nn.fromBufferAttribute(nor,k);const r1=nz(t*1300,j*.9)*.5+.5,r2=nz(t*2800+5,j*1.3)*.5+.5;/* ~1 ciclo a cada 6 cm de parede */const amp=t<.3?.16:t<.72?.11:.05;v.addScaledVector(nn,(r1-.5)*amp);pos.setXYZ(k,v.x,v.y,v.z);const fenda=Math.pow(Math.abs(nz(t*4600+30,j*2.2)),.35);/* rachaduras escuras */
      /* cores em espaço linear: valores baixos para não ficarem pastel depois da conversão sRGB */const r3=r2*r2;const brilho=(t>.72?.22+.6*r3:t>.44?.05+.42*r3:.04+.38*r3)*(.55+.45*fenda);const c=base.clone().multiplyScalar(brilho);cols[k*3]=Math.min(1,c.r);cols[k*3+1]=Math.min(1,c.g);cols[k*3+2]=Math.min(1,c.b);}}
  pos.needsUpdate=true;geo.computeVertexNormals();geo.setAttribute('color',new T.BufferAttribute(cols,3));
  /* repetição da textura ao longo do túnel (u) e em volta (v) */const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*160,uv.getY(k)*3);uv.needsUpdate=true;
  /* grupos de material: crosta (voltas 0-1), manto (2-4), núcleo (5-6) */const porSeg=rad*6;geo.clearGroups();const s1=Math.round(seg*2/VOLTAS),s2=Math.round(seg*5/VOLTAS);geo.addGroup(0,s1*porSeg,0);geo.addGroup(s1*porSeg,(s2-s1)*porSeg,1);geo.addGroup(s2*porSeg,(seg-s2)*porSeg,2);
  tuboCache={geo,curva};return tuboCache;}
function viagemCena(state){const g=new T.Group();const {geo,curva}=tunel();const i=state.trecho||0;
  const mats=[new T.MeshStandardMaterial({vertexColors:true,map:texRocha(),side:T.BackSide,roughness:.95,metalness:0}),new T.MeshStandardMaterial({vertexColors:true,map:texRocha(),emissiveMap:texMagma(),emissive:new T.Color(0xff7a20),emissiveIntensity:.5,side:T.BackSide,roughness:.9,metalness:0}),new T.MeshStandardMaterial({vertexColors:true,map:texMetal(),emissiveMap:texMetal(),emissive:new T.Color(0xffb030),emissiveIntensity:.45,side:T.BackSide,roughness:.3,metalness:.7})];const tubo=new T.Mesh(geo,mats);g.add(tubo);
  /* partículas quentes dentro do túnel (faíscas no manto, metal no núcleo) */const n=1400;const pos=new Float32Array(n*3),col=new Float32Array(n*3);let s=7;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
  for(let k=0;k<n;k++){const t=rnd();const p=helice(t);const a=rnd()*Math.PI*2,rr=.16+rnd()*.2;p.x+=Math.cos(a)*rr;p.z+=Math.sin(a)*rr;p.y+=(rnd()-.5)*.3;pos[k*3]=p.x;pos[k*3+1]=p.y;pos[k*3+2]=p.z;const c=corTrecho(t).lerp(new T.Color(0xffffff),.35);col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('color',new T.BufferAttribute(col,3));
  const sp=document.createElement('canvas');sp.width=sp.height=64;const q=sp.getContext('2d');const rg=q.createRadialGradient(32,32,0,32,32,32);rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(.4,'rgba(255,220,170,.6)');rg.addColorStop(1,'rgba(255,200,120,0)');q.fillStyle=rg;q.fillRect(0,0,64,64);
  const pts=new T.Points(pg,new T.PointsMaterial({size:.005,map:new T.CanvasTexture(sp),vertexColors:true,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));pts.userData.semEnquadre=true;g.add(pts);
  /* trilha luminosa do trecho atual */const sub=[];for(let k=0;k<=16;k++)sub.push(helice((i+k/16)/VOLTAS));const curvaTrecho=new T.CatmullRomCurve3(sub);
  for(let k=0;k<=12;k++){const p=curvaTrecho.getPointAt(k/12);p.y-=.3;/* luzes no chão do túnel */const b=ball(.025,0xfff2c0,p,{emissive:0xffd080,emissiveIntensity:1.2,transparent:true,opacity:.8},8);b.userData.semEnquadre=true;b.userData.trilha=k/12;g.add(b);}
  g.userData.viagem={curva:curvaTrecho,escalaVR:ESCALA_VR,raioOlhar:0};g.userData.semGiro=true;
  g.userData.tick=t=>{g.traverse(o=>{if(o.userData.trilha!==undefined){o.material.opacity=.3+.6*Math.pow(Math.max(0,Math.sin(t*3-o.userData.trilha*8)),2);}});pts.material.opacity=.7+.25*Math.sin(t*2.1);};
  return g;}

/* ---------- Placas tectônicas ---------- */
const MOV={pacifica:[-1,.6],norteamericana:[-1,-.3],sulamericana:[-1,0],africana:[.35,.5],euroasiatica:[.6,0],indoaustraliana:[.3,1],antartica:[0,0],nazca:[1,0]};
let mascaraPlacas=null;const OVER={};
function lonx(lon,W){return (lon+180)/360*W;}function laty(lat,H){return (90-lat)/180*H;}
function poligono(x,pts,W,H,off){x.beginPath();pts.forEach(([lo,la],i)=>{const px=lonx(lo+off,W),py=laty(la,H);if(i)x.lineTo(px,py);else x.moveTo(px,py);});x.closePath();}
/* máscara: índice da placa por pixel (1024×512) */
function mascaraDePlacas(){if(mascaraPlacas)return mascaraPlacas;const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);
  D.placas.forEach((p,i)=>{x.fillStyle='rgb('+(i+1)+','+(i+1)+','+(i+1)+')';for(const off of [-360,0,360]){poligono(x,p.pts,W,H,off);x.fill();}});
  const d=x.getImageData(0,0,W,H).data;mascaraPlacas=new Uint8Array(W*H);for(let k=0;k<W*H;k++)mascaraPlacas[k]=d[k*4];return mascaraPlacas;}
function placaEm(uv){const m=mascaraDePlacas();if(!uv)return null;const W=1024,H=512;const i=Math.floor(uv.x*W)&(W-1),j=Math.min(H-1,Math.floor((1-uv.y)*H));const idx=m[j*W+i];return idx?D.placas[idx-1].key:null;}
/* sobreposição: tinta por placa, fronteiras, setas de movimento, terremotos, destaque de uma placa */
function overlayPlacas(opt={}){const chave=JSON.stringify(opt);if(OVER[chave])return OVER[chave];const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  D.placas.forEach(p=>{const forte=opt.destaque===p.key,fraco=opt.destaque&&!forte;x.fillStyle=p.cor;x.globalAlpha=forte?.55:fraco?.06:(opt.tinta===false?0:.2);for(const off of [-360,0,360]){poligono(x,p.pts,W,H,off);x.fill();}});
  x.globalAlpha=1;x.strokeStyle=opt.corLinha||'#ffe08a';x.lineWidth=opt.destaque?3:4;x.lineJoin='round';D.placas.forEach(p=>{for(const off of [-360,0,360]){poligono(x,p.pts,W,H,off);x.stroke();}});
  if(opt.setas){x.fillStyle='#ffffff';x.strokeStyle='#ffffff';x.lineWidth=6;D.placas.forEach(p=>{const m=MOV[p.key];if(!m||(!m[0]&&!m[1]))return;let cx=0,cy=0;p.pts.forEach(([lo,la])=>{cx+=lo;cy+=la;});cx/=p.pts.length;cy/=p.pts.length;if(p.key==='pacifica'){cx=-160;cy=10;}if(p.key==='euroasiatica'){cx=70;cy=55;}if(p.key==='norteamericana'){cx=-100;cy=45;}
      const L=60;const px=lonx(cx,W),py=laty(cy,H),dx=m[0]/Math.hypot(m[0],m[1]),dy=-m[1]/Math.hypot(m[0],m[1]);const ex=px+dx*L,ey=py+dy*L;x.beginPath();x.moveTo(px,py);x.lineTo(ex,ey);x.stroke();x.beginPath();x.moveTo(ex+dx*18,ey+dy*18);x.lineTo(ex-dy*12,ey+dx*12);x.lineTo(ex+dy*12,ey-dx*12);x.closePath();x.fill();});}
  if(opt.sismos){let sd=11;const rnd=()=>{sd=(sd*9301+49297)%233280;return sd/233280;};x.fillStyle='#ff5a5a';D.placas.forEach(p=>{if(p.key==='antartica')return;const n=p.pts.length;for(let i=0;i<n;i++){const [a,b]=[p.pts[i],p.pts[(i+1)%n]];if(Math.abs(a[1])>=55&&Math.abs(b[1])>=55)continue;const seg=8;for(let k=0;k<seg;k++){const t=k/seg+rnd()/seg;const lo=a[0]+(b[0]-a[0])*t+(rnd()-.5)*4,la=a[1]+(b[1]-a[1])*t+(rnd()-.5)*4;const r=1.5+rnd()*4;for(const off of [-360,0,360]){x.beginPath();x.arc(lonx(lo+off,W),laty(la,H),r,0,Math.PI*2);x.fill();}}}});}
  if(opt.vulcoes){x.fillStyle='#ff8a40';x.strokeStyle='#fff1d0';x.lineWidth=2;D.vulcoes.forEach(([lo,la])=>{for(const off of [-360,0,360]){const px=lonx(lo+off,W),py=laty(la,H),r=9;x.beginPath();x.moveTo(px,py-r);x.lineTo(px+r*.9,py+r*.7);x.lineTo(px-r*.9,py+r*.7);x.closePath();x.fill();x.stroke();}});}
  const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.anisotropy=8;OVER[chave]=tx;return tx;}
/* globo com a camada das placas (sem nuvens, para as fronteiras ficarem visíveis) */
function centroide(pl){const pts=pl.pts||[];let lo=0,la=0;pts.forEach(p=>{lo+=p[0];la+=p[1];});return {lon:lo/pts.length,lat:la/pts.length};}
function globoPlacas(opt={}){const te=terra({semNuvens:true,girar:opt.girar!==false,hitFn:()=>null});const giro=te.userData.giro;const R0=te.userData.raio;
  const ov=new T.Mesh(new T.SphereGeometry(R0*1.006,64,48),new T.MeshBasicMaterial({map:overlayPlacas(opt.overlay||{}),transparent:true,depthWrite:false}));ov.userData.dinamico=opt.contexto?null:'placa';if(opt.hit)ov.userData.hit=opt.hit;giro.add(ov);te.userData.overlay=ov;
  /* a crosta por baixo não deve capturar o toque nesta cena */giro.children[0].userData.dinamico=null;giro.children[0].userData.hit=null;
  mascaraDePlacas();return te;}
function placContexto(level){const g=new T.Group();const te=globoPlacas({contexto:true,hit:{type:'context'},overlay:level===0?{}:level===1?{setas:true}:{sismos:true,tinta:false}});g.add(te);
  textAt(g,level===0?'A LITOSFERA É UM QUEBRA-CABEÇA DE PLACAS':level===1?'SETAS: PARA ONDE CADA PLACA SE MOVE':'PONTOS VERMELHOS: TERREMOTOS',0,-R-1.0,0,level===0?6.0:5.4,level===2?'#ff9a9a':'#ffe08a');g.userData.tick=te.userData.tick;return g;}
function placasExp(){const g=new T.Group();const te=globoPlacas({hit:{type:'inspect',key:'pacifica'}});g.add(te);g.userData.tick=te.userData.tick;return g;}
/* posição na esfera a partir de lat/lon (coerente com o mapeamento UV da SphereGeometry) */
function pontoGeo(lat,lon,r){const la=lat*Math.PI/180,lo=lon*Math.PI/180;return V(r*Math.cos(la)*Math.cos(lo),r*Math.sin(la),-r*Math.cos(la)*Math.sin(lo));}
function voltaCena(state,opt={}){const g=new T.Group();const lista=opt.paradas||D.volta;const par=lista[state.etapa]||lista[0];const te=globoPlacas({girar:false,overlay:opt.overlay||{sismos:true},hit:{type:'inspect',key:'pacifica'}});g.add(te);const giro=te.userData.giro,R0=te.userData.raio;
  /* pino na parada */const pin=new T.Group();const haste=new T.Mesh(new T.CylinderGeometry(.02,.02,.35,8),new T.MeshBasicMaterial({color:0xffffff}));haste.position.y=.17;pin.add(haste);const bola=new T.Mesh(new T.SphereGeometry(.09,16,12),new T.MeshBasicMaterial({color:0xff5a5a}));bola.position.y=.4;pin.add(bola);const anel=new T.Mesh(new T.RingGeometry(.12,.16,32),new T.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.9,side:T.DoubleSide}));anel.rotation.x=-Math.PI/2;anel.position.y=.01;pin.add(anel);
  const p=pontoGeo(par.lat,par.lon,R0*1.0);pin.position.copy(p);pin.lookAt(p.clone().multiplyScalar(2));pin.rotateX(Math.PI/2);giro.add(pin);pin.userData.semEnquadre=true;
  const rot=rotuloFixo(par.titulo,'#ffffff',2.0,60);rot.position.copy(pontoGeo(par.lat+9,par.lon,R0*1.1));rot.lookAt(rot.position.clone().multiplyScalar(2));giro.add(rot);rot.userData.semEnquadre=true;
  /* o globo gira até a parada ficar de frente (+z) */const alvo=-par.lon*Math.PI/180-Math.PI/2;giro.rotation.y=alvo;g.userData.alvoGiro=alvo;g.userData.giro=giro;g.userData.lat=par.lat;
  const t0=te.userData.tick;g.userData.tick=t=>{if(t0)t0(t);let d=alvo-giro.rotation.y;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;giro.rotation.y+=d*.06;anel.scale.setScalar(1+.35*Math.sin(t*4));bola.position.y=.4+.04*Math.sin(t*3);};
  return g;}
/* maquetes dos três limites */
function diorama(tipo,opt={}){const g=new T.Group();const Wb=1.5,Hb=.5,Pb=1.2;
  const manto=new T.Mesh(new T.BoxGeometry(3.3,.5,Pb),mat(0xe07a3c,{emissive:0x4a1a05,emissiveIntensity:.6,roughness:.9}));manto.position.y=-.5;g.add(manto);
  const bloco=(x,w,h,cor,oce)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,Pb),mat(cor,{roughness:.85}));b.position.set(x,h/2-.25,0);if(oce){const agua=new T.Mesh(new T.BoxGeometry(w,.12,Pb),mat(0x2c6fa8,{transparent:true,opacity:.75,roughness:.3}));agua.position.y=h/2+.06;b.add(agua);}g.add(b);return b;};
  if(tipo==='divergente'){const a=bloco(-.85,Wb,.42,0x5fa8c8,true),b=bloco(.85,Wb,.42,0x5fa8c8,true);const magma=new T.Mesh(new T.BoxGeometry(.22,.95,Pb*.98),mat(0xff7a20,{emissive:0xff5a10,emissiveIntensity:.9}));magma.position.y=-.25;g.add(magma);const nova1=new T.Mesh(new T.BoxGeometry(.18,.4,Pb),mat(0x3a3a3a,{roughness:.95}));nova1.position.set(-.3,-.05,0);g.add(nova1);const nova2=nova1.clone();nova2.position.x=.3;g.add(nova2);
    g.userData.tick=t=>{const k=(Math.sin(t*.9)+1)/2;a.position.x=-.85-k*.25;b.position.x=.85+k*.25;nova1.position.x=-.3-k*.2;nova2.position.x=.3+k*.2;magma.scale.y=.9+.2*Math.sin(t*2.3);};}
  else if(tipo==='convergente'){const cont=bloco(.8,1.7,.62,0x8fd0a0,false);const oce=bloco(-1.0,1.9,.4,0x5fa8c8,true);oce.rotation.z=-.42;oce.position.set(-.75,-.1,0);const cone=new T.Mesh(new T.ConeGeometry(.3,.5,16),mat(0x6a4a3a,{roughness:.95}));cone.position.set(.55,.5,0);g.add(cone);const lava=new T.Mesh(new T.ConeGeometry(.07,.12,10),mat(0xff7a20,{emissive:0xff5a10,emissiveIntensity:1}));lava.position.set(.55,.78,0);g.add(lava);const cam=new T.Mesh(new T.SphereGeometry(.18,12,10),mat(0xff7a20,{emissive:0xff5a10,emissiveIntensity:.8}));cam.position.set(.45,-.15,0);g.add(cam);
    g.userData.tick=t=>{const k=(t*.25)%1;oce.position.x=-.55-k*.4;oce.position.y=.05-k*.28;lava.scale.setScalar(.8+.5*Math.abs(Math.sin(t*3)));cam.scale.setScalar(1+.08*Math.sin(t*2));};}
  else{const a=bloco(-.8,1.6,.5,0x8fd0a0,false),b=bloco(.8,1.6,.5,0xa8c890,false);const rio1=new T.Mesh(new T.BoxGeometry(1.6,.03,.14),mat(0x2c6fa8,{roughness:.3}));rio1.position.set(0,.26,0);a.add(rio1);const rio2=rio1.clone();b.add(rio2);const falha=new T.Mesh(new T.BoxGeometry(.03,.52,Pb),mat(0x2a1a10));falha.position.y=0;g.add(falha);
    g.userData.tick=t=>{const k=((t*.18)%1);const z=(k<.5?k:1-k)*1.2-.3;a.position.z=z;b.position.z=-z;};}
  const titulo=opt.rotulo?D.info[tipo].name:'?';const rot=rotuloFixo(titulo,opt.rotulo?'#ffe08a':'#9cbed0',2.2,opt.rotulo?62:110);rot.position.set(0,-1.15,.65);g.add(rot);
  g.traverse(o=>{if(o.isMesh)o.userData.hit={type:'lim',tipo};});
  return g;}
function limitesCena(state){const g=new T.Group();['divergente','convergente','transformante'].forEach((tipo,i)=>{const d=diorama(tipo,{rotulo:!!(state&&state[tipo])});d.position.x=(i-1)*3.7;g.add(d);});textFixo(g,'TOQUE EM CADA MAQUETE',0,1.6,0,3.6,'#ffe08a');const ticks=g.children.filter(c=>c.userData.tick).map(c=>c.userData.tick);g.userData.tick=t=>ticks.forEach(f=>f(t));return g;}
/* ===== Vulcões ===== */
const VC={cone:0x5e5048,solo:0x40342c,lava:0xff7a20,lavaEm:0xff4a08,magma:0xff5a10,cinza:0x6a625c,cinzaEscura:0x3e3733};
const VUL_PARTES=['camara_magmatica','conduto','cratera','cone','magma','lava','nuvem_cinzas','piroclastos','gases_vulcanicos','vulcao_ativo'];
/* estratos: bandas de lava escura e cinza clara, com ondulação (face de corte do cone) */
function texEstratos(){return texRuido('estratos',512,(u,v,nz)=>{const onda=nz(u*5,v*2)*.05;const b=Math.floor((v+onda)*24);const lava=(b%3)!==1;const g=nz(u*48,v*48)*.5+.5,g2=nz(u*9+3,v*9)*.5+.5;const base=lava?[92,72,58]:[158,146,132];const k=(.75+.35*g)*(.85+.3*g2);return [base[0]*k,base[1]*k,base[2]*k];});}
function uvEscala(geo,sx,sy){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*sx,uv.getY(i)*sy);uv.needsUpdate=true;return geo;}
/* ponto na superfície do cone (y entre 0 e H) a um ângulo a; folga afasta da superfície */
function vulcao(opt={}){
  const g=new T.Group();const Rb=2.1,H=1.75,rt=.38;const dest=opt.destaque||null;const hit=k=>opt.hitFn?opt.hitFn(k):{type:'inspect',key:k};
  const corte=opt.corte!==false;const planoLocal=new T.Plane(V(0,0,-1),.05)/* folga para os elementos da face de corte (z até 0,012) passarem no teste de toque */,plano=planoLocal.clone();g.userData.plano=plano;
  const dim=k=>dest&&dest!==k;
  const MM=(k,color,extra={},clip=true)=>{const m=mat(color,extra);if(corte&&clip)m.clippingPlanes=[plano];if(dim(k)){m.transparent=true;m.opacity=k==='solo'?.5:.22;m.depthWrite=false;}else if(dest===k&&k!=='solo'){m.emissive=new T.Color(extra.emissive!==undefined?extra.emissive:color);m.emissiveIntensity=extra.emissive!==undefined?Math.max(extra.emissiveIntensity||1,1.2):.45;}return m;};
  const raioEm=y=>rt+(Rb-rt)*(1-y/H);
  /* exterior: cone, solo */
  const cone=new T.Mesh(new T.CylinderGeometry(rt,Rb,H,72,6,true),MM('cone',0x9a8c80,Object.assign({roughness:.96},ROCHA(5,2))));cone.position.y=H/2;cone.userData.hit=hit('cone');g.add(cone);
  const solo=new T.Mesh(new T.CylinderGeometry(Rb*1.45,Rb*1.45,1.25,64,1,false),MM('solo',0x6a5e54,Object.assign({roughness:1},ROCHA(7,1.2))));solo.position.y=-.625;g.add(solo);
  /* face de corte (z=0): estratos do cone e rocha do solo */
  const shape=new T.Shape();shape.moveTo(-Rb,0);shape.lineTo(Rb,0);shape.lineTo(rt,H);shape.lineTo(-rt,H);shape.closePath();
  const face=new T.Mesh(uvEscala(new T.ShapeGeometry(shape),.7,1.1),MM('cone',0xffffff,{roughness:.95,map:texEstratos(),normalMap:texRep('vulcao-rocha-normal.webp',2,2,{srgb:false}),normalScale:new T.Vector2(.5,.5)},false));face.userData.hit=hit('cone');g.add(face);
  const faceSolo=new T.Mesh(new T.PlaneGeometry(Rb*2.9,1.25),MM('solo',0x5a4e46,Object.assign({roughness:1},ROCHA(4,.8)),false));faceSolo.position.set(0,-.625,-.002);g.add(faceSolo);
  /* conduto: tubo escuro + magma (nível = fração preenchida) */
  const condH=H+.52;const condFundo=new T.Mesh(new T.PlaneGeometry(.22,condH),MM('conduto',0x2a1a14,{roughness:.9},false));condFundo.position.set(0,condH/2-.52,.006);condFundo.userData.hit=hit('conduto');g.add(condFundo);
  const nivel=opt.nivel===undefined?1:Math.max(.08,Math.min(1,opt.nivel));
  const condMagma=new T.Mesh(new T.PlaneGeometry(.17,condH),MM('conduto',0xffffff,LAVA('cond',.6,3),false));condMagma.scale.y=nivel;condMagma.position.set(0,condH*nivel/2-.52,.01);condMagma.userData.hit=hit('conduto');g.add(condMagma);
  /* câmara de magma (meia elipse na face) */
  const cam=new T.Mesh(new T.CircleGeometry(.62,48),MM('camara_magmatica',0xffffff,LAVA('cam',1.2,1),false));cam.scale.set(1.55,.9,1);cam.position.set(0,-.6,.012);cam.userData.hit=hit('camara_magmatica');g.add(cam);
  const camBorda=new T.Mesh(new T.RingGeometry(.62,.68,48),MM('camara_magmatica',0xffb060,{emissive:0xff8030,emissiveIntensity:.6},false));camBorda.scale.copy(cam.scale);camBorda.position.set(0,-.6,.011);g.add(camBorda);
  /* cratera: funil exterior, lago de lava e secção do funil na face */
  const funil=new T.Mesh(new T.CylinderGeometry(rt,.16,.3,40,1,true),MM('cratera',0x3b302a,{roughness:1,side:T.DoubleSide}));funil.position.y=H-.15;funil.userData.hit=hit('cratera');g.add(funil);
  const lago=new T.Mesh(new T.CircleGeometry(.165,32),MM('cratera',0xffffff,Object.assign(LAVA('lago',1,1),{emissiveIntensity:opt.lago===false?.25:1})));lago.rotation.x=-Math.PI/2;lago.position.y=H-.29;lago.userData.hit=hit('cratera');g.add(lago);
  const sf=new T.Shape();sf.moveTo(-rt,H+.001);sf.lineTo(rt,H+.001);sf.lineTo(.16,H-.3);sf.lineTo(-.16,H-.3);sf.closePath();const funilFace=new T.Mesh(new T.ShapeGeometry(sf),MM('cratera',0x2a2320,{roughness:1},false));funilFace.position.z=.008;funilFace.userData.hit=hit('cratera');g.add(funilFace);
  /* rios de lava nas encostas (atrás do corte) */
  const rios=[];const fazRio=(A,seed)=>{const pts=[];for(let i=0;i<=16;i++){const s=i/16;const y=H-.06-s*(H+.12);const r=raioEm(Math.max(0,y))+.045;const a=A+Math.sin(s*7+seed)*.09;pts.push(V(r*Math.cos(a),y,r*Math.sin(a)));}const tubo=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.075,8,false),MM('lava',0xffffff,LAVA('rio',1,4)));tubo.userData.hit=hit('lava');g.add(tubo);rios.push(tubo);return tubo;};
  if(opt.lava!==false){fazRio(Math.PI+.55,1);if(opt.lava!=='um')fazRio(-.38,2);}
  /* nuvem de cinzas: coluna + cogumelo (sem corte) */
  const nuvemK=opt.nuvem===undefined?1:opt.nuvem;const nuvem=new T.Group();nuvem.position.y=H-.05;const fumos=[];let altN=0,raioN=0;
  if(nuvemK>0){const k=Math.min(2.4,nuvemK);const escuro=nuvemK>1.5;const cor=escuro?0x0c0a09:0x241f1c;/* valores lineares baixos: o sRGB clareia */const n=Math.round(16+12*k);altN=1.5+1.2*k;raioN=.45+.45*k;
    for(let i=0;i<n;i++){const m=new T.SpriteMaterial({alphaMap:fumaca(),color:cor,transparent:true,opacity:0,depthWrite:false,rotation:Math.random()*6.28});const sp=new T.Sprite(m);sp.userData.par={fase:i/n,giro:(Math.random()-.5)*.6,ang:Math.random()*6.28,esc:.8+Math.random()*.5};nuvem.add(sp);fumos.push(sp);}
    if(escuro||opt.brilho){for(let i=0;i<3;i++){const g=new T.Sprite(new T.SpriteMaterial({alphaMap:fumaca(),color:0xff7a2a,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending}));g.scale.setScalar(1.1+i*.4);g.position.y=.15+i*.2;g.userData.brilho=true;nuvem.add(g);}}
    /* alvo invisível para o toque e a seleção no VR */const alvo=new T.Mesh(new T.CylinderGeometry(raioN*.9,.3,altN,16,1,false),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));alvo.position.y=altN/2;alvo.userData.hit=hit('nuvem_cinzas');nuvem.add(alvo);g.add(nuvem);}
  /* piroclastos: bombas em arco (atrás do corte) */
  const bombas=[];if(opt.piroclastos!==false){const mB=MM('piroclastos',0x6a5e56,Object.assign({roughness:1,emissive:0xff4a08,emissiveIntensity:.35},ROCHA(1,1)),false);const nB=opt.piroclastos==='muitos'?16:9,kB=opt.piroclastos==='muitos'?1.7:1;for(let i=0;i<nB;i++){const b=new T.Mesh(new T.SphereGeometry((.045+.05*((i*7)%3)/2)*kB,10,8),mB);b.scale.set(1,.75+.5*((i*5)%2),1.2);b.userData.hit=hit('piroclastos');b.userData.par={a:Math.PI+.25+i*(Math.PI-.5)/(nB-1),fase:(i*.37)%1,alt:(1.8+((i*3)%4)*.25)*kB,alc:(1.3+((i*5)%3)*.35)*kB};g.add(b);bombas.push(b);}}
  /* gases: fumarola na encosta e vapor na cratera */
  const gases=[];if(opt.gases!==false){const op0=dim('gases_vulcanicos')?.06:dest==='gases_vulcanicos'?.55:.28;const A=Math.PI+1.15,y0=.55,r0=raioEm(y0);const base=V(r0*Math.cos(A),y0,r0*Math.sin(A));
    const fazGas=(b,n,esp,tam)=>{for(let i=0;i<n;i++){const sp=new T.Sprite(new T.SpriteMaterial({alphaMap:fumaca(),color:0xe6eef4,transparent:true,opacity:0,depthWrite:false,rotation:Math.random()*6.28}));sp.userData.par={fase:i/n,base:b.clone(),esp,tam,op0};g.add(sp);gases.push(sp);}const alvo=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));alvo.position.copy(b).y+=.15;alvo.userData.hit=hit('gases_vulcanicos');alvo.userData.semEnquadre=true;g.add(alvo);};
    fazGas(base,7,1.0,.45);fazGas(V(.12,H-.05,-.14),5,.7,.4);}
  /* domo de lava */let domo=null;if(opt.domo){domo=new T.Mesh(new T.SphereGeometry(.46,28,18),mat(0x6a5e56,Object.assign({roughness:.95,emissive:0xff6a20,emissiveIntensity:.5,emissiveMap:texRep('vulcao-lava.webp',2,2,{tag:'domo'})},ROCHA(2,2))));domo.scale.set(1,.72,1);domo.position.y=H+.02;domo.userData.hit=hit('cratera');g.add(domo);}
  /* fonte de lava */const jatos=[];if(opt.fonte){const mJ=mat(0xffffff,Object.assign(LAVA('jato',1,1),{emissiveIntensity:1.3}));for(let i=0;i<22;i++){const j=new T.Mesh(new T.SphereGeometry(.075,8,6),mJ);j.userData.par={fase:i/22,ang:(i*2.4)%(Math.PI*2),abre:.2+.45*((i*3)%4)/3,alt:1.8+.9*((i*5)%3)/2};j.userData.hit=hit('lava');g.add(j);jatos.push(j);}}
  /* rótulos */if(opt.rotulos){textAt(g,'Câmara de magma',-1.85,-.55,.35,1.7,'#ffb27a');textAt(g,'Conduto',-.95,.95,.35,1.1,'#ffb27a');textAt(g,'Cratera',1.0,H+.12,.35,1.0,'#ffe08a');textAt(g,'Cone: erupções antigas',1.75,.75,.35,1.9,'#e7f6ff');textAt(g,'Nuvem de cinzas',1.6,H+1.2,.35,1.6,'#d8d2c8');textAt(g,'Lava',-1.75,.45,.35,.8,'#ffe08a');}
  g.userData.tick=t=>{g.updateMatrixWorld(true);plano.copy(planoLocal).applyMatrix4(g.matrixWorld);const pulso=.75+.25*Math.sin(t*2.2);cam.material.emissiveIntensity=(dest==='camara_magmatica'?1.3:.8)*pulso;condMagma.material.emissiveIntensity=.9*pulso;lago.material.emissiveIntensity=(opt.lago===false?.25:1)*(.8+.2*Math.sin(t*3.1));
    rios.forEach((r,i)=>{r.material.emissiveIntensity=.8+.25*Math.sin(t*2.6+i);});const tl=TEX['vulcao-lava.webp@1x4rio'];if(tl)tl.offset.y=-(t*.06)%1;const tc=TEX['vulcao-lava.webp@1.2x1cam'];if(tc){tc.offset.x=(t*.012)%1;tc.offset.y=(t*.008)%1;}const tq=TEX['vulcao-lava.webp@0.6x3cond'];if(tq)tq.offset.y=-(t*.1)%1;
    if(nuvemK>0){const dimN=dim('nuvem_cinzas')?.25:1,forte=dest==='nuvem_cinzas'?1.15:1;fumos.forEach(sp=>{const p=sp.userData.par;const u=((t*.11)+p.fase)%1;const r=(.1+u*raioN*(u>.65?1+(u-.65)*2.2:1));sp.position.set(Math.cos(p.ang+u*p.giro*3)*r*.75,u*altN,Math.sin(p.ang+u*p.giro*3)*r*.6-.05);const sc=(.45+u*1.5)*p.esc*(1+.15*Math.min(2.4,nuvemK));sp.scale.set(sc,sc,1);sp.material.rotation+=.004*p.giro*10;sp.material.opacity=Math.min(1,u*5)*Math.pow(1-u,.6)*.9*dimN*forte;});nuvem.children.forEach(c=>{if(c.userData.brilho)c.material.opacity=.4+.25*Math.sin(t*6+c.position.y*7);});}
    bombas.forEach(b=>{const p=b.userData.par;const u=((t*.33)+p.fase)%1;const d=u*p.alc;b.position.set(Math.cos(p.a)*d,H-.1+p.alt*u-p.alt*1.05*u*u,Math.sin(p.a)*d);b.rotation.x=t*3+p.fase*9;b.visible=b.position.y>-.1;});
    gases.forEach(s=>{const p=s.userData.par;const u=((t*.2)+p.fase)%1;s.position.set(p.base.x+Math.sin(u*9+p.fase*7)*.1*u,p.base.y+u*p.esp*2,p.base.z-u*.15);const sc=p.tam*(.4+u*1.8);s.scale.set(sc,sc,1);s.material.rotation+=.003;s.material.opacity=p.op0*Math.min(1,u*5)*Math.pow(1-u,.8);});
    jatos.forEach(j=>{const p=j.userData.par;const u=((t*.9)+p.fase)%1;const d=u*p.abre;j.position.set(Math.cos(p.ang)*d,H-.25+p.alt*4*u*(1-u)*(.9)+.0,Math.sin(p.ang)*d*.6-.05);j.scale.setScalar(1-.5*u);});
    if(domo){domo.scale.setScalar(opt.domoCresce?Math.min(1,.3+((t*.1)%1)):1);domo.scale.y*=.72;domo.material.emissiveIntensity=.35+.2*Math.sin(t*1.8);}
    if(opt.tremor){const k=opt.tremor;g.position.x=(Math.random()-.5)*.03*k;g.position.y=(Math.random()-.5)*.02*k;}};
  g.userData.altura=H;return g;}
/* painéis de origem do magma: subducção, dorsal, ponto quente */
function painelOrigem(tipo,opt={}){const g=new T.Group();const Pb=1.2;const hit=opt.hit||{type:'context'};
  const manto=new T.Mesh(new T.BoxGeometry(3.3,.55,Pb),mat(0xe07a3c,{emissive:0x4a1a05,emissiveIntensity:.6,roughness:.9}));manto.position.y=-.55;g.add(manto);
  const bloco=(x,w,h,cor,oce)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,Pb),mat(cor,{roughness:.85}));b.position.set(x,h/2-.28,0);if(oce){const agua=new T.Mesh(new T.BoxGeometry(w,.12,Pb),mat(0x2c6fa8,{transparent:true,opacity:.75,roughness:.3}));agua.position.y=h/2+.06;b.add(agua);}g.add(b);return b;};
  const coneP=(x,y,r,h,cor)=>{const c=new T.Mesh(new T.ConeGeometry(r,h,18),mat(cor,{roughness:.95}));c.position.set(x,y,0);g.add(c);return c;};
  const bolhas=[];const bolha=(x0,y0,x1,y1,fase)=>{const b=new T.Mesh(new T.SphereGeometry(.07,10,8),mat(0xff7a20,{emissive:0xff5a10,emissiveIntensity:1}));b.userData.par={x0,y0,x1,y1,fase};g.add(b);bolhas.push(b);return b;};
  let titulo='';
  if(tipo==='subduccao'){titulo='SUBDUCÇÃO';const cont=bloco(.8,1.7,.6,0x8fd0a0,false);const oce=bloco(-1.0,1.9,.4,0x5fa8c8,true);oce.rotation.z=-.45;oce.position.set(-.7,-.12,0);const cone=coneP(.5,.55,.34,.6,0x8a7a6e);Object.assign(cone.material,ROCHA(2,1));cone.material.needsUpdate=true;const lava=coneP(.5,.86,.08,.14,0xff7a20);lava.material.emissive=new T.Color(0xff5a10);lava.material.emissiveIntensity=1;for(let i=0;i<4;i++)bolha(-.15,-.55,.45,.1,i/4);const agua=[];for(let i=0;i<3;i++){const w=new T.Mesh(new T.SphereGeometry(.04,8,6),new T.MeshBasicMaterial({color:0x9ad8ff,transparent:true,opacity:.8}));w.userData.par={fase:i/3};g.add(w);agua.push(w);}
    g.userData.tick=t=>{const k=(t*.2)%1;oce.position.x=-.55-k*.35;oce.position.y=.02-k*.25;lava.scale.setScalar(.8+.5*Math.abs(Math.sin(t*3)));bolhas.forEach(b=>{const p=b.userData.par;const u=((t*.3)+p.fase)%1;b.position.set(p.x0+(p.x1-p.x0)*u,p.y0+(p.y1-p.y0)*u,.1);b.scale.setScalar(.6+.6*u);});agua.forEach(w=>{const u=((t*.4)+w.userData.par.fase)%1;w.position.set(-.45+u*.25,-.35-u*.2,.2);w.material.opacity=.8*(1-u);});};}
  else if(tipo==='dorsal'){titulo='DORSAL';const a=bloco(-.85,1.5,.42,0x5fa8c8,true),b=bloco(.85,1.5,.42,0x5fa8c8,true);const magma=new T.Mesh(new T.BoxGeometry(.24,.9,Pb*.98),mat(0xffffff,LAVA('painel',1,1)));magma.position.y=-.3;g.add(magma);const c1=coneP(-.22,.1,.2,.3,0x4a4440),c2=coneP(.22,.1,.2,.3,0x4a4440);for(let i=0;i<3;i++)bolha(0,-.75,0,.2,i/3);
    g.userData.tick=t=>{const k=(Math.sin(t*.9)+1)/2;a.position.x=-.85-k*.22;b.position.x=.85+k*.22;magma.scale.y=.9+.2*Math.sin(t*2.3);bolhas.forEach(b=>{const p=b.userData.par;const u=((t*.35)+p.fase)%1;b.position.set((Math.sin(u*12)*.04),p.y0+(p.y1-p.y0)*u,.15);b.scale.setScalar(.5+.7*u);});};}
  else{titulo='PONTO QUENTE';const placa=bloco(0,3.2,.4,0x5fa8c8,true);const pluma=new T.Mesh(new T.CylinderGeometry(.16,.3,.55,16),mat(0xffffff,LAVA('painel',1,1)));pluma.position.set(0,-.55,.05);g.add(pluma);const cabeca=new T.Mesh(new T.SphereGeometry(.26,16,12),mat(0xffffff,LAVA('painel',1,1)));cabeca.position.set(0,-.3,.05);g.add(cabeca);
    const ilhas=[];[[0,.42,.32,0x5a4a3a,true],[-.8,.3,.22,0x4a4a44,false],[-1.5,.2,.16,0x3a3a3a,false]].forEach(([x,h,r,cor,ativa])=>{const c=coneP(x,.1+h/2-.0,r,h,cor);c.userData.x0=x;if(ativa){const lv=coneP(x,.1+h+.06,.07,.12,0xff7a20);lv.material.emissive=new T.Color(0xff5a10);lv.material.emissiveIntensity=1;c.userData.lava=lv;}ilhas.push(c);});for(let i=0;i<3;i++)bolha(0,-.3,0,.25,i/3);
    g.userData.tick=t=>{const k=(t*.06)%1;ilhas.forEach(c=>{c.position.x=c.userData.x0-k*.8;if(c.userData.lava){c.userData.lava.position.x=c.position.x;c.userData.lava.scale.setScalar(.8+.5*Math.abs(Math.sin(t*3)));}});placa.position.x=-k*.8;cabeca.scale.setScalar(1+.08*Math.sin(t*2));bolhas.forEach(b=>{const p=b.userData.par;const u=((t*.35)+p.fase)%1;b.position.set(Math.sin(u*10)*.03,p.y0+(p.y1-p.y0)*u,.2);b.scale.setScalar(.5+.6*u);});};}
  const rot=rotuloFixo(titulo,'#ffe08a',2.2,62);rot.position.set(0,-1.2,.65);g.add(rot);
  g.traverse(o=>{if(o.isMesh)o.userData.hit=hit;});return g;}
function origemMagma(opt={}){const g=new T.Group();['subduccao','dorsal','pontoquente'].forEach((tipo,i)=>{const d=painelOrigem(tipo,opt);d.position.x=(i-1)*3.7;g.add(d);});const ticks=g.children.filter(c=>c.userData.tick).map(c=>c.userData.tick);g.userData.tick=t=>ticks.forEach(f=>f(t));return g;}
/* maquetes dos tipos de vulcão */
function tipoVulcao(key){const g=new T.Group();const hit={type:'inspect',key};
  const base=new T.Mesh(new T.CylinderGeometry(2.4,2.4,.25,48),mat(0x6a5e54,Object.assign({roughness:1},ROCHA(5,1))));base.position.y=-.125;g.add(base);
  if(key==='estratovulcao'){const c=new T.Mesh(new T.ConeGeometry(1.3,2.1,48,6,true),mat(0x9a8c80,Object.assign({roughness:.95},ROCHA(4,2))));c.position.y=1.05;g.add(c);const topo=new T.Mesh(new T.ConeGeometry(.25,.4,24),mat(0xeeeeee,{roughness:.9}));topo.position.y=1.95;g.add(topo);const fumo=new T.Group();for(let i=0;i<6;i++){const b=new T.Mesh(new T.SphereGeometry(.14+i*.05,12,8),mat(VC.cinza,{roughness:1}));b.position.set(Math.sin(i)*.08,2.25+i*.2,0);fumo.add(b);}g.add(fumo);const rio=new T.Mesh(new T.BoxGeometry(.09,1.9,.06),mat(0xffffff,LAVA('rio',1,4)));rio.position.set(.62,1.0,.72);rio.rotation.z=-.55;rio.rotation.y=.4;g.add(rio);g.userData.tick=t=>{fumo.rotation.y=t*.2;};}
  else if(key==='escudo'){const c=new T.Mesh(new T.SphereGeometry(2.2,56,28,0,Math.PI*2,0,Math.PI/2),mat(0x7a6e64,Object.assign({roughness:.95},ROCHA(6,2))));c.scale.set(1,.22,1);g.add(c);const lago=new T.Mesh(new T.CircleGeometry(.22,24),mat(0xffffff,LAVA('lago',1,1)));lago.rotation.x=-Math.PI/2;lago.position.y=.485;g.add(lago);const rios=[];for(let i=0;i<4;i++){const a=i*1.6+.4;const pts=[];for(let s=0;s<=10;s++){const u=s/10;const r=.2+u*2.0;const y=.48*Math.sqrt(Math.max(0,1-(r/2.2)*(r/2.2)))+.03;pts.push(V(r*Math.cos(a+Math.sin(u*5+i)*.08),y,r*Math.sin(a+Math.sin(u*5+i)*.08)));}const tb=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.05,6,false),mat(0xffffff,LAVA('rio',1,4)));g.add(tb);rios.push(tb);}g.userData.tick=t=>{rios.forEach((r,i)=>r.material.emissiveIntensity=.8+.3*Math.sin(t*2+i));lago.material.emissiveIntensity=.9+.2*Math.sin(t*3);};}
  else{/* caldeira */const pts=[[0,0],[2.3,0],[1.75,.62],[1.25,.62],[1.15,.18],[0,.18]].map(([x,y])=>new T.Vector2(x,y));const c=new T.Mesh(new T.LatheGeometry(pts,56),mat(0x9a8c80,Object.assign({roughness:.95,side:T.DoubleSide},ROCHA(6,2))));g.add(c);const lago=new T.Mesh(new T.CircleGeometry(1.15,48),mat(0x3a8ad8,{roughness:.2,metalness:.2,emissive:0x1a4a90,emissiveIntensity:.5}));lago.rotation.x=-Math.PI/2;lago.position.y=.19;g.add(lago);const ilha=new T.Mesh(new T.ConeGeometry(.22,.3,16),mat(0x5a4a40,{roughness:.95}));ilha.position.set(.3,.3,-.2);g.add(ilha);const cam=new T.Mesh(new T.SphereGeometry(.5,16,12),mat(VC.magma,{emissive:VC.lavaEm,emissiveIntensity:.5,transparent:true,opacity:.35}));cam.scale.set(2.2,.5,2.2);cam.position.y=-.45;g.add(cam);g.userData.tick=t=>{cam.material.emissiveIntensity=.4+.2*Math.sin(t*1.5);};}
  g.traverse(o=>{if(o.isMesh)o.userData.hit=hit;});return g;}
function vulContexto(level){const g=new T.Group();
  if(level===0){const te=globoPlacas({contexto:true,hit:{type:'context'},overlay:{tinta:false,vulcoes:true}});g.add(te);g.userData.tick=te.userData.tick;textAt(g,'PONTOS LARANJA: VULCÕES ATIVOS',0,-R-1.0,0,5.6,'#ffb27a');}
  else if(level===1){const o=origemMagma({hit:{type:'context'}});g.add(o);g.userData.tick=o.userData.tick;textFixo(g,'TRÊS ORIGENS DO MAGMA',0,1.6,0,3.6,'#ffe08a');}
  else{const v=vulcao({rotulos:true,hitFn:()=>({type:'context'})});g.add(v);g.userData.tick=v.userData.tick;}
  return g;}
function vulcaoExp(){const g=new T.Group();const v=vulcao({});g.add(v);g.userData.tick=v.userData.tick;return g;}
/* laboratório: fase de preparação (pressão sobe) ou resultado */
function erupcaoCena(state){const g=new T.Group();const r=state.resultado;let v;
  if(!r){v=vulcao({lava:false,nuvem:0,piroclastos:false,lago:false,nivel:.1+.9*(state.pressao||0),tremor:(state.pressao||0)>.6?(state.pressao-.6)*2.5:0,hitFn:()=>({type:'erup'})});}
  else if(r==='efusiva')v=vulcao({nuvem:.45,piroclastos:false,hitFn:()=>({type:'erup'})});
  else if(r==='fonte')v=vulcao({lava:'um',nuvem:.7,piroclastos:false,fonte:true,brilho:true,hitFn:()=>({type:'erup'})});
  else if(r==='domo')v=vulcao({lava:false,nuvem:.5,piroclastos:false,domo:true,lago:false,hitFn:()=>({type:'erup'})});
  else v=vulcao({lava:false,nuvem:2.4,piroclastos:'muitos',brilho:true,hitFn:()=>({type:'erup'})});
  g.add(v);const titulo=r?D.ERUPCAO.resultados[r].nome.toUpperCase():(state.pressao>=1?'ERUPÇÃO!':'PRESSÃO: '+Math.round((state.pressao||0)*100)+'%');textAt(g,titulo,0,-1.45,.4,r?4.2:3.2,r==='explosiva'?'#ff9a9a':'#ffe08a');g.userData.tick=v.userData.tick;return g;}
/* ===== Rochas e minerais ===== */
const ROCHAS_KEYS=['granito','basalto','obsidiana','pomes','arenito','calcario','carvao','marmore','ardosia','quartzo','feldspato','mica'];
const ROC_ESTADO_AMOSTRA={ignea:'granito',sedimentar:'arenito',metamorfica:'marmore'};
/* texturas procedurais por rocha (256 px, cache em TEXP) */
function texRocha2(key){const W=256;const F={
  granito:(u,v,nz)=>{const a=nz(u*70,v*70),b=nz(u*45+9,v*45+3),c=nz(u*120+5,v*120+8);if(c>.55)return [40,38,40];if(a>.25)return [232,170,150];if(b>.1)return [228,224,220];return [180,176,178];},
  basalto:(u,v,nz)=>{const g=nz(u*90,v*90)*.5+.5,h=nz(u*30+7,v*30+2);const k=52+28*g;return h>.62?[26,24,24]:[k,k-2,k-4];},
  obsidiana:(u,v,nz)=>{const g=nz(u*6,v*6)*.5+.5;const k=14+22*g;return [k,k,k+6];},
  pomes:(u,v,nz)=>{const g=nz(u*80,v*80),h=nz(u*140+3,v*140+9);const buraco=g>.35||h>.5;const k=buraco?70:200+30*nz(u*20,v*20);return [k,k-4,k-10];},
  arenito:(u,v,nz)=>{const banda=.5+.5*Math.sin(v*40+nz(u*3,v*3)*2);const g=nz(u*150,v*150)*.5+.5;const k=.82+.18*g;return [(205+25*banda)*k,(170+22*banda)*k,(115+18*banda)*k];},
  calcario:(u,v,nz)=>{const g=nz(u*12,v*12)*.5+.5,h=nz(u*90+4,v*90+1)*.5+.5;const f=Math.abs(nz(u*25+40,v*25+7));const fossil=f<.05?.75:1;const k=(.86+.12*g+.06*h)*fossil;return [232*k,222*k,196*k];},
  carvao:(u,v,nz)=>{const banda=.5+.5*Math.sin(v*60+nz(u*4,v*4)*3);const g=nz(u*100,v*100)*.5+.5;const k=18+14*banda+10*g;return [k,k-1,k-2];},
  marmore:(u,v,nz)=>{const veio=Math.pow(1-Math.min(1,Math.abs(nz(u*5+20,v*5+3))*4),3);const veio2=Math.pow(1-Math.min(1,Math.abs(nz(u*9+50,v*9+9))*6),3)*.6;const g=nz(u*40,v*40)*.5+.5;const k=.9+.1*g;const cinza=Math.max(veio,veio2);return [(240-90*cinza)*k,(236-90*cinza)*k,(232-80*cinza)*k];},
  ardosia:(u,v,nz)=>{const linha=.5+.5*Math.sin(v*140+nz(u*6,v*6)*1.5);const g=nz(u*60,v*60)*.5+.5;const k=58+18*linha+14*g;return [k,k+4,k+12];},
  quartzo:(u,v,nz)=>{const g=nz(u*8,v*8)*.5+.5;return [232+20*g,240+12*g,250];},
  feldspato:(u,v,nz)=>{const g=nz(u*14,v*14)*.5+.5,h=nz(u*80,v*80)*.5+.5;return [236-20*h,190+20*g,176+12*g];},
  mica:(u,v,nz)=>{const g=nz(u*30,v*5)*.5+.5;return [180+50*g,140+40*g,80+30*g];}
 };return texRuido('roc-'+key,W,F[key]||F.basalto);}
/* pedra irregular: icosaedro deslocado por ruído determinístico */
function pedra(r,seed,det=2,amp=.16,esc=[1,.8,.95],nCortes,fundo=.66){/* cubo esferificado (sem polos esticados) deformado por ruído em 3 oitavas + faces lascadas (planos de fratura), normais suaves */
 const seg=[8,14,20,28][Math.min(3,det)];const geo=new T.BoxGeometry(1,1,1,seg,seg,seg);const pos=geo.attributes.position;const v=new T.Vector3();for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).normalize().multiplyScalar(r);pos.setXYZ(i,v.x,v.y,v.z);}
 let st=seed*9301+49297;const rnd=()=>{st=(st*9301+49297)%233280;return st/233280;};
 const f=(x,y,z,s)=>Math.sin(x*5.1+s)*Math.cos(y*4.3-s*.7)*Math.sin(z*6.2+s*1.3);
 const cortes=[];const nc=nCortes!==undefined?nCortes:(det>=2?4+Math.floor(rnd()*3):2);for(let k=0;k<nc;k++){const n=new T.Vector3(rnd()*2-1,rnd()*1.6-.8,rnd()*2-1).normalize();cortes.push([n,r*(fundo+.18*rnd())]);}
 for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);const x=v.x/r,y=v.y/r,z=v.z/r;const n=f(x,y,z,seed)+.5*f(x*2.1,y*2.3,z*1.9,seed*1.7)+.22*f(x*4.7,y*4.1,z*5.3,seed*2.9);v.multiplyScalar(1+amp*n);
  for(const [cn,d] of cortes){const dd=v.dot(cn);if(dd>d)v.addScaledVector(cn,-(dd-d)*.93);}
  pos.setXYZ(i,v.x*esc[0],v.y*esc[1],v.z*esc[2]);}
 geo.computeVertexNormals();
 /* costura e polos da esfera: média das normais de vértices na mesma posição */
 const nor=geo.attributes.normal;const mapa={};for(let i=0;i<pos.count;i++){const k=pos.getX(i).toFixed(4)+','+pos.getY(i).toFixed(4)+','+pos.getZ(i).toFixed(4);(mapa[k]=mapa[k]||[]).push(i);}
 for(const k in mapa){const l=mapa[k];if(l.length<2)continue;v.set(0,0,0);l.forEach(i=>{v.x+=nor.getX(i);v.y+=nor.getY(i);v.z+=nor.getZ(i);});v.normalize();l.forEach(i=>nor.setXYZ(i,v.x,v.y,v.z));}
 return geo;}
/* reflexo de estúdio para as amostras (cubemap pintado em canvas, sem arquivo extra) */
let ENV_ROC=null;function envRochas(){if(ENV_ROC)return ENV_ROC;const W=128;const face=(topo,baixo,caixa)=>{const c=document.createElement('canvas');c.width=c.height=W;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,W);g.addColorStop(0,topo);g.addColorStop(.55,'#4a5260');g.addColorStop(1,baixo);x.fillStyle=g;x.fillRect(0,0,W,W);if(caixa){x.filter='blur(6px)';x.fillStyle=caixa;x.fillRect(W*.22,W*.12,W*.56,W*.4);x.filter='none';}return c;};
 const lado=face('#c9d4e2','#2a2420'),luz=face('#e8eef6','#2a2420','#ffffff');const cima=document.createElement('canvas');cima.width=cima.height=W;const cx=cima.getContext('2d');const rg=cx.createRadialGradient(W/2,W/2,4,W/2,W/2,W*.7);rg.addColorStop(0,'#ffffff');rg.addColorStop(1,'#a8b6c8');cx.fillStyle=rg;cx.fillRect(0,0,W,W);const baixo=document.createElement('canvas');baixo.width=baixo.height=W;const bx=baixo.getContext('2d');bx.fillStyle='#231d1a';bx.fillRect(0,0,W,W);
 ENV_ROC=new T.CubeTexture([luz,lado,cima,baixo,lado,luz]);ENV_ROC.encoding=T.sRGBEncoding;ENV_ROC.needsUpdate=true;return ENV_ROC;}
/* amostra de rocha ou mineral; r = tamanho base */
function matRocha(key,extra={}){const foto=(D.ROCHAS_FOTO||{})[key];if(foto){const rx=foto.rx||1,ry=foto.ry||1;const o=Object.assign({color:0xffffff,roughness:foto.roughness!==undefined?foto.roughness:.85,metalness:foto.metalness||0,map:texRep('rocha-'+key+'.webp',rx,ry),envMap:envRochas(),envMapIntensity:foto.reflexo!==undefined?foto.reflexo:.6},extra);if(foto.roughness!==undefined)o.roughness=foto.roughness;if(foto.normal!==false){o.normalMap=texRep('rocha-'+key+'-normal.webp',rx,ry,{srgb:false});o.normalScale=new T.Vector2(foto.relevo||.8,foto.relevo||.8);}return new T.MeshStandardMaterial(o);}return mat(0xffffff,Object.assign({map:texRocha2(key)},extra));}
function amostra(key,opt={}){const g=new T.Group();const r=opt.r||.5;const seed=ROCHAS_KEYS.indexOf(key)+1;const tx=texRocha2(key);
  if(key==='quartzo'){const mQ=matRocha('quartzo',{transparent:true,opacity:.72,metalness:.05});[[0,0,0,0,1],[.22,.05,.1,.5,.7],[-.2,.02,.12,-.6,.6]].forEach(([x,z,tz,rz,sc])=>{const p=new T.Group();const prisma=new T.Mesh(new T.CylinderGeometry(r*.3,r*.34,r*1.4,6),mQ);prisma.position.y=r*.7;p.add(prisma);const ponta=new T.Mesh(new T.ConeGeometry(r*.3,r*.45,6),mQ);ponta.position.y=r*1.62;p.add(ponta);p.scale.setScalar(sc);p.position.set(x*r*2,0,z*r*2);p.rotation.z=rz*.5;p.rotation.y=tz;g.add(p);});const base=new T.Mesh(pedra(r*.55,3,1,.2,[1.6,.5,1.3]),matRocha('basalto'));g.add(base);}
  else if(key==='feldspato'){const mF=matRocha('feldspato');const b=new T.Mesh(pedra(r*.78,seed,2,.03,[1.35,.95,.95],12,.42),mF);b.rotation.set(.1,.4,-.05);b.position.y=r*.62;g.add(b);const b2=new T.Mesh(pedra(r*.42,seed+5,1,.03,[1.2,1,.9],10,.44),mF);b2.position.set(r*.75,r*.4,r*.3);b2.rotation.set(.3,-.5,.2);g.add(b2);}
  else if(key==='mica'){const mM=matRocha('mica',{roughness:.25,metalness:.55});for(let i=0;i<8;i++){const pl=new T.Mesh(new T.CylinderGeometry(r*.9,r*.9,r*.035,6),mM);pl.position.set(Math.sin(i*1.7)*r*.06,r*.04+i*r*.05,Math.cos(i*2.1)*r*.06);pl.rotation.y=i*.12;pl.rotation.x=(i%2?1:-1)*.03;g.add(pl);}}
  else if(key==='ardosia'){const mA=matRocha('ardosia',{roughness:.7});for(let i=0;i<3;i++){const geo=new T.BoxGeometry(r*2.1-i*r*.25,r*.11,r*1.5-i*r*.2);const pl=new T.Mesh(geo,mA);pl.position.set(i*r*.08,r*.06+i*r*.12,-i*r*.05);pl.rotation.y=i*.06;g.add(pl);}}
  else if(key==='arenito'||key==='carvao'){const mL=matRocha(key,{roughness:.95});const geo=pedra(r*.95,seed,2,.07,[1.35,.65,1.0]);const m=new T.Mesh(geo,mL);m.position.y=r*.6;g.add(m);}
  else if(key==='obsidiana'){const m=new T.Mesh(pedra(r*.9,seed,1,.22,[1.1,.85,1]),matRocha('obsidiana'));m.position.y=r*.75;g.add(m);}
  else{const ext={granito:{roughness:.85},basalto:{roughness:.9},pomes:{roughness:1},calcario:{roughness:.85},marmore:{roughness:.35,metalness:.05}}[key]||{roughness:.85};const m=new T.Mesh(pedra(r*.9,seed,2,key==='pomes'?.22:.16),matRocha(key,ext));m.position.y=r*.75;g.add(m);}
  g.traverse(o=>{if(o.isMesh)o.userData.hit=opt.hit||{type:'inspect',key};});g.userData.tick=t=>{if(opt.girar)g.rotation.y=t*.35;};return g;}
/* magma e sedimento (estados do ciclo que não são rochas) */
function amostraEstado(estado,r=.5,hit){if(ROC_ESTADO_AMOSTRA[estado])return amostra(ROC_ESTADO_AMOSTRA[estado],{r,hit});const g=new T.Group();
  if(estado==='magma'){const m=new T.Mesh(pedra(r*.9,7,2,.1),mat(0xffffff,LAVA('roc',1.5,1.5)));m.position.y=r*.75;g.add(m);const brilho=new T.Sprite(new T.SpriteMaterial({alphaMap:fumaca(),color:0xff7a2a,transparent:true,opacity:.5,depthWrite:false,blending:T.AdditiveBlending}));brilho.scale.setScalar(r*3.2);brilho.position.y=r*.75;g.add(brilho);g.userData.tick=t=>{m.material.emissiveIntensity=.8+.3*Math.sin(t*2.5);brilho.material.opacity=.4+.15*Math.sin(t*3);};}
  else{/* sedimento: monte de grãos */const mG=matRocha('arenito');for(let i=0;i<40;i++){const a=i*2.39,d=r*.9*Math.sqrt(i/40);const s=new T.Mesh(new T.SphereGeometry(r*(.08+.07*((i*7)%3)/2),8,6),mG);s.position.set(Math.cos(a)*d,r*.08+(1-i/40)*r*.45*Math.random(),Math.sin(a)*d*.8);s.scale.y=.7;g.add(s);}const monte=new T.Mesh(new T.ConeGeometry(r*1.0,r*.5,24),mG);monte.position.y=r*.25;g.add(monte);}
  g.traverse(o=>{if(o.isMesh&&hit)o.userData.hit=hit;});return g;}
/* bancada: 12 amostras em 4 x 3 */
function bancada(opt={}){const g=new T.Group();const W=7.0,P=3.4;const mesa=new T.Mesh(new T.BoxGeometry(W,.22,P),mat(0x3a2e26,{roughness:.9,map:texRep('vulcao-rocha.webp',4,2)}));mesa.position.y=-.11;g.add(mesa);const borda=new T.Mesh(new T.BoxGeometry(W+.1,.05,P+.1),mat(0x7a6a5c,{roughness:.8}));borda.position.y=.0;g.add(borda);
  const vistos=opt.vistos||[];const rot=opt.rotulos;const ticks=[];
  ROCHAS_KEYS.forEach((k,i)=>{const col=i%4,lin=Math.floor(i/4);const x=(col-1.5)*1.7,z=(lin-1)*1.05;const ped=new T.Mesh(new T.CylinderGeometry(.5,.55,.08,24),mat(0x2a2220,{roughness:.9}));ped.position.set(x,.06,z);g.add(ped);const a=amostra(k,{r:.36,hit:opt.hitFn?opt.hitFn(k):{type:'inspect',key:k}});a.position.set(x,.1,z);a.rotation.y=i*.7;g.add(a);if(a.userData.tick)ticks.push(a.userData.tick);
    const nome=(rot||vistos.includes(k))?D.info[k].name:'?';const r=rotuloFixo(nome,(rot||vistos.includes(k))?'#ffe08a':'#9cbed0',1.3,(rot||vistos.includes(k))?60:96);r.position.set(x,.03,z+.5);r.rotation.x=-Math.PI/2.6;g.add(r);});
  if(opt.grupos){[['ÍGNEAS','#b09080',-2.55],['SEDIMENTARES','#e0c08a',-.85],['METAMÓRFICAS','#c8c0d8',.85],['MINERAIS','#e8f0f8',2.55]].forEach(([t,c,x])=>{});}
  g.userData.mesa=true;g.userData.tick=t=>ticks.forEach(f=>f(t));return g;}
function rocContexto(level){const g=new T.Group();
  if(level===0){/* três famílias: amostras agrupadas por família, com rótulo */const fam=[['ÍGNEAS',['granito','basalto','obsidiana','pomes'],-2.6,'#d8c0b0'],['SEDIMENTARES',['arenito','calcario','carvao'],0,'#e0c08a'],['METAMÓRFICAS',['marmore','ardosia'],2.6,'#d0c8e0']];const mesa=new T.Mesh(new T.BoxGeometry(8.2,.22,2.6),mat(0x3a2e26,{roughness:.9,map:texRep('vulcao-rocha.webp',4,2)}));mesa.position.y=-.11;g.add(mesa);const ticks=[];
    fam.forEach(([nome,keys,x0,cor])=>{keys.forEach((k,i)=>{const n=keys.length;const x=x0+(i-(n-1)/2)*.75;const z=(i%2?.35:-.35);const a=amostra(k,{r:.3,hit:{type:'context'}});a.position.set(x,.0,z);a.rotation.y=i*1.1;g.add(a);if(a.userData.tick)ticks.push(a.userData.tick);});textFixo(g,nome,x0,-.05,1.55,2.4,cor).rotation.x=-Math.PI/2.4;});
    textFixo(g,'TRÊS FAMÍLIAS DE ROCHAS',0,1.5,0,3.6,'#ffe08a');g.traverse(o=>{if(o.isMesh&&!o.userData.hit)o.userData.hit={type:'context'};});g.userData.mesa=true;g.userData.tick=t=>ticks.forEach(f=>f(t));}
  else if(level===1){/* granito gigante com os três minerais */const gr=new T.Mesh(pedra(1.5,1,3,.12),matRocha('granito',{}));gr.position.y=1.2;gr.userData.hit={type:'context'};g.add(gr);const base=new T.Mesh(new T.CylinderGeometry(1.9,2.1,.2,32),mat(0x2a2220,{roughness:.9}));base.position.y=-.1;g.add(base);
    [['quartzo',-2.9,'Quartzo: branco, duro'],['feldspato',0,'Feldspato: rosado, faces retas'],['mica',2.9,'Mica: lâminas brilhantes']].forEach(([k,x,t],i)=>{const a=amostra(k,{r:.55,hit:{type:'context'},girar:true});a.position.set(x,i===1?2.9:.2,i===1?-.3:.9);g.add(a);textFixo(g,t,x,i===1?2.7:-.05,i===1?-.3:1.9,2.3,'#ffe08a');});
    textFixo(g,'ROCHA É FEITA DE MINERAIS',0,3.9,0,3.8,'#ffe08a');const ticks=[];g.traverse(o=>{if(o.userData.tick&&o!==g)ticks.push(o.userData.tick);});g.userData.tick=t=>{ticks.forEach(f=>f(t));gr.rotation.y=t*.12;};}
  else{const c=cicloCena({estado:null,contexto:true});g.add(c);g.userData.mesa=true;g.userData.tick=c.userData.tick;}
  return g;}
function rochasExp(state){const g=new T.Group();const b=bancada({vistos:state&&state.visited||[]});g.add(b);g.userData.mesa=true;g.userData.tick=b.userData.tick;return g;}
/* ciclo das rochas: anel com cinco estados, setas e a rocha atual no centro */
function cicloCena(state){const g=new T.Group();const R0=2.9;const ordem=D.CICLO.ordem;const atual=state.estado;const ticks=[];const nos={};
  const posDe=i=>{const a=Math.PI/2-i*Math.PI*2/ordem.length;return V(Math.cos(a)*R0,0,-Math.sin(a)*R0);};
  ordem.forEach((e,i)=>{const p=posDe(i);const est=D.CICLO.estados[e];const on=atual===e;const disco=new T.Mesh(new T.CylinderGeometry(.62,.68,.1,32),mat(on?0x5a4a2a:0x2a2220,{roughness:.9,emissive:on?0xffa040:0x000000,emissiveIntensity:on?.6:0}));disco.position.copy(p);disco.position.y=-.05;disco.userData.hit={type:state.contexto?'context':'cicloNo',estado:e};g.add(disco);nos[e]=disco;
    const a=amostraEstado(e,.42,{type:state.contexto?'context':'cicloNo',estado:e});a.position.copy(p);g.add(a);if(a.userData.tick)ticks.push(a.userData.tick);
    const r=rotuloFixo(est.nome,on?'#ffe08a':'#e7f6ff',1.8,58);r.position.copy(p);r.position.y=-.02;r.position.z+=.95;r.rotation.x=-Math.PI/2.4;g.add(r);});
  /* setas do anel (estado i -> i+1) e atalhos internos */
  const seta=(i,j,cor,interno)=>{const a=posDe(i),b=posDe(j);const pts=[];const n=14;for(let k=0;k<=n;k++){const t=k/n;let p;if(interno){p=a.clone().lerp(b,t);p.multiplyScalar(1-.18*Math.sin(t*Math.PI));}else{const ang0=Math.atan2(-a.z,a.x),ang1=Math.atan2(-b.z,b.x);let d=ang1-ang0;while(d>0)d-=Math.PI*2;const ang=ang0+d*t;p=V(Math.cos(ang)*R0,0,-Math.sin(ang)*R0);}p.y=.06;pts.push(p);}
    const cut=pts.slice(2,n-1);const tubo=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cut),24,interno?.025:.04,8,false),mat(cor,{emissive:cor,emissiveIntensity:.5}));g.add(tubo);const fim=cut[cut.length-1],ant=cut[cut.length-2];const cone=new T.Mesh(new T.ConeGeometry(interno?.09:.13,.3,12),mat(cor,{emissive:cor,emissiveIntensity:.6}));cone.position.copy(fim);cone.lookAt(fim.clone().add(fim.clone().sub(ant)));cone.rotateX(Math.PI/2);g.add(cone);};
  for(let i=0;i<ordem.length;i++)seta(i,(i+1)%ordem.length,0xffd27a,false);
  seta(1,4,0xc8a0ff,true);seta(4,2,0xa0d8ff,true);seta(3,0,0xff9a6a,true);
  /* centro: a rocha atual, grande */if(atual){const c=amostraEstado(atual,.95,{type:'cicloNo',estado:atual});c.position.y=.1;g.add(c);if(c.userData.tick)ticks.push(c.userData.tick);const r=rotuloFixo(D.CICLO.estados[atual].nome.toUpperCase(),'#ffe08a',2.6,62);r.position.set(0,-.05,1.5);r.rotation.x=-Math.PI/2.4;g.add(r);g.userData.centro=c;}
  else{textFixo(g,'O CICLO DAS ROCHAS',0,.9,0,3.4,'#ffe08a');}
  const chao=new T.Mesh(new T.RingGeometry(R0-.9,R0+.9,64),new T.MeshBasicMaterial({color:0x1a1410,transparent:true,opacity:.5,side:T.DoubleSide}));chao.rotation.x=-Math.PI/2;chao.position.y=-.11;g.add(chao);
  g.userData.mesa=true;g.userData.tick=t=>{ticks.forEach(f=>f(t));if(atual&&nos[atual]){nos[atual].material.emissiveIntensity=.45+.3*Math.sin(t*3);}if(g.userData.centro)g.userData.centro.rotation.y=t*.3;};return g;}
/* que rocha é essa? pedestal com a amostra misteriosa */
function identificarCena(state){const g=new T.Group();const rod=D.IDENTIFICAR[state.rodada]||D.IDENTIFICAR[0];const resolvido=state.resposta!==null&&state.resposta!==undefined;
  const ped=new T.Mesh(new T.CylinderGeometry(1.1,1.3,.35,32),mat(0x2a2220,{roughness:.9}));ped.position.y=-.18;g.add(ped);
  const a=amostra(rod.amostra,{r:1.0,hit:resolvido?{type:'inspect',key:rod.amostra}:{type:'ident'},girar:true});g.add(a);
  const r=rotuloFixo(resolvido?D.info[rod.amostra].name.toUpperCase():'?',resolvido?'#ffe08a':'#9cbed0',2.6,resolvido?62:120);r.position.set(0,2.4,0);g.add(r);
  textFixo(g,'AMOSTRA '+(state.rodada+1)+' DE '+D.IDENTIFICAR.length,0,-.55,1.3,2.2,'#9cbed0').rotation.x=-Math.PI/2.4;
  g.userData.tick=t=>{a.rotation.y=t*.4;r.position.y=2.4+.05*Math.sin(t*2);};return g;}
/* ===== terreno real (Copernicus DEM 30 m): PNG de alturas (R alto, G baixo) + textura de cor gerada do próprio relevo ===== */
function terrenoReal(key,opt={}){const g=new T.Group();const meta=D.TERRENOS[key];const L=opt.largura||5.6,seg=255,exag=opt.exagero||meta.exag||1.35;
  const geo=new T.PlaneGeometry(L,L,seg,seg);geo.rotateX(-Math.PI/2);
  const m=new T.Mesh(geo,mat(0xffffff,{roughness:.95,map:textura('terreno-'+key+'.webp')}));m.userData.hit=opt.hit||{type:'inspect',key:'estratovulcao'};g.add(m);
  const escala=L/(meta.km*1000)*exag;
  const img=new Image();img.onload=()=>{let o=g,morto=!g.parent;while(o){if(o.userData.disposed)morto=true;o=o.parent;}if(morto)return;const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.drawImage(img,0,0,256,256);const d=x.getImageData(0,0,256,256).data;const pos=geo.attributes.position;for(let j=0;j<=seg;j++)for(let i=0;i<=seg;i++){const k=(j*256+i)*4;const h=meta.min+((d[k]<<8)|d[k+1])/65535*(meta.max-meta.min);pos.setY(j*(seg+1)+i,(h-meta.min)*escala);}pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();g.userData.pronto=true;if(opt.aoCarregar)opt.aoCarregar(g);};img.src='assets/dem-'+key+'.png';
  /* base da maquete + rótulo */const base=new T.Mesh(new T.BoxGeometry(L,.3,L),mat(0x2e2724,{roughness:1}));base.position.y=-.151;base.userData.semEnquadre=true;g.add(base);
  const borda=new T.Mesh(new T.BoxGeometry(L+.06,.04,L+.06),mat(0x6a5e54,{roughness:.9}));borda.position.y=-.02;g.add(borda);
  g.rotation.y=opt.giro!==undefined?opt.giro:(meta.giro||0);
  const rot=rotuloFixo(meta.nome+' · '+meta.alt+' · relevo real, '+meta.km+' km de lado',"#ffe08a",4.6,54);rot.userData.semEnquadre=true;const wrap=new T.Group();wrap.add(g);
  /* o rótulo fica fixo de frente, fora do giro do terreno */rot.position.set(0,-.34,L/2+.08);wrap.add(rot);wrap.userData.tick=t=>{};wrap.userData.terreno=g;return wrap;}
function desafio(modulo){const g=new T.Group();const te=modulo==='roc'?bancada({rotulos:true}):modulo==='vul'?vulcao({}):modulo==='pla'?globoPlacas({hit:{type:'inspect',key:'pacifica'}}):terra({corte:true,hitFn:k=>({type:'inspect',key:k})});g.add(te);g.userData.tick=te.userData.tick;return g;}
function dispose(g){if(!g)return;const geos=new Set(),mats=new Set(),tex=new Set();g.traverse(o=>{if(o.geometry&&!o.isSprite&&o.geometry!==(tuboCache&&tuboCache.geo))geos.add(o.geometry);for(const m of [].concat(o.material||[])){if(!m)continue;mats.add(m);const comp=new Set([...Object.values(TEX),...Object.values(TEXP),...Object.values(OVER)]);for(const t of [m.map,m.emissiveMap,m.normalMap,m.specularMap]){if(t&&!comp.has(t))tex.add(t);}}});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());tex.forEach(x=>x.dispose());if(g.parent)g.parent.remove(g);}
window.TERRA_MODELS={V,R,CAMADAS,mat,ball,label,rotuloFixo,textFixo,textAt,tag,terra,contexto,explorar,inspection,sequencia,viagemCena,desafio,tipoCrosta,dispose,ESCALA_VR,placContexto,placasExp,limitesCena,voltaCena,placaEm,globoPlacas,overlayPlacas,vulcao,vulContexto,vulcaoExp,erupcaoCena,origemMagma,tipoVulcao,painelOrigem,terrenoReal,amostra,bancada,rocContexto,rochasExp,cicloCena,identificarCena,ROCHAS_KEYS};
})();
