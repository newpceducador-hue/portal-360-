/* Célula 3D VR · modelos (v1.1)
   Tudo gerado no navegador, sem arquivos externos. A célula é mostrada aberta ao meio: a metade de trás da membrana,
   a face do corte (citoplasma) e as organelas brotando do corte, como nos modelos de laboratório. Cada organela é uma
   peça clicável (userData.hit = {type:'inspect', key}). v1.1: membrana, citoplasma, núcleo, mitocôndria (e cristas),
   Golgi e cloroplasto usam texturas ilustradas (assets/tex-*.webp + normal map); enquanto carregam, e se faltarem,
   vale a textura de ruído em canvas. Brilho úmido por um cubemap de estúdio pintado em canvas. */
(function(){'use strict';
const T=THREE,D=window.CELULA_DATA,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const R=2.2; /* raio da célula animal na cena */
let ENV=null;
function env(){if(ENV)return ENV;const W=128;const face=(topo,baixo,caixa)=>{const c=document.createElement('canvas');c.width=c.height=W;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,W);g.addColorStop(0,topo);g.addColorStop(.55,'#4c5866');g.addColorStop(1,baixo);x.fillStyle=g;x.fillRect(0,0,W,W);if(caixa){x.filter='blur(6px)';x.fillStyle=caixa;x.fillRect(W*.22,W*.12,W*.56,W*.4);x.filter='none';}return c;};
 const lado=face('#cfd8e6','#1e2430'),luz=face('#eef3fa','#1e2430','#ffffff');const cima=document.createElement('canvas');cima.width=cima.height=W;const cx=cima.getContext('2d');const rg=cx.createRadialGradient(W/2,W/2,4,W/2,W/2,W*.7);rg.addColorStop(0,'#ffffff');rg.addColorStop(1,'#a8b6c8');cx.fillStyle=rg;cx.fillRect(0,0,W,W);const baixo=document.createElement('canvas');baixo.width=baixo.height=W;const bx=baixo.getContext('2d');bx.fillStyle='#1a1e26';bx.fillRect(0,0,W,W);
 ENV=new T.CubeTexture([luz,lado,cima,baixo,lado,luz]);ENV.encoding=T.sRGBEncoding;ENV.needsUpdate=true;return ENV;}
const mat=(color,extra={})=>new T.MeshStandardMaterial(Object.assign({color,roughness:.55,metalness:0,envMap:env(),envMapIntensity:.45},extra));
function tag(o,data){o.traverse(x=>{if(x.isMesh)x.userData.hit=data;});o.userData.hit=data;return o;}
const ins=k=>({type:'inspect',key:k});
function ball(r,color,pos,extra,seg=24){const m=new T.Mesh(new T.SphereGeometry(r,seg,Math.max(10,seg*.7|0)),mat(color,extra));if(pos)m.position.copy(pos);return m;}
function label(text,color='#e7f6ff',width=1.5,size=56){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='600 '+size+'px Segoe UI,Arial';while(ctx.measureText(text).width>490&&size>17){size-=2;ctx.font='600 '+size+'px Segoe UI,Arial';}ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#031220';ctx.shadowBlur=7;ctx.fillStyle=color;ctx.fillText(text,256,64);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.anisotropy=8;const sp=new T.Sprite(new T.SpriteMaterial({toneMapped:false,map:tx,transparent:true,depthWrite:false,depthTest:true}));sp.scale.set(width,width/4,1);return sp;}
function textAt(g,text,x,y,z=0,width=1.5,color){const sp=label(text,color,width);sp.position.set(x,y,z);g.add(sp);return sp;}
function rotuloFixo(text,color='#e7f6ff',width=1.5,size=56){const sp=label(text,color,width,size);const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:sp.material.map,transparent:true,depthWrite:false,side:T.DoubleSide}));sp.material.dispose();return m;}
function textFixo(g,text,x,y,z=0,width=1.5,color){const m=rotuloFixo(text,color,width);m.position.set(x,y,z);g.add(m);return m;}
/* ruído de valor com 5 oitavas (determinístico) */
function ruido2(seed=1337){const P=new Uint8Array(512);let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};const p=[];for(let i=0;i<256;i++)p.push(i);for(let i=255;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<512;i++)P[i]=p[i&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+t*(b-a),grad=(h,x,y)=>{const u=(h&1)?-x:x,v=(h&2)?-y:y;return u+v;};
  const n=(x,y)=>{const X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);const u=fade(x),v=fade(y);const A=P[X]+Y,B=P[X+1]+Y;return lerp(lerp(grad(P[A],x,y),grad(P[B],x-1,y),u),lerp(grad(P[A+1],x,y-1),grad(P[B+1],x-1,y-1),u),v);};
  return(x,y)=>{let a=0,f=1,amp=1,tot=0;for(let o=0;o<5;o++){a+=n(x*f,y*f)*amp;tot+=amp;amp*=.5;f*=2.1;}return a/tot;};}
const TEXP={};
function texRuido(nome,W,fn,seed){if(TEXP[nome])return TEXP[nome];const c=document.createElement('canvas');c.width=c.height=W;const x=c.getContext('2d');const img=x.createImageData(W,W),d=img.data;const nz=ruido2(seed||1337);for(let j=0;j<W;j++)for(let i=0;i<W;i++){const k=(j*W+i)*4;const [r,g,b,a]=fn(i/W,j/W,nz);d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=a===undefined?255:a;}x.putImageData(img,0,0);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.wrapS=tx.wrapT=T.MirroredRepeatWrapping;tx.anisotropy=8;TEXP[nome]=tx;return tx;}
const cl=v=>Math.max(0,Math.min(255,v));
/* texturas por estrutura: cor + relevo (o mesmo mapa serve de bumpMap) */
const TX={
 membrana:()=>texRuido('membrana',256,(u,v,n)=>{const a=n(u*26,v*26)*.5+.5,b=n(u*90+3,v*90+5)*.5+.5;const k=.78+.22*a;return [cl(232*k+20*b),cl(176*k+10*b),cl(160*k)];}),
 citoplasma:()=>texRuido('citoplasma',256,(u,v,n)=>{const a=n(u*14,v*14)*.5+.5,b=n(u*120,v*120)*.5+.5;const g=b>.78?.82:1;const k=(.86+.14*a)*g;return [cl(244*k),cl(222*k),cl(208*k)];}),
 nucleo:()=>texRuido('nucleo',256,(u,v,n)=>{const a=Math.abs(n(u*18,v*18)),b=n(u*70+9,v*70+2)*.5+.5;const cromatina=a<.06?.55:1;const k=(.8+.2*b)*cromatina;return [cl(150*k),cl(118*k),cl(196*k)];}),
 mitocondria:()=>texRuido('mitocondria',256,(u,v,n)=>{const crista=.5+.5*Math.sin(u*48+n(u*6,v*6)*3);const b=n(u*60,v*60)*.5+.5;const k=.72+.18*crista+.1*b;return [cl(236*k),cl(124*k),cl(84*k)];}),
 golgi:()=>texRuido('golgi',256,(u,v,n)=>{const a=n(u*20,v*40)*.5+.5;const k=.8+.2*a;return [cl(240*k),cl(196*k),cl(80*k)];}),
 reticulo:()=>texRuido('reticulo',256,(u,v,n)=>{const a=n(u*24,v*24)*.5+.5;const k=.8+.2*a;return [cl(110*k),cl(160*k),cl(220*k)];}),
 lisossomo:()=>texRuido('lisossomo',256,(u,v,n)=>{const a=n(u*20,v*20)*.5+.5,b=n(u*80,v*80);const ponto=b>.35?.7:1;const k=(.8+.2*a)*ponto;return [cl(214*k),cl(96*k),cl(128*k)];}),
 cloroplasto:()=>texRuido('cloroplasto',256,(u,v,n)=>{const grana=.5+.5*Math.sin(v*70+n(u*4,v*4)*2);const b=n(u*50,v*50)*.5+.5;const k=.62+.28*grana+.1*b;return [cl(60*k),cl(170*k),cl(70*k)];}),
 parede:()=>texRuido('parede',256,(u,v,n)=>{const f1=.5+.5*Math.sin((u+v)*120+n(u*8,v*8)*4),f2=.5+.5*Math.sin((u-v)*110+n(u*9+3,v*9)*4);const k=.7+.15*f1+.15*f2;return [cl(130*k),cl(168*k),cl(80*k)];}),
 vacuolo:()=>texRuido('vacuolo',128,(u,v,n)=>{const a=n(u*8,v*8)*.5+.5;return [cl(160+40*a),cl(214+30*a),cl(240+15*a),150];})
};
/* texturas ilustradas: o objeto Texture nasce com a de ruído e troca de imagem quando o arquivo chega (sem refazer materiais) */
const FOTO={membrana:1,citoplasma:1,nucleo:1,mitocondria:1,cristas:1,golgi:1,cloroplasto:1};
const LOADER=new T.ImageLoader();
function texFoto(nome){const k='foto-'+nome;if(TEXP[k])return TEXP[k];const base=TX[nome]?TX[nome]():TX.mitocondria();const t=new T.Texture(base.image);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;t.needsUpdate=true;TEXP[k]=t;
 LOADER.load('assets/tex-'+nome+'.webp',img=>{t.image=img;t.needsUpdate=true;},undefined,()=>{});return t;}
function normalFoto(nome){const k='nrm-'+nome;if(TEXP[k])return TEXP[k];const c=document.createElement('canvas');c.width=c.height=4;const x=c.getContext('2d');x.fillStyle='rgb(128,128,255)';x.fillRect(0,0,4,4);const t=new T.Texture(c);t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.needsUpdate=true;TEXP[k]=t;
 LOADER.load('assets/tex-'+nome+'-normal.webp',img=>{t.image=img;t.needsUpdate=true;},undefined,()=>{});return t;}
/* acabamento úmido: superfícies biológicas são molhadas, então rugosidade menor e mais reflexo do ambiente */
function matTex(nome,color,extra={}){if(FOTO[nome])return mat(color,Object.assign({map:texFoto(nome),normalMap:normalFoto(nome),normalScale:new T.Vector2(.7,.7),roughness:.36,envMapIntensity:.6},extra));const t=TX[nome]();return mat(color,Object.assign({map:t,bumpMap:t,bumpScale:.025,roughness:.4,envMapIntensity:.55},extra));}
/* ---------- peças ---------- */
function deforma(geo,amp,seed,esc=1){const p=geo.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=Math.sin(v.x*2.1*esc+seed)*Math.cos(v.y*1.7*esc-seed*.6)+.5*Math.sin(v.z*3.3*esc+v.x*1.3+seed*1.9);v.multiplyScalar(1+amp*n);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();return geo;}
/* cápsula (r128 não tem CapsuleGeometry): perfil em Lathe */
function capsula(r,len,seg=20,phiStart=0,phiLength=Math.PI*2){const pts=[];const n=10;for(let i=0;i<=n;i++){const a=-Math.PI/2+i/n*Math.PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r-len/2));}for(let i=0;i<=n;i++){const a=i/n*Math.PI/2;pts.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r+len/2));}return new T.LatheGeometry(pts,seg,phiStart,phiLength);}
function mitocondria(opt={}){const g=new T.Group();const r=opt.r||.16,len=opt.len||.42;
 if(opt.aberta){/* corte longitudinal: casca de trás + cristas por dentro */const casca=new T.Mesh(capsula(r,len,28,Math.PI/2,Math.PI),matTex('mitocondria',0xffffff,{side:T.DoubleSide}));g.add(casca);
  const interna=new T.Mesh(capsula(r*.86,len*.92,24,Math.PI/2,Math.PI),matTex('cristas',0xffffff,{side:T.DoubleSide}));g.add(interna);
  const mc=matTex('cristas',0xf2b090,{side:T.DoubleSide,roughness:.32});for(let i=0;i<7;i++){const y=-len/2-r*.4+i*(len+r*.8)/6;const w=r*(i%2?1.25:1.05);const cg=new T.PlaneGeometry(w,r*.85,12,6);const pp=cg.attributes.position;for(let k=0;k<pp.count;k++){const px=pp.getX(k),py=pp.getY(k);pp.setZ(k,Math.sin(px/w*Math.PI*3+i)*r*.05+Math.sin(py/r*9)*r*.025);}cg.computeVertexNormals();const cr=new T.Mesh(cg,mc);cr.rotation.x=-Math.PI/2;cr.position.set((i%2?1:-1)*r*.18,y,-r*.42);g.add(cr);}
  g.userData.aberta=true;}
 else{const m=new T.Mesh(deforma(capsula(r,len,20),.05,opt.seed||1,4),matTex('mitocondria',0xffffff));g.add(m);}
 return g;}
function cisternas(n,raio,tubo,arco,cor,cfgTex){const g=new T.Group();for(let i=0;i<n;i++){const t=new T.Mesh(new T.TorusGeometry(raio+i*tubo*2.6,tubo,8,48,arco),cfgTex?matTex(cfgTex,cor):mat(cor));t.scale.z=.55;g.add(t);}return g;}
function ribossomos(n,pts,cor=0x34466e,r=.016){const geo=new T.SphereGeometry(r,8,6);const m=new T.InstancedMesh(geo,mat(cor,{roughness:.4}),n);const o=new T.Object3D();for(let i=0;i<n;i++){const p=pts(i);o.position.copy(p);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.instanceMatrix.needsUpdate=true;return m;}
function reRugoso(opt={}){const g=new T.Group();const base=opt.base||.85,arco=opt.arco||Math.PI*1.25;const c=cisternas(opt.n||5,base,.03,arco,0xffffff,'reticulo');c.rotation.z=opt.rot||0;g.add(c);
 let s=11;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};const N=opt.ribos||420;
 const rib=ribossomos(N,i=>{const k=Math.floor(rnd()*(opt.n||5));const rr=base+k*.03*2.6;const a=(opt.rot||0)+rnd()*arco;const off=(rnd()<.5?1:-1)*.034;return V(Math.cos(a)*(rr+off*.6),Math.sin(a)*(rr+off*.6),(rnd()-.5)*.04);});g.add(rib);return g;}
function reLiso(opt={}){const g=new T.Group();let s=opt.seed||23;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};const m=matTex('reticulo',0xb8e0f6);
 for(let k=0;k<(opt.n||5);k++){const pts=[];let p=V((rnd()-.5)*.5,(rnd()-.5)*.5,0);for(let i=0;i<6;i++){pts.push(p.clone());p=p.clone().add(V((rnd()-.5)*.32,(rnd()-.5)*.32,(rnd()-.5)*.06));}const tb=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.026,7,false),m);g.add(tb);}return g;}
function golgi(opt={}){const g=new T.Group();const n=opt.n||5;for(let i=0;i<n;i++){const t=new T.Mesh(new T.TorusGeometry(.42+i*.075,.03,8,40,1.5),matTex('golgi',0xffffff));t.scale.z=.6;t.rotation.z=Math.PI*.15-i*.02;g.add(t);}
 for(let i=0;i<9;i++){const a=Math.PI*.15+(i%3===0?-.12:1.62)+(i*.05);const rr=.45+(i%5)*.08;const v=ball(.035+(i%3)*.008,0xf0d880,V(Math.cos(a)*rr,Math.sin(a)*rr,(i%2-.5)*.04),{},12);g.add(v);}return g;}
function centriolo(){const g=new T.Group();const um=()=>{const c=new T.Group();for(let k=0;k<9;k++){const a=k/9*Math.PI*2;for(let j=0;j<3;j++){const t=new T.Mesh(new T.CylinderGeometry(.009,.009,.2,6),mat(0x7cc07c));t.position.set(Math.cos(a+j*.11)*(.05+j*.008),0,Math.sin(a+j*.11)*(.05+j*.008));c.add(t);}}return c;};const a=um(),b=um();b.rotation.x=Math.PI/2;b.position.set(.14,0,0);g.add(a,b);return g;}
function nucleo(opt={}){const g=new T.Group();const r=opt.r||.72;
 /* metade de trás aberta + carioteca (anel com poros) + nucléolo e cromatina */
 const casca=new T.Mesh(new T.SphereGeometry(r,40,28,Math.PI,Math.PI),matTex('nucleo',0xffffff,{side:T.DoubleSide}));g.add(casca);tag(casca,ins('nucleo'));
 const anel=new T.Mesh(new T.TorusGeometry(r,.035,10,64),mat(0xb8a0e0,{roughness:.35}));tag(anel,ins('carioteca'));g.add(anel);
 const poros=new T.Group();for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const p=new T.Mesh(new T.TorusGeometry(.03,.012,6,12),mat(0x5a4080));p.position.set(Math.cos(a)*r,Math.sin(a)*r,.03);poros.add(p);}tag(poros,ins('carioteca'));g.add(poros);
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,b=(i%3)*.4+.3;const p=new T.Mesh(new T.CircleGeometry(.032,10),mat(0x4a3070));p.position.set(Math.cos(a)*r*Math.sin(b)*.98,Math.sin(a)*r*Math.sin(b)*.98,-Math.cos(b)*r*.98);p.lookAt(0,0,0);p.rotateY(Math.PI);g.add(p);tag(p,ins('carioteca'));}
 const nucl=ball(r*.32,0x5a3a8a,V(r*.18,r*.12,-r*.1),{roughness:.45},28);tag(nucl,ins('nucleolo'));g.add(nucl);
 let s=5;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};const crom=new T.Group();for(let k=0;k<7;k++){const pts=[];let p=V((rnd()-.5)*r,(rnd()-.5)*r,-rnd()*r*.6);for(let i=0;i<5;i++){pts.push(p.clone());p.add(V((rnd()-.5)*.25,(rnd()-.5)*.25,(rnd()-.5)*.1));}const tb=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.014,5,false),mat(0x6a4a9a));crom.add(tb);}tag(crom,ins('nucleo'));g.add(crom);
 return g;}
function cloroplasto(opt={}){const g=new T.Group();const geo=deforma(new T.SphereGeometry(.24,24,16),.04,opt.seed||2,5);const m=new T.Mesh(geo,matTex('cloroplasto',0xffffff,{roughness:.34}));m.scale.set(1.5,.85,.75);g.add(m);
 if(opt.aberto){/* corte: membrana externa e interna (dupla), estroma, tilacoides empilhados em grana ligados por lamelas, amido, DNA e ribossomos */
  m.geometry.dispose();m.geometry=deforma(new T.SphereGeometry(.24,40,24,Math.PI,Math.PI),.03,opt.seed||2,5);m.material.side=T.DoubleSide;
  const int=new T.Mesh(deforma(new T.SphereGeometry(.222,40,24,Math.PI,Math.PI),.03,opt.seed||2,5),mat(0x7cbc58,{side:T.DoubleSide,roughness:.3,envMapIntensity:.6}));int.scale.copy(m.scale);g.add(int);
  const borda=new T.Mesh(new T.RingGeometry(.222,.24,64),mat(0x5aa83c,{side:T.DoubleSide}));borda.scale.set(1.5,.85,1);g.add(borda);
  const est=new T.Mesh(new T.CircleGeometry(.222,48),mat(0x8cc46a,{transparent:true,opacity:.28,side:T.DoubleSide,roughness:.25,depthWrite:false}));est.scale.set(1.5,.85,1);est.position.z=-.002;g.add(est);
  const mt=mat(0x157022,{roughness:.3,envMapIntensity:.6}),mb=mat(0x1f6e28,{roughness:.4});const disco=new T.CylinderGeometry(.042,.042,.009,20),aro=new T.TorusGeometry(.042,.0045,6,20);
  const GR=[[-.25,-.03,6],[-.15,.05,8],[-.04,-.05,9],[.07,.04,8],[.18,-.04,7],[.27,.03,5],[-.1,-.12,5],[.12,.12,4]];
  GR.forEach(([x,y,n],i)=>{const gr=new T.Group();for(let j=0;j<n;j++){const d=new T.Mesh(disco,mt);d.position.y=j*.0135;gr.add(d);const a=new T.Mesh(aro,mb);a.rotation.x=Math.PI/2;a.position.y=j*.0135;gr.add(a);}gr.position.set(x,y-n*.0135/2,-.06-(i%3)*.02);g.add(gr);});
  for(let i=0;i<GR.length-1;i++){const [x0,y0]=GR[i],[x1,y1]=GR[i+1];if(i===5)continue;const c=new T.CatmullRomCurve3([V(x0,y0,-.06),V((x0+x1)/2,(y0+y1)/2+.02,-.07),V(x1,y1,-.06)]);g.add(new T.Mesh(new T.TubeGeometry(c,12,.0045,5,false),mt));}
  [[-.2,.11,.035],[.24,-.12,.03],[.02,.13,.025]].forEach(([x,y,r])=>{const a=ball(r,0xf4f0e0,V(x,y,-.05),{roughness:.5},14);a.scale.set(1.4,1,.8);g.add(a);});
  const dna=new T.Mesh(new T.TorusGeometry(.025,.0025,5,24),mat(0xe8c050));dna.position.set(.3,.1,-.04);dna.rotation.x=.4;g.add(dna);
  let s2=13;const rnd=()=>{s2=(s2*9301+49297)%233280;return s2/233280;};g.add(ribossomos(70,()=>{let x,y;do{x=(rnd()*2-1)*.32;y=(rnd()*2-1)*.18;}while(x*x/.1+y*y/.032>1);return V(x,y,-.03-rnd()*.08);},0x3a5a2a,.006));
  g.userData.partes=true;}
 return g;}
/* membrana em meia esfera deformada (a metade da frente foi "cortada") + anel do corte mostrando a espessura */
function meiaCasca(r,esc,seed,nome,cor){const geo=deforma(new T.SphereGeometry(r,64,40,Math.PI,Math.PI),.035,seed,1.2);const m=new T.Mesh(geo,matTex(nome,cor,{side:T.DoubleSide}));m.scale.copy(esc);return m;}
/* ---------- a célula ---------- */
const POS_ANI={nucleo:V(-.45,.15,0),mitos:[[.95,.85,.05,.6],[1.3,-.3,.08,-.4],[.2,-1.2,.06,1.1],[-1.35,-.75,.05,.3],[1.55,.35,.02,1.4],[-.3,1.25,.07,-1.2]],golgi:V(.85,-.65,.05),lisos:[[1.5,-.95,.1],[-.95,-1.3,.1],[.45,1.35,.1],[1.75,.95,.08],[-1.7,.6,.08]],vesic:[[1.35,-.05,.1],[1.6,-.5,.1],[1.1,-1.05,.1],[1.85,-.2,.1],[1.25,-1.35,.1],[.55,-1.45,.1],[1.9,.4,.1]],centriolos:V(.35,.62,.12),reLiso:V(-1.25,-.2,.03)};
function celulaAnimal(opt={}){const g=new T.Group();const esc=V(1,.9,1);
 const memb=meiaCasca(R,esc,3,'membrana',0xffffff);tag(memb,ins('membrana'));g.add(memb);
 const inner=meiaCasca(R*.965,esc,3,'citoplasma',0xf4dccc);inner.material.side=T.BackSide;tag(inner,ins('citoplasma'));g.add(inner);
 const borda=new T.Mesh(new T.RingGeometry(R*.965,R*1.035,96,1),mat(0xe8a890,{side:T.DoubleSide}));borda.scale.copy(esc);borda.position.z=.004;tag(borda,ins('membrana'));g.add(borda);
 /* face do corte (citoplasma), com furo onde fica o núcleo */
 const sh=new T.Shape();sh.absarc(0,0,R*.965,0,Math.PI*2,false);const furo=new T.Path();furo.absarc(POS_ANI.nucleo.x,POS_ANI.nucleo.y/esc.y,.72,0,Math.PI*2,true);sh.holes.push(furo);
 const tampa=new T.Mesh(new T.ShapeGeometry(sh,64),matTex('citoplasma',0xffffff,{transparent:true,opacity:.93,side:T.DoubleSide,depthWrite:true}));tampa.scale.copy(esc);tag(tampa,ins('citoplasma'));g.add(tampa);
 const nuc=nucleo({r:.72});nuc.position.copy(POS_ANI.nucleo);g.add(nuc);
 const rer=reRugoso({base:.82,arco:Math.PI*1.1,rot:-Math.PI*.6,n:5});rer.position.copy(POS_ANI.nucleo).add(V(0,0,.02));tag(rer,ins('re_rugoso'));g.add(rer);
 const rel=reLiso({n:6});rel.position.copy(POS_ANI.reLiso);tag(rel,ins('re_liso'));g.add(rel);
 POS_ANI.mitos.forEach(([x,y,z,rz],i)=>{const m=mitocondria({seed:i+1});m.position.set(x,y,z);m.rotation.set(Math.PI/2*.15,0,rz);tag(m,ins('mitocondria'));g.add(m);});
 const go=golgi();go.position.copy(POS_ANI.golgi);go.rotation.z=-.4;tag(go,ins('golgi'));g.add(go);
 POS_ANI.lisos.forEach(([x,y,z],i)=>{const l=new T.Mesh(deforma(new T.SphereGeometry(.12+(i%2)*.03,20,14),.06,i+5,6),matTex('lisossomo',0xffffff));l.position.set(x,y,z);tag(l,ins('lisossomo'));g.add(l);});
 POS_ANI.vesic.forEach(([x,y,z],i)=>{const v=ball(.06+(i%3)*.012,0xf0d880,V(x,y,z),{roughness:.3,transparent:true,opacity:.92},14);tag(v,ins('vesicula'));g.add(v);});
 const ce=centriolo();ce.position.copy(POS_ANI.centriolos);ce.rotation.set(.4,.3,0);tag(ce,ins('centriolos'));g.add(ce);
 /* ribossomos livres e citoesqueleto sobre a face do corte */
 let s=31;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
 const livres=ribossomos(260,()=>{let x,y;do{x=(rnd()*2-1)*R*.9;y=(rnd()*2-1)*R*.8;}while(x*x/(R*R*.81)+y*y/(R*R*.64)>1||Math.hypot(x-POS_ANI.nucleo.x,y-POS_ANI.nucleo.y)<.95);return V(x,y,.02+rnd()*.03);});tag(livres,ins('ribossomo'));g.add(livres);
 const cito=new T.Group();const mc=mat(0xd6d6ea,{transparent:true,opacity:.32,roughness:.3});for(let k=0;k<18;k++){const a=rnd()*Math.PI*2,b=a+(rnd()-.5)*1.6;const p0=V(Math.cos(a)*R*.85,Math.sin(a)*R*.72,.03);const p2=V(Math.cos(b)*R*.3,Math.sin(b)*R*.3,.03);const p1=p0.clone().lerp(p2,.5).add(V((rnd()-.5)*.6,(rnd()-.5)*.6,.01));cito.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([p0,p1,p2]),24,.0045,5,false),mc));}tag(cito,ins('citoesqueleto'));g.add(cito);
 g.userData.tick=t=>{go.children.forEach((c,i)=>{if(c.geometry&&c.geometry.type==='SphereGeometry')c.position.z=(i%2-.5)*.04+Math.sin(t*1.3+i)*.012;});};
 return g;}
const POS_VEG={nucleo:V(-1.15,.55,0),cloros:[[1.4,1.0],[.5,1.12],[-.35,1.15],[1.62,.25],[1.62,-.55],[1.35,-1.05],[.4,-1.15],[-.5,-1.15],[-1.45,-1.0],[-1.68,-.25],[-.95,1.2],[1.0,-1.18]],mitos:[[-1.55,-.6,.4],[.95,1.18,1.4],[1.75,-.15,.1]]};
function retangulo(w,h,r){const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function celulaVegetal(opt={}){const g=new T.Group();const W=4.2,H=3.0,P=1.5;
 /* parede: moldura extrudada (espessura) + fundo; membrana logo por dentro */
 const sh=retangulo(W,H,.35);sh.holes.push(retangulo(W-.24,H-.24,.25));
 const par=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:P,bevelEnabled:false,curveSegments:10}),matTex('parede',0xffffff));par.position.z=-P;tag(par,ins('parede'));g.add(par);
 const fundo=new T.Mesh(new T.ShapeGeometry(retangulo(W,H,.35),10),matTex('parede',0xc8d8a0));fundo.position.z=-P;tag(fundo,ins('parede'));g.add(fundo);
 const shM=retangulo(W-.24,H-.24,.25);shM.holes.push(retangulo(W-.3,H-.3,.22));const mem=new T.Mesh(new T.ExtrudeGeometry(shM,{depth:P-.02,bevelEnabled:false,curveSegments:10}),mat(0xe8b4a0));mem.position.z=-P+.01;tag(mem,ins('membrana'));g.add(mem);
 const tampa=new T.Mesh(new T.ShapeGeometry(retangulo(W-.3,H-.3,.22),10),matTex('citoplasma',0xeef0d8,{transparent:true,opacity:.9,side:T.DoubleSide}));tampa.position.z=-.002;tag(tampa,ins('citoplasma'));g.add(tampa);
 /* vacúolo central: grande bolha azul translúcida */
 const vac=new T.Mesh(deforma(new T.SphereGeometry(1,40,28),.04,7,1.5),mat(0x9fd4f0,{map:TX.vacuolo(),transparent:true,opacity:.62,roughness:.08,envMapIntensity:1.1,depthWrite:false}));vac.scale.set(1.45,.92,.42);vac.position.set(.25,-.05,.02);tag(vac,ins('vacuolo'));g.add(vac);
 const nuc=nucleo({r:.48});nuc.position.copy(POS_VEG.nucleo);g.add(nuc);
 POS_VEG.cloros.forEach(([x,y],i)=>{const c=cloroplasto({seed:i+3});c.position.set(x,y,.06);c.rotation.z=Math.atan2(y,x)+Math.PI/2+(i%3-1)*.25;tag(c,ins('cloroplasto'));g.add(c);});
 POS_VEG.mitos.forEach(([x,y,rz],i)=>{const m=mitocondria({seed:i+7,r:.12,len:.3});m.position.set(x,y,.06);m.rotation.z=rz;tag(m,ins('mitocondria'));g.add(m);});
 const rer=reRugoso({base:.52,arco:Math.PI*.9,rot:-Math.PI*.55,n:4,ribos:200});rer.position.copy(POS_VEG.nucleo).add(V(0,0,.02));tag(rer,ins('re_rugoso'));g.add(rer);
 const go=golgi({n:4});go.scale.setScalar(.6);go.position.set(-1.35,-.45,.05);go.rotation.z=.8;tag(go,ins('golgi'));g.add(go);
 g.userData.tick=t=>{vac.scale.z=.42+Math.sin(t*.8)*.012;};
 return g;}
function celula(tipo,opt={}){const c=tipo==='vegetal'?celulaVegetal(opt):celulaAnimal(opt);if(opt.destaque){const alvo=opt.destaque;c.traverse(o=>{if(!o.isMesh||!o.material)return;const k=o.userData.hit&&o.userData.hit.key;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();const mm2=Array.isArray(o.material)?o.material:[o.material];mm2.forEach(m=>{if(k===alvo){if(m.emissive){m.emissive.setHex(0x6a4a10);m.userData.pulsa=true;}}else if(m.color){m.color.multiplyScalar(.38);}});});const t0=c.userData.tick;c.userData.tick=t=>{if(t0)t0(t);const k=.55+.45*Math.sin(t*4);c.traverse(o=>{if(o.isMesh&&o.material&&o.material.userData&&o.material.userData.pulsa)o.material.emissiveIntensity=k;});};}return c;}
/* ---------- foto real no microscópio (painel com moldura e legenda) ---------- */
/* fotos da Wikimedia Commons: crédito obrigatório (CC BY / BY-SA) aparece embaixo da legenda */
const FOTOS={bochecha:{asp:1239/1198,cred:'Foto: Fritzmann2002 · CC BY-SA 4.0 · Wikimedia Commons'},cebola:{asp:1,cred:'Foto: Katekor1 · CC BY 4.0 · Wikimedia Commons'},elodea:{asp:1091/2000,cred:'Foto: Kelvinsong · CC BY-SA 3.0 · Wikimedia Commons'}};
/* sem crédito confirmado, o painel não aparece */
function fotoReal(arq,legenda,largura=2.4){const g=new T.Group();const info=FOTOS[arq];if(!info||!info.cred)return g;const t=new T.Texture();t.encoding=T.sRGBEncoding;t.minFilter=T.LinearFilter;LOADER.load('assets/foto-'+arq+'.webp',img=>{t.image=img;t.needsUpdate=true;});
 const h=largura*info.asp;const quadro=new T.Mesh(new T.PlaneGeometry(largura,h),new T.MeshBasicMaterial({map:t,toneMapped:false,color:0xffffff}));g.add(quadro);
 const moldura=new T.Mesh(new T.PlaneGeometry(largura+.12,h+.12),new T.MeshBasicMaterial({color:0x0c1a28}));moldura.position.z=-.01;g.add(moldura);
 const lg=rotuloFixo(legenda,'#cfe8f6',largura,54);lg.position.set(0,-h/2-.26,0);g.add(lg);
 const cr=rotuloFixo(info.cred,'#8fb0c2',largura,40);cr.position.set(0,-h/2-.5,0);g.add(cr);
 tag(g,{type:'context'});g.userData.semGiro=true;return g;}
/* ---------- cenas das missões ---------- */
function tecido(opt={}){const g=new T.Group();const geo=deforma(new T.SphereGeometry(.42,24,16),.06,4,4);const mc=matTex('membrana',0xf4c8b8,{roughness:.45});const mn=mat(0x8a6ab8,{roughness:.4});let i=0;
 for(let row=-3;row<=3;row++)for(let col=-5;col<=5;col++){const x=col*.86+(row%2?.43:0),y=row*.74;if(x*x/25+y*y/7>1.05)continue;const c=new T.Mesh(geo,mc);c.position.set(x,y,0);c.scale.set(1.04,1,.55);c.rotation.z=(i*1.7)%Math.PI;g.add(c);const n=new T.Mesh(new T.SphereGeometry(.13,14,10),mn);n.position.set(x+.05,y+.04,.19);g.add(n);
  if(col===1&&row===0){c.userData.alvo=true;tag(c,{type:'context'});tag(n,{type:'context'});const anel=new T.Mesh(new T.TorusGeometry(.48,.02,8,48),new T.MeshBasicMaterial({color:0x9ff3c8}));anel.position.set(x,y,.26);g.add(anel);g.userData.anel=anel;}
  else{tag(c,{type:'context'});}i++;}
 g.userData.tick=t=>{if(g.userData.anel)g.userData.anel.scale.setScalar(1+.06*Math.sin(t*3));};return g;}
function celulaInteira(){const g=new T.Group();const geo=deforma(new T.SphereGeometry(R,64,44),.035,3,1.2);const m=new T.Mesh(geo,matTex('membrana',0xffffff,{transparent:true,opacity:.86,roughness:.3,envMapIntensity:.8}));m.scale.set(1,.9,1);tag(m,{type:'context'});g.add(m);const n=ball(.72,0x9a7ac8,POS_ANI.nucleo.clone().setZ(-.2),{transparent:true,opacity:.7},32);g.add(n);g.userData.tick=t=>{g.rotation.y=Math.sin(t*.3)*.25;};return g;}
function contexto(level){const g=new T.Group();
 if(level===0){const te=tecido();te.scale.setScalar(.7);te.position.x=-1.3;g.add(te);g.userData.tick=te.userData.tick;textAt(g,'Tecido no microscópio (≈ 400×)',-1.3,1.95,0,2.8,'#cfe8f6');const f=fotoReal('bochecha','Foto real: células da bochecha (azul de metileno)',2.3);f.position.set(3.6,.1,.2);f.rotation.y=-.22;g.add(f);}
 else if(level===1){const c=celulaInteira();g.add(c);g.userData.tick=c.userData.tick;const te=tecido();te.scale.setScalar(.6);te.position.set(0,-3.2,-1.5);te.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.35;o.userData.hit=null;}});g.add(te);textAt(g,'Uma célula · 10 a 30 µm',0,2.75,0,2.8,'#cfe8f6');}
 else{const c=celula('animal');tag(c,{type:'inspect',key:'celula_animal'});c.traverse(o=>{if(o.isMesh&&o.userData.hit&&o.userData.hit.key==='celula_animal')o.userData.hit={type:'context'};});g.add(c);g.userData.tick=c.userData.tick;}
 return g;}
function folha(){const g=new T.Group();const s=new T.Shape();s.moveTo(0,-2.2);s.bezierCurveTo(1.8,-1.4,1.9,1.2,0,2.4);s.bezierCurveTo(-1.9,1.2,-1.8,-1.4,0,-2.2);
 const tx=texRuido('folha',256,(u,v,n)=>{const nerv=Math.abs(u-.5)<.012||Math.abs((u-.5)-(v-.3)*.6)<.008&&u>.5||Math.abs((.5-u)-(v-.3)*.6)<.008&&u<.5;const a=n(u*20,v*20)*.5+.5;const k=nerv?1.25:.8+.2*a;return [cl(60*k),cl(140*k),cl(50*k)];});
 const geo=new T.ExtrudeGeometry(s,{depth:.06,bevelEnabled:true,bevelThickness:.03,bevelSize:.04,bevelSegments:2});const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+2)/4,(uv.getY(i)+2.2)/4.6);
 const m=new T.Mesh(geo,mat(0xffffff,{map:tx,bumpMap:tx,bumpScale:.02,roughness:.45}));tag(m,{type:'context'});g.add(m);
 const cabo=new T.Mesh(new T.CylinderGeometry(.04,.06,1.2,10),mat(0x4a7a30));cabo.position.set(0,-2.75,.03);g.add(cabo);g.userData.tick=t=>{g.rotation.y=Math.sin(t*.4)*.3;};return g;}
function muroVegetal(){const g=new T.Group();const geo=new T.BoxGeometry(1.0,.7,.5);const mp=matTex('parede',0xffffff);let s=3;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
 for(let r=-2;r<=2;r++)for(let c=-3;c<=3;c++){const x=c*1.04+(r%2?.52:0),y=r*.74;const b=new T.Mesh(geo,mp);b.position.set(x,y,0);tag(b,{type:'context'});g.add(b);const inner=new T.Mesh(new T.BoxGeometry(.9,.6,.02),mat(0xd8ecc0,{transparent:true,opacity:.7}));inner.position.set(x,y,.26);g.add(inner);
  for(let k=0;k<6;k++){const cp=new T.Mesh(new T.SphereGeometry(.06,10,8),matTex('cloroplasto',0xffffff));cp.scale.set(1.5,.8,.6);const a=rnd()*Math.PI*2;cp.position.set(x+Math.cos(a)*.36,y+Math.sin(a)*.22,.28);cp.rotation.z=a;g.add(cp);}}return g;}
function vegContexto(level){const g=new T.Group();
 if(level===0){const f=folha();g.add(f);g.userData.tick=f.userData.tick;textAt(g,'Uma folha',2.2,1.6,0,2.2,'#cfe8f6');}
 else if(level===1){const m=muroVegetal();m.scale.setScalar(.72);m.position.x=-1.3;g.add(m);textAt(g,'Células da folha no microscópio',-1.3,1.75,0,3,'#cfe8f6');const f=fotoReal('elodea','Foto real: cloroplastos em folha de elódea (400×)',2.9);f.position.set(3.5,.1,.2);f.rotation.y=-.22;g.add(f);}
 else{const c=cloroplasto({aberto:true});c.scale.setScalar(5.5);tag(c,{type:'inspect',key:'cloroplasto'});g.add(c);textAt(g,'Cloroplasto aberto · 5 a 10 µm',0,-1.75,0,3,'#cfe8f6');}
 return g;}
function explorar(){const c=celula('animal');return c;}
function vegetalExp(){return celula('vegetal');}
/* ---------- peça ampliada (ficha) ---------- */
function bicamada(){const g=new T.Group();const cab=mat(0xe8b4a0,{roughness:.35}),cau=mat(0xf4e0b0,{roughness:.6});const n=9;const geoC=new T.SphereGeometry(.07,12,8),geoT=new T.CylinderGeometry(.012,.012,.26,5);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=(i-n/2)*.15,z=(j-n/2)*.15;if((i===3&&j===4)||(i===6&&j===2))continue;for(const lado of [1,-1]){const h=new T.Mesh(geoC,cab);h.position.set(x,lado*.33,z);g.add(h);for(const dx of [-.025,.025]){const t=new T.Mesh(geoT,cau);t.position.set(x+dx,lado*.17,z);g.add(t);}}}
 const prot=new T.Mesh(deforma(new T.CylinderGeometry(.13,.13,.9,16),.08,2,6),mat(0x6aa0d8,{roughness:.4}));prot.position.set((3-n/2)*.15,0,(4-n/2)*.15);g.add(prot);
 const canal=new T.Mesh(new T.CylinderGeometry(.12,.12,.8,16,1,true),mat(0x7cc07c,{side:T.DoubleSide}));canal.position.set((6-n/2)*.15,0,(2-n/2)*.15);g.add(canal);
 const glic=ball(.06,0xf0d880,V((6-n/2)*.15,.55,(2-n/2)*.15));g.add(glic);g.userData.tick=t=>{glic.position.y=.55-((t*.25)%1)*1.1;};return g;}
function microtubulo(){const g=new T.Group();const m=mat(0xc8c8e8,{roughness:.35}),m2=mat(0xa8a8d8,{roughness:.35});for(let k=0;k<26;k++)for(let i=0;i<13;i++){const a=i/13*Math.PI*2;const b=ball(.05,0,V(Math.cos(a)*.17,k*.08-1,Math.sin(a)*.17),{},8);b.material=(i+k)%2?m:m2;g.add(b);}
 const pts=[];for(let i=0;i<=60;i++)pts.push(V(.55+Math.cos(i*.5)*.04,i*.034-1,Math.sin(i*.5)*.04));const f=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),120,.03,6,false),mat(0xe8a0b8));g.add(f);return g;}
function ribossomoZoom(){const g=new T.Group();const grande=new T.Mesh(deforma(new T.SphereGeometry(.5,28,20),.1,4,3),mat(0x46588a,{roughness:.45}));grande.scale.set(1.2,.85,1);g.add(grande);const peq=new T.Mesh(deforma(new T.SphereGeometry(.36,24,16),.1,9,3),mat(0x6a7ab0,{roughness:.45}));peq.scale.set(1.15,.7,.9);peq.position.set(0,.55,.05);g.add(peq);
 const pts=[];for(let i=0;i<=40;i++)pts.push(V(-1.4+i*.07,.42+Math.sin(i*.6)*.03,.2));const rna=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),80,.025,6,false),mat(0xe0c060));g.add(rna);
 const cad=new T.Group();for(let i=0;i<9;i++){cad.add(ball(.06,[0xe07a50,0x7cc07c,0x6aa0d8,0xd06080][i%4],V(.1+Math.sin(i*.7)*.15,-.55-i*.1,Math.cos(i*.7)*.1),{},10));}g.add(cad);return g;}
function paredeZoom(){const g=new T.Group();const f=fotoReal('cebola','Foto real: epiderme da cebola',1.5);f.position.set(2.15,0,0);f.rotation.y=-.3;g.add(f);const m=matTex('parede',0xffffff);for(let c=0;c<3;c++)for(let i=0;i<12;i++){const f=new T.Mesh(new T.CylinderGeometry(.035,.035,2.4,8),m);f.rotation.z=Math.PI/2;f.rotation.y=c*Math.PI/3;f.position.set(0,(i-6)*.1,c*.09-.09);g.add(f);}const mem=new T.Mesh(new T.PlaneGeometry(2.4,1.3),mat(0xe8b4a0,{transparent:true,opacity:.8,side:T.DoubleSide}));mem.position.z=-.25;g.add(mem);return g;}
function vesiculaZoom(){const g=new T.Group();const v=new T.Mesh(new T.SphereGeometry(.8,32,22,0,Math.PI*2,0,Math.PI*.8),mat(0xf0d880,{side:T.DoubleSide,transparent:true,opacity:.85,roughness:.25}));g.add(v);for(let i=0;i<20;i++){const a=i*2.4,b=(i%5)*.12;g.add(ball(.06,0xe07a50,V(Math.cos(a)*(.2+b),Math.sin(a)*(.2+b),(i%3-1)*.15),{},8));}return g;}
function lisossomoZoom(){const g=new T.Group();const v=new T.Mesh(new T.SphereGeometry(.85,32,22,0,Math.PI*2,0,Math.PI*.78),matTex('lisossomo',0xffffff,{side:T.DoubleSide}));g.add(v);for(let i=0;i<26;i++){const a=i*2.4,b=(i%5)*.12;const e=new T.Mesh(new T.TetrahedronGeometry(.07),mat(0x8a2a50));e.position.set(Math.cos(a)*(.15+b),Math.sin(a)*(.15+b)-.1,(i%3-1)*.2);e.rotation.set(i,i*2,0);g.add(e);}const bac=new T.Mesh(capsula(.12,.3,12),mat(0x7cc07c));bac.position.set(.15,-.1,0);bac.rotation.z=.7;g.add(bac);g.userData.tick=t=>{bac.rotation.y=t;};return g;}
function inspection(key){const g=new T.Group();let o;
 if(key==='mitocondria'){o=mitocondria({aberta:true,r:.55,len:1.3});}
 else if(key==='nucleo'||key==='carioteca'||key==='nucleolo'){o=nucleo({r:1.1});if(key!=='nucleo'){o.traverse(x=>{if(x.isMesh&&x.userData.hit&&x.userData.hit.key!==key&&x.material){x.material=x.material.clone();x.material.transparent=true;x.material.opacity=.35;}});}}
 else if(key==='membrana'){o=bicamada();o.rotation.x=.35;}
 else if(key==='citoesqueleto'){o=microtubulo();}
 else if(key==='ribossomo'){o=ribossomoZoom();}
 else if(key==='re_rugoso'){o=reRugoso({base:.6,arco:Math.PI*1.5,n:5,ribos:500});o.scale.setScalar(1.6);}
 else if(key==='re_liso'){o=reLiso({n:8});o.scale.setScalar(2.4);}
 else if(key==='golgi'){o=golgi();o.scale.setScalar(2.2);}
 else if(key==='vesicula'){o=vesiculaZoom();}
 else if(key==='lisossomo'){o=lisossomoZoom();}
 else if(key==='centriolos'){o=centriolo();o.scale.setScalar(6);}
 else if(key==='cloroplasto'){o=cloroplasto({aberto:true});o.scale.setScalar(4.5);}
 else if(key==='parede'){o=paredeZoom();}
 else if(key==='vacuolo'||key==='celula_vegetal'){o=celula('vegetal',key==='vacuolo'?{destaque:'vacuolo'}:{});o.scale.setScalar(.5);}
 else if(key==='citoplasma'||key==='celula_animal'){o=celula('animal',key==='citoplasma'?{destaque:'citoplasma'}:{});o.scale.setScalar(.6);}
 else{o=celula('animal',{destaque:key});o.scale.setScalar(.6);}
 tag(o,ins(key));g.add(o);g.userData.tick=o.userData.tick;g.userData.pegavel=true;return g;}
/* ---------- sequência (fábrica de proteínas) ---------- */
function sequencia(state,cfg){
 const g=new T.Group();const n=cfg.ordem.length,dy=.6,top=(n-1)*dy/2+.3;
 textFixo(g,cfg.titulo,.9,top+.75,0,3.4,cfg.cor);
 for(let i=0;i<n;i++){const y=top-i*dy;const key=state.colocados[i];
  const num=rotuloFixo(String(i+1),i===state.target?'#ffdb9f':'#8fb0c2',.5,96);num.position.set(-.55,y,.05);g.add(num);
  const cor=key&&D.info[key]?new T.Color(D.info[key].color).multiplyScalar(.6).getHex():0x23364a;
  const placa=new T.Mesh(new T.BoxGeometry(2.6,.46,.16),mat(cor,{transparent:!key,opacity:key?1:.7}));placa.position.set(.9,y,0);tag(placa,{type:'seqSlot',index:i});g.add(placa);
  const txt=rotuloFixo(key?cfg.rotulos[key]:'?',key?'#fff8ec':'#ffe3a8',2.4,key?66:96);txt.position.set(.9,y,.1);g.add(txt);
  if(key){const mini=inspection(key);mini.scale.multiplyScalar(.16);mini.position.set(2.45,y,.1);mini.traverse(o=>{o.userData.hit=null;});g.add(mini);}
  if(i===state.target&&!key){const marc=new T.Mesh(new T.BoxGeometry(2.72,.56,.06),new T.MeshBasicMaterial({color:0xefd094,wireframe:true}));marc.position.set(.9,y,.02);g.add(marc);}
  if(i<n-1){const seta=new T.ArrowHelper(V(0,-1,0),V(.9,y-.25,0),.12,0xe8c050,.08,.06);g.add(seta);}
 }
 const restantes=state.bandeja.filter(k=>!state.colocados.includes(k));
 restantes.forEach((k,i)=>{const cols=2,c=i%cols,r=Math.floor(i/cols);const x=-3.75+c*1.6,y=top-.1-r*.72;
  const peca=new T.Mesh(new T.BoxGeometry(1.48,.56,.2),mat(new T.Color(D.info[k].color).getHex(),{roughness:.45}));peca.position.set(x,y,.1);peca.userData.draggable=true;tag(peca,{type:'seqPiece',key:k});g.add(peca);
  const t=rotuloFixo(cfg.rotulos[k].split(':')[0],'#10161c',1.46,66);t.position.set(x,y,.22);g.add(t);
  if(state.selected===k){const anel=new T.Mesh(new T.BoxGeometry(1.6,.68,.08),new T.MeshBasicMaterial({color:0xffffff,wireframe:true}));anel.position.set(x,y,.1);g.add(anel);}
 });
 if(!state.done)textFixo(g,'ETAPAS',-2.95,top+.75,0,1.4,'#e8c050');
 g.userData.slots={top,dy};g.userData.semGiro=true;return g;}
/* ---------- viagem para dentro: a célula em escala gigante, percurso por pontos de passagem ---------- */
const ESCALA_VR=.55;const RV=10;
/* pontos de passagem calculados a partir das organelas (coordenadas da célula × K, com folga em z para passar ao lado) */
const WAY=[V(-15,1,4),V(-9,.6,2.6),V(-5,-1.5,3.2),V(-2.3,-4.4,3.1),V(0,-3,3.4),V(2.3,-.9,2.6),V(3.9,-2.9,2.8),V(5.5,1,3.2),V(4.3,4.6,2.8),V(2,3.5,3.8),V(-.4,1.8,3.7)];
/* trecho i vai de WAY[a] até WAY[b] */
const TRECHOS=[[0,1],[1,2],[2,3],[3,5],[5,6],[6,8],[8,10]];
function viagemCena(state){const g=new T.Group();const i=Math.min(state.trecho||0,TRECHOS.length-1);const K=RV/R;
 const cel=new T.Group();cel.scale.setScalar(K);g.add(cel);
 /* membrana inteira por dentro e por fora, translúcida */
 const memb=new T.Mesh(deforma(new T.SphereGeometry(R,72,48),.035,3,1.2),matTex('membrana',0xffffff,{side:T.DoubleSide,transparent:true,opacity:.42,depthWrite:false,roughness:.25,envMapIntensity:.9}));memb.scale.set(1,.9,1);cel.add(memb);
 const nuc=nucleo({r:.72});nuc.position.copy(POS_ANI.nucleo).setZ(0);cel.add(nuc);const nucInt=new T.Mesh(new T.SphereGeometry(.72,40,28,0,Math.PI),matTex('nucleo',0xffffff,{side:T.DoubleSide,transparent:true,opacity:.5}));nucInt.position.copy(nuc.position);cel.add(nucInt);
 const rer=reRugoso({base:.82,arco:Math.PI*1.1,rot:-Math.PI*.6,n:5,ribos:600});rer.position.copy(POS_ANI.nucleo);cel.add(rer);
 const rer2=rer.clone();rer2.rotation.x=Math.PI/2;rer2.position.copy(POS_ANI.nucleo);cel.add(rer2);
 POS_ANI.mitos.forEach(([x,y,z,rz],k)=>{const m=mitocondria({seed:k+1});m.position.set(x,y,z+(k%2?.6:-.5));m.rotation.set(k,0,rz);cel.add(m);});
 const mGrande=mitocondria({aberta:true,r:.2,len:.5});mGrande.position.set(-.5,-1.0,.15);mGrande.rotation.z=.3;cel.add(mGrande);
 const go=golgi();go.position.copy(POS_ANI.golgi);go.rotation.z=-.4;cel.add(go);
 POS_ANI.lisos.forEach(([x,y,z],k)=>{const l=new T.Mesh(deforma(new T.SphereGeometry(.12,20,14),.06,k+5,6),matTex('lisossomo',0xffffff));l.position.set(x,y,z+(k%2?.5:-.4));cel.add(l);});
 const lisoT=new T.Mesh(deforma(new T.SphereGeometry(.16,24,16),.06,9,6),matTex('lisossomo',0xffffff));lisoT.position.set(.95,1.05,.1);cel.add(lisoT);
 let s=41;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
 const livres=ribossomos(900,()=>{let p;do{p=V((rnd()*2-1)*R*.9,(rnd()*2-1)*R*.8,(rnd()*2-1)*R*.85);}while(p.lengthSq()>R*R*.7);return p;});cel.add(livres);
 const mc=mat(0xd6d6ea,{transparent:true,opacity:.25,roughness:.3});for(let k=0;k<40;k++){const p0=V((rnd()-.5)*.3+.35,(rnd()-.5)*.3+.62,(rnd()-.5)*.3);const a=rnd()*Math.PI*2,b=(rnd()-.5)*2;const p2=V(Math.cos(a)*R*.85,Math.sin(a)*R*.7,b);const p1=p0.clone().lerp(p2,.5).add(V((rnd()-.5)*.6,(rnd()-.5)*.6,(rnd()-.5)*.6));cel.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([p0,p1,p2]),24,.008,5,false),mc));}
 const vesG=new T.Group();for(let k=0;k<30;k++){const v=ball(.05,0xf0d880,V((rnd()-.5)*3.4,(rnd()-.5)*3,(rnd()-.5)*2.4),{roughness:.3},10);v.userData.v=V((rnd()-.5)*.1,(rnd()-.5)*.1,(rnd()-.5)*.1);vesG.add(v);}cel.add(vesG);
 /* partículas do citosol */
 const n=2200,pos=new Float32Array(n*3);for(let k=0;k<n;k++){let p;do{p=V((rnd()*2-1),(rnd()*2-1),(rnd()*2-1)).multiplyScalar(R*.95);}while(p.lengthSq()>R*R*.85);pos[k*3]=p.x;pos[k*3+1]=p.y;pos[k*3+2]=p.z;}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));const pts=new T.Points(pg,new T.PointsMaterial({size:.012,color:0xffe8d8,transparent:true,opacity:.55,depthWrite:false}));pts.userData.semEnquadre=true;cel.add(pts);
 /* trilha do trecho atual */
 const [a,b]=TRECHOS[i];const curva=new T.CatmullRomCurve3(WAY.slice(a,b+1).length>1?WAY.slice(a,b+1):[WAY[a],WAY[b]]);
 const trilha=new T.Mesh(new T.TubeGeometry(curva,80,.02,5,false),new T.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:.5}));trilha.userData.semEnquadre=true;g.add(trilha);
 const ALVOS=[V(-9.4,.6,2.6),V(-5,-1,0),V(-2.27,-4.55,.68),V(2.27,-.89,.1),V(3.86,-2.95,.23),V(4.3,4.8,.45),V(-2.05,.68,0)];g.userData.viagem={curva,escalaVR:ESCALA_VR,claro:true,alvo:ALVOS[i]};
 g.userData.tick=t=>{vesG.children.forEach((v,k)=>{v.position.addScaledVector(v.userData.v,.004);if(v.position.length()>1.9)v.userData.v.negate();});go.rotation.y=Math.sin(t*.2)*.1;};
 g.userData.semGiro=true;return g;}
/* ---------- Animal × Vegetal ---------- */
function compararCena(state){const g=new T.Group();const rod=D.COMPARAR[Math.min(state.rodada,D.COMPARAR.length-1)];const alvo=state.done?null:rod.key;
 const a=celula('animal',alvo?{destaque:alvo}:{}),v=celula('vegetal',alvo?{destaque:alvo}:{});a.scale.setScalar(.82);v.scale.setScalar(.72);a.position.set(-2.55,0,0);v.position.set(2.6,0,0);
 a.traverse(o=>{if(o.isMesh)o.userData.hit={type:'cmpCel',lado:'animal'};});v.traverse(o=>{if(o.isMesh)o.userData.hit={type:'cmpCel',lado:'vegetal'};});g.add(a,v);
 textAt(g,'Célula animal',-2.55,2.35,0,2.4,'#f4c8b8');textAt(g,'Célula vegetal',2.6,2.35,0,2.4,'#b8e0a0');
 if(alvo)textAt(g,'Procure: '+D.info[alvo].name,0,-2.45,0,4,'#ffe3a8');
 g.userData.tick=t=>{a.userData.tick&&a.userData.tick(t);v.userData.tick&&v.userData.tick(t);};
 g.userData.semGiro=true;return g;}
function desafio(modulo){const g=new T.Group();const c=celula(modulo==='veg'?'vegetal':'animal');g.add(c);g.userData.tick=c.userData.tick;return g;}
function dispose(g){if(!g)return;const geos=new Set(),mats=new Set(),tex=new Set();const comp=new Set(Object.values(TEXP));g.traverse(o=>{if(o.geometry&&!o.isSprite)geos.add(o.geometry);for(const m of [].concat(o.material||[])){if(!m)continue;mats.add(m);for(const t of [m.map,m.emissiveMap,m.normalMap,m.bumpMap]){if(t&&!comp.has(t))tex.add(t);}}});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());tex.forEach(x=>x.dispose());if(g.parent)g.parent.remove(g);}
window.CELULA_MODELS={V,R,mat,ball,label,rotuloFixo,textFixo,textAt,tag,celula,contexto,vegContexto,explorar,vegetalExp,inspection,sequencia,viagemCena,compararCena,desafio,dispose,ESCALA_VR,TRECHOS};
})();
