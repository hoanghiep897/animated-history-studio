import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {EffectComposer} from '@react-three/postprocessing';
import {BloomEffect, ToneMappingEffect, ToneMappingMode, BlendFunction} from 'postprocessing';
import {bodyFront, Pen, type Outfit} from '../../../upstream/bridge/toon';
import {InkPass, NOINK} from '../../../upstream/bridge/ink';
import {GradeEffect, GRADES} from '../../../upstream/bridge/grade';
import {twoTone} from '../../../upstream/bridge/shade';

/**
 * BACH DANG 938 — entirely new original story and scene, built on the
 * actual mromidev/claude-animated-shorts actor / outline / grade engine.
 * 2D ink-drawn animated characters live on moving 3D warships.
 * Water genuinely recedes while fixed stakes emerge; enemy boats collide.
 *
 * Explicitly avoid the old Pompeii compositing problems:
 * - Characters are hard alpha-tested CUTOUTS with depthWrite, opacity 1.
 * - Saturated physically separate foreground/midground shapes.
 * - LensBlur omitted: it blacked out the prior scene under software WebGL.
 */
export const FPS = 25;
export const DURATION = 24;
const ss=(x:number)=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)};
const lim=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const rand=(i:number)=>{const x=Math.sin(i*170.731+938.131)*43758.545;return x-Math.floor(x)};
const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);

const paint=(hex:string)=>twoTone(new THREE.MeshLambertMaterial({color:hex}));
const solid=(hex:string)=>new THREE.MeshLambertMaterial({color:hex,flatShading:true});
const MAT={
 earth:paint('#665642'), banks:paint('#536b3e'), grass:paint('#416542'),
 water:new THREE.MeshPhongMaterial({color:'#1b576a',shininess:68,specular:'#538b91',flatShading:true}),
 waterDeep:solid('#103847'),
 current:new THREE.MeshBasicMaterial({color:'#83c5c3',transparent:true,opacity:.34,depthWrite:false}),
 wood:paint('#70442d'),deck:paint('#b17d4f'), darkwood:paint('#402821'),
 edge:paint('#d69f61'), iron:paint('#39434b'), red:paint('#bf372c'),
 yellow:paint('#efbc58'), reeds:paint('#7e9860'), canopy:paint('#203a37'),
 fog:solid('#4e5960'), brown:paint('#654734')
};
const GEOM = {box:new THREE.BoxGeometry(1,1,1),ball:new THREE.SphereGeometry(1,9,7)};
function cube(parent:THREE.Group,mat:THREE.Material,position:[number,number,number],size:[number,number,number]){
  const mesh=new THREE.Mesh(GEOM.box,mat);mesh.position.set(...position);mesh.scale.set(...size);
  mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function ellipsoid(parent:THREE.Group,mat:THREE.Material,position:[number,number,number],size:[number,number,number]){
  const mesh=new THREE.Mesh(GEOM.ball,mat);mesh.position.set(...position);mesh.scale.set(...size);
  parent.add(mesh);return mesh;
}
function pole(parent:THREE.Group,mat:THREE.Material,r:number,h:number,x:number,y:number,z:number){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r,h,8),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function wave(parent:THREE.Group,color:string,x:number,y:number,z:number,sz:number){
 const shape=new THREE.BufferGeometry();
 const vertices=new Float32Array(3*3*2);
 const arr=new Uint16Array([0,2,1,1,2,3,2,4,3,3,4,5]);
 shape.setIndex(Array.from(arr));shape.setAttribute('position',new THREE.BufferAttribute(vertices,3));
 const material=new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide,emissive:'#1f0504',emissiveIntensity:.17});
 const mesh=new THREE.Mesh(shape,material);mesh.position.set(x,y,z);mesh.userData={wave:true,sz};
 parent.add(mesh);return mesh;
}
function updateFlag(f:THREE.Mesh,t:number){
 const verts=(f.geometry.getAttribute('position') as THREE.BufferAttribute),s=f.userData.sz as number;
 for(let i=0;i<3;i++)for(let j=0;j<2;j++){
   const n=i*2+j, u=i/2, a=Math.sin(t*7-u*5)*.16*u;
   verts.setXYZ(n,u*1.3*s,j===0?s*.75:0,a);
 }
 verts.needsUpdate=true;f.geometry.computeVertexNormals();
}
type Side='ours'|'han'|'commander';
const outfits:Record<Side,Outfit>={
 ours:{jacket:'#416e4f',pants:'#293f3d',boots:'#26232b',skin:'#edbd8f',hat:'hair',hair:'#20232a',belt:'#dcc07e'},
 commander:{jacket:'#b63e31',pants:'#394b40',boots:'#29242a',skin:'#e5b17e',hat:'hair',hair:'#22242c',belt:'#e1b45a',sash:'#f0c760',moustache:'#34221c'},
 han:{jacket:'#58596e',pants:'#333946',boots:'#242631',skin:'#ebbd9d',hat:'shako',belt:'#d9d1ae'}
};
class Soldier {
 canvas:HTMLCanvasElement;
 g:CanvasRenderingContext2D;
 tex:THREE.CanvasTexture;
 sprite:THREE.Sprite;
 shadow:THREE.Mesh;
 constructor(public faction:Side,public id:number){
   this.canvas=document.createElement('canvas');
   this.canvas.width=480;this.canvas.height=800;
   this.g=this.canvas.getContext('2d')!;
   this.tex=new THREE.CanvasTexture(this.canvas);
   this.tex.colorSpace=THREE.SRGBColorSpace;this.tex.anisotropy=4;
   // Hard alpha test discards transparent pixels: opaque torso, no ghosting.
   const spriteMat=new THREE.SpriteMaterial({
     map:this.tex,transparent:false,alphaTest:.24,opacity:1,
     depthWrite:true,depthTest:true,toneMapped:false
   });
   this.sprite=new THREE.Sprite(spriteMat);
   this.sprite.layers.set(NOINK);
   this.sprite.center.set(.5,0);
   this.sprite.scale.set(1.1,1.84,1);
   this.sprite.renderOrder=3;
   this.shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,16),
     new THREE.MeshBasicMaterial({color:'#1e1f25',opacity:.32,transparent:true,depthWrite:false}));
   this.shadow.rotation.x=-Math.PI/2;
   this.shadow.layers.set(NOINK);
 }
 paint(t:number,alarm:boolean,command:boolean){
   const ctx=this.g;ctx.clearRect(0,0,480,800);
   ctx.save();ctx.scale(.8,.8);
   const p=new Pen(ctx);p.ol=17;
   const phase=(t*(alarm?2.1:.83)+this.id*.18)%1;
   bodyFront(p,outfits[this.faction],{
     seed:this.id+19,phase,mode:alarm?'march':'stand',
     expr:alarm?'shock':command?'stern':'neutral',
     blink:(Math.floor(t*FPS)+this.id*11)%77<3,
     light:-.65,headTilt:alarm?Math.sin(t*4)*.045:0,
     look:command?.18:0, wave:command?Math.sin(t*4)*.3:undefined,
     lift:alarm?65:12
   });
   ctx.restore();
   this.tex.needsUpdate=true;
   this.sprite.scale.y=1.84*(1+.023*Math.abs(Math.sin(phase*6.283)));
 }
 dispose(){this.tex.dispose();(this.sprite.material as THREE.Material).dispose();
   (this.shadow.material as THREE.Material).dispose();this.shadow.geometry.dispose();}
}
class Warship{
 root=new THREE.Group();hull=new THREE.Group(); crew:Soldier[]=[];flags:THREE.Mesh[]=[];
 constructor(public side:Side,public id:number,public length:number){
   const R=this.root; R.add(this.hull);
   const h=this.hull;
   const beam=side==='han'?2.65:1.85;
   const mat=side==='han'?MAT.darkwood:MAT.wood;
   // True tapered polygonal hull rather than a rectangular box.
   const vertices=[
     [-beam*.82,-length*.47],[beam*.82,-length*.47],
     [beam,length*.25],[0,length*.56],[-beam,length*.25]
   ];
   const outline=new THREE.Shape();
   outline.moveTo(vertices[0][0],vertices[0][1]);
   for(let i=1;i<vertices.length;i++)outline.lineTo(vertices[i][0],vertices[i][1]);
   outline.closePath();
   const hullGeometry=new THREE.ExtrudeGeometry(outline,{depth:.68,bevelEnabled:true,bevelSize:.16,bevelThickness:.15,bevelSegments:1,steps:1});
   // Shape XY -> horizontal XZ; extrusion becomes thickness in Y.
   hullGeometry.rotateX(Math.PI/2);
   const hullMesh=new THREE.Mesh(hullGeometry,mat);
   hullMesh.position.y=.3;h.add(hullMesh);
   cube(h,MAT.deck,[0,.82,-.2],[beam*1.52,.13,length*.78]);
   cube(h,MAT.edge,[-beam*.71,1.02,-length*.08],[.17,.35,length*.79]);
   cube(h,MAT.edge,[beam*.71,1.02,-length*.08],[.17,.35,length*.79]);
   for(let k=0;k<6;k++){
      cube(h,MAT.wood,[0,.9,-length*.33+k*length*.115],[beam*1.3,.11,.12]);
   }
   const mast=pole(h,MAT.darkwood,.105,5.3,0,3.5,-length*.14);
   pole(h,MAT.iron,.1,.7,0,6.5,-length*.14);
   cube(h,MAT.edge,[0,5.1,-length*.14],[3.3,.14,.16]);
   if(side==='han'){
     const sail=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.65),new THREE.MeshLambertMaterial({
       color:'#c4a57b',side:THREE.DoubleSide,transparent:false
     }));
     sail.position.set(0,3.48,-length*.14);h.add(sail);
     for(let k=0;k<3;k++)cube(h,MAT.darkwood,[0,2.65+k*.8,-length*.14+.01],[3.3,.055,.03]);
   }
   const f=wave(h,side==='han'?'#574e66':'#be302b',.2,5.8,-length*.14,1.2);
   this.flags.push(f);
   const n=side==='han'?4:3;
   for(let i=0;i<n;i++){
      const actor=new Soldier(side==='han'?'han':(i===0&&side==='commander'?'commander':'ours'),id*9+i);
      actor.sprite.position.set((i%2?.58:-.58),1.16,-length*.31+i*length*.19);
      actor.shadow.position.set((i%2?.58:-.58),1.03,-length*.31+i*length*.19);
      h.add(actor.sprite);h.add(actor.shadow);this.crew.push(actor);
   }
 }
 update(t:number,waterY:number){
   for(const c of this.crew)c.paint(t,t>12,this.side==='commander');
   for(const f of this.flags)updateFlag(f,t+this.id);
   const w=Math.sin(t*2.4+this.id)*.037;
   const late=ss((t-13.0)/2.1);
   if(this.side==='han'){
     const approach=lim((t+1)*2.0,0,29);
     this.root.position.set(this.id*3.0-3.0,waterY-.18,-27+approach-(this.id===2?6:0));
     this.hull.rotation.set(w*(1+late),0,(this.id===1?-1:1)*late*.18);
     this.root.position.z-=late*2.6;
   }else{
     const flee=lim(t*2.0,0,26);
     this.root.position.set((this.id-4)*2.5+Math.sin(t*.6)*.5,waterY-.1,-2+flee);
     if(t>14){
        const reenter=ss((t-14)/3.2);
        this.root.position.set((this.id===4?-8:8)-((this.id===4?-1:1)*reenter*3),waterY-.1,15-reenter*13);
     }
     this.hull.rotation.z=w;
   }
   this.hull.rotation.x=Math.sin(t*1.7+this.id)*.045;
 }
 dispose(){this.crew.forEach(c=>c.dispose());}
}
class Battlefield{
 root=new THREE.Group();
 water:THREE.Mesh;
 ripple:THREE.Mesh[]=[];
 reeds:THREE.Mesh[]=[];
 stakes:THREE.Group[]=[];
 ships:Warship[]=[];
 sun:THREE.DirectionalLight;
 ambient:THREE.AmbientLight;
 constructor(){
   const g=this.root;
   this.water=cube(g,MAT.waterDeep,[0,-1.4,-2],[43,.5,140]);
   // Geometry water surface with independently animated tidal height.
   const river=cube(g,MAT.water,[0,1.5,-2],[31,.09,135]);this.water=river;
   for(const dir of [-1,1]){
      cube(g,MAT.earth,[dir*25,-.15,-5],[19,3.3,150]);
      cube(g,MAT.banks,[dir*18.0,.8,-5],[8.8,1.4,150]);
      for(let i=0;i<22;i++){
        const x=dir*(15.7+rand(i*17+dir)*6.4),z=-48+rand(i*21+dir)*105;
        const p=pole(g,MAT.reeds,.1,2.0+rand(i)*1.3,x,2.0,z);
        p.rotation.z=dir*(.06+rand(i+17)*.28);
        this.reeds.push(p);
        if(i%4===0){
          pole(g,MAT.wood,.22,2.5,x,2.3,z);
          for(let j=0;j<3;j++)ellipsoid(g,MAT.canopy,[x+Math.sin(j*3)*.6,3.9+j*.17,z+Math.cos(j*2)*.55],[1.25,.8,1.02]);
        }
      }
   }
   // Stake FIELD is fixed in place: it is revealed by physical receding tide,
   // not mechanically rising through the riverbed.
   for(let row=0;row<5;row++)for(let col=0;col<5;col++){
     const x=(col-2)*3.4+(.3*row),z=-1+row*3.4;
     const stakeGroup=new THREE.Group();stakeGroup.position.set(x,-2.35,z);
     const tipMat=MAT.iron;
     const stake=pole(stakeGroup,MAT.wood,.35,3.35,0,1.5,0);
     stake.rotation.z=(rand(row*7+col)-.5)*.14;
     const tip=new THREE.Mesh(new THREE.ConeGeometry(.38,1.08,7),tipMat);tip.position.set(0,3.63,0);
     stakeGroup.add(tip);
     cube(stakeGroup,MAT.iron,[0,3.1,0],[.7,.10,.7]);
     g.add(stakeGroup);this.stakes.push(stakeGroup);
   }
   // River current / foamy wake cards are transparent intentionally; boats/people are not.
   for(let i=0;i<70;i++){
      const m=cube(g,MAT.current,[(rand(i*4)-.5)*28,1.57,-38+rand(i*9)*95],[.24+rand(i)*1.6,.013,.045+rand(i+6)*.15]);
      this.ripple.push(m);
   }
   this.ships.push(new Warship('han',0,11),new Warship('han',1,12),new Warship('han',2,10));
   this.ships.push(new Warship('commander',4,7.6),new Warship('ours',5,6.7));
   for(const s of this.ships)g.add(s.root);
   this.sun=new THREE.DirectionalLight('#ffdb9f',2.25);
   this.sun.position.set(-14,33,-16);
   this.ambient=new THREE.AmbientLight('#f4e1c5',.92);
   g.add(this.sun,this.ambient);
 }
 update(frame:number,camera:THREE.PerspectiveCamera,scene:THREE.Scene){
   const t=frame/FPS;
   const tide=ss((t-10.0)/6.8);
   const waterY=1.55-tide*1.95;
   this.water.position.y=waterY;
   for(let i=0;i<this.ripple.length;i++){
      const r=this.ripple[i];
      r.position.y=waterY+.063;
      r.position.z=-38+((rand(i*9)*95 + t*(.4+rand(i)*.5))%95);
      r.position.x=(rand(i*4)-.5)*28+Math.sin(t+i)*.06;
   }
   for(const s of this.ships)s.update(t,waterY);
   // The stakes do not move. Rising above the water changes only by falling tide.
   for(let i=0;i<this.stakes.length;i++){
     const p=this.stakes[i];p.rotation.z=Math.sin(i*3.1)*.025;
   }
   const drama=ss((t-11)/7);
   scene.background=new THREE.Color('#80a9ba').lerp(new THREE.Color('#f5ae69'),drama*.63);
   scene.fog=new THREE.Fog(new THREE.Color('#a9c4bb').lerp(new THREE.Color('#d1ab88'),drama*.4),40,200);
   this.sun.color.set('#ffe4b3').lerp(new THREE.Color('#f6a36d'),drama*.75);
   this.sun.intensity=2.35-drama*.25;
   // 6 distinct virtual camera shots, not a static pan over a painting.
   const shots=[
     {at:0,end:3.7,pos:vec(9,13,38),aim:vec(0,1,-17),fov:41},
     {at:3.7,end:7.3,pos:vec(-10,8.7,14),aim:vec(-1,2,-14),fov:45},
     {at:7.3,end:10.8,pos:vec(7,7,20),aim:vec(4,2,7),fov:45},
     {at:10.8,end:14.7,pos:vec(-3,5.4,17),aim:vec(0,1,5),fov:44},
     {at:14.7,end:19,pos:vec(10,9.4,26),aim:vec(0,1,3),fov:46},
     {at:19,end:25,pos:vec(-11,16,39),aim:vec(0,1,8),fov:41}
   ];
   const sh=shots.find(s=>t>=s.at&&t<s.end)||shots[shots.length-1];
   const k=ss((t-sh.at)/(sh.end-sh.at));
   const shake=t>14&&t<17?Math.sin(t*27)*.1:0;
   camera.position.copy(sh.pos).add(vec(k*.4,Math.sin(k*Math.PI)*.25,-k*.8+shake));
   camera.fov=sh.fov;camera.lookAt(sh.aim.clone().add(vec(0,-k*.13,0)));
   camera.updateProjectionMatrix();
 }
 dispose(){this.ships.forEach(s=>s.dispose());}
}
const World:React.FC=()=>{
 const f=useCurrentFrame();
 const {scene,camera}=useThree();
 const field=useMemo(()=>new Battlefield(),[]);
 const fx=useMemo(()=>({
   ink:new InkPass(scene,camera as THREE.PerspectiveCamera),
   bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.13,
     luminanceThreshold:1.25,luminanceSmoothing:.21,mipmapBlur:true,levels:4,radius:.55}),
   tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
   grade:new GradeEffect(GRADES.day,.38)
 }),[scene,camera]);
 useEffect(()=>()=>{fx.ink.dispose();field.dispose()},[fx,field]);
 field.update(f,camera as THREE.PerspectiveCamera,scene);
 const post=useMemo(()=><EffectComposer multisampling={0}>
  <primitive object={fx.ink} dispose={null}/>
  <primitive object={fx.bloom} dispose={null}/>
  <primitive object={fx.tone} dispose={null}/>
  <primitive object={fx.grade} dispose={null}/>
 </EffectComposer>,[fx]);
 return <><primitive object={field.root} dispose={null}/>{post}</>;
};
function ScreenTitle({text,tag}:{text:string;tag?:string}){
 return <div style={{
   position:'absolute',bottom:160,left:34,right:34,textAlign:'center',
   color:'#fff5d6',fontWeight:900,fontFamily:'Arial, sans-serif',fontSize:46,
   textShadow:'0px 3px 2px #182d34, 0px 5px 10px #142426',
   letterSpacing:2
 }}>
   {tag&&<div style={{fontSize:19,fontWeight:700,letterSpacing:4,marginBottom:9}}>{tag}</div>}
   {text}
 </div>;
}
export const BachDang938:React.FC=()=>{
 const f=useCurrentFrame();const t=f/FPS;
 return <AbsoluteFill style={{background:'#142a35'}}>
  <ThreeCanvas width={720} height={1280} style={{width:720,height:1280}}
    dpr={.75} gl={{antialias:false,stencil:false}}
    camera={{fov:41,near:.1,far:300}}>
    <World/>
  </ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:'none',
    background:'linear-gradient(180deg, rgba(6,20,28,.16) 0%,transparent 26%,transparent 68%,rgba(6,18,24,.29) 100%)'}}/>
  {t<2.5&&<ScreenTitle text="BẠCH ĐẰNG" tag="NĂM 938 • NGÔ QUYỀN"/>}
  {t>12.2&&t<14.6&&<ScreenTitle text="NƯỚC TRIỀU RÚT" tag="BÃI CỌC NGẦM LỘ RA"/>}
  {t>21&&<ScreenTitle text="ĐẠI THẮNG BẠCH ĐẰNG" tag="NĂM 938"/>}
  <Audio src={staticFile('audio/bach-dang.wav')}/>
 </AbsoluteFill>;
};
