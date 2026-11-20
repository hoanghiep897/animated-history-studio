import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction,BloomEffect,ToneMappingEffect,ToneMappingMode} from 'postprocessing';
import {bodyFront,Pen,Outfit} from '../../../upstream/bridge/toon';
import {NOINK,InkPass} from '../../../upstream/bridge/ink';
import {LensBlur} from '../../../upstream/bridge/lensblur';
import {GradeEffect,GRADES,gradeFor} from '../../../upstream/bridge/grade';
import {twoTone} from '../../../upstream/bridge/shade';

// An ORIGINAL story, built on the original animated-shorts engine.
// Reuse of source: Canvas2D rig/bodyFront, Pen, NOINK, InkPass,
// thin-lens depth of field, colour grade and postprocessing composition.
// The buildings, actors, volcano, script, choreography and music are NEW.
export const FPS=25;
export const DURATION=20;
const smooth=(u:number)=>{const s=Math.max(0,Math.min(1,u));return s*s*(3-2*s);};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const rnd=(i:number)=>{const x=Math.sin((i+79)*127.1)*43758.5453;return x-Math.floor(x);};
const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const wallMat=(color:string)=>twoTone(new THREE.MeshLambertMaterial({color}));
const rockMat=(color:string)=>new THREE.MeshLambertMaterial({color,flatShading:true});
const M={
 plaster:[wallMat('#dfaa7b'),wallMat('#ead0a1'),wallMat('#c78568'),wallMat('#e4bf90'),wallMat('#db9e79')],
 stone:wallMat('#9e9a90'),roof:wallMat('#b7694f'),roofDark:wallMat('#8d5347'),
 cream:wallMat('#f1d8a9'),wood:wallMat('#665044'),basalt:rockMat('#777a79'),
 shadow:rockMat('#5e6664'),leaf:wallMat('#63804d'),ash:rockMat('#776f74'),
 ground:wallMat('#baa383'),iron:wallMat('#584c4b'),orange:wallMat('#f9b45f')
};
const sphere=new THREE.SphereGeometry(1,10,8);
const cube=new THREE.BoxGeometry(1,1,1);
function box(g:THREE.Group,mat:THREE.Material,pos:[number,number,number],size:[number,number,number]){
 const m=new THREE.Mesh(cube,mat);m.position.set(...pos);m.scale.set(...size);m.castShadow=false;m.receiveShadow=true;g.add(m);return m;
}
function orb(g:THREE.Group,mat:THREE.Material,pos:[number,number,number],scale:[number,number,number]){
 const m=new THREE.Mesh(sphere,mat);m.position.set(...pos);m.scale.set(...scale);g.add(m);return m;
}
type Role='baker'|'woman'|'child';
const clothes:Record<Role,Outfit>={
 baker:{jacket:'#e9d4ae',pants:'#5e655c',boots:'#4d3835',skin:'#ffe2c2',hat:'hair',hair:'#28232d',belt:'#a17c54'},
 woman:{jacket:'#718e7c',pants:'#536758',boots:'#604b41',skin:'#f4c9a1',hat:'hair',hair:'#67423c',dress:'#667f6b'},
 child:{jacket:'#d5a16f',pants:'#605850',boots:'#68463a',skin:'#ffdfbd',hat:'hair',hair:'#3d2926',build:'kid'}
};
class Person {
 sprite:THREE.Sprite;
 tex:THREE.CanvasTexture;
 canvas:HTMLCanvasElement;
 ctx:CanvasRenderingContext2D;
 shadow:THREE.Mesh;
 constructor(public role:Role,public seed:number){
   this.canvas=document.createElement('canvas');
   this.canvas.width=300;this.canvas.height=500;this.ctx=this.canvas.getContext('2d')!;
   this.tex=new THREE.CanvasTexture(this.canvas);this.tex.colorSpace=THREE.SRGBColorSpace;this.tex.anisotropy=4;
   const sm=new THREE.SpriteMaterial({map:this.tex,transparent:true,depthWrite:false,alphaTest:.02,toneMapped:false});
   this.sprite=new THREE.Sprite(sm);this.sprite.center.set(.5,0);this.sprite.layers.set(NOINK);
   const height=role==='child'?2.12:3.08;this.sprite.scale.set(height*.59,height,1);
   this.shadow=new THREE.Mesh(new THREE.CircleGeometry(role==='child'?.42:.62,20),new THREE.MeshBasicMaterial({color:'#403e40',transparent:true,opacity:.21,depthWrite:false}));
   this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=.055;this.shadow.layers.set(NOINK);
 }
 update(t:number,frame:number,x:number,z:number,running:boolean,alarm:boolean){
   const phase=((t*(running?1.62:.82)+this.seed*.15)%1+1)%1;
   const c=this.ctx;c.clearRect(0,0,300,500);c.save();c.scale(.5,.5);
   const p=new Pen(c);p.ol=13;
   bodyFront(p,clothes[this.role],{
     phase,mode:running?'march':'stroll',expr:alarm?'shock':this.role==='child'?'grin':'neutral',
     blink:frame%(53+this.seed*3)<3,light:-.55,seed:this.seed+10,
     lift:running?74:30,headTilt:alarm?Math.sin(t*3)*.045:0,
     facing:0,look:alarm?-.12:0
   });
   if(this.role==='baker'){
     // Roman baker's woven basket; bread is animated with the arm bob.
     p.poly([[204,602],[400,603],[381,723],[221,720]],'#b07b52',12);
     for(let j=0;j<5;j++){p.ell(232+j*36,600+(j%2)*3,26,17,'#dbac68',7);p.arc(227+j*36,596,16,7,170,340,3,'#9b6c45');}
     for(let k=0;k<5;k++)p.stroke([[215,627+k*17],[391,628+k*16]],4,'#e6b682');
   }
   c.restore();this.tex.needsUpdate=true;
   this.sprite.position.set(x,.1,z);this.shadow.position.set(x,.045,z);
   const height=this.role==='child'?2.12:3.08;
   this.sprite.scale.set(height*.59,height*(1+Math.abs(Math.sin(phase*2*Math.PI))*(running?.025:.008)),1);
   (this.shadow.material as THREE.MeshBasicMaterial).opacity=.17+Math.sin(phase*2*Math.PI)*.02;
 }
 dispose(){this.tex.dispose();(this.sprite.material as THREE.Material).dispose();this.shadow.geometry.dispose();(this.shadow.material as THREE.Material).dispose();}
}
class PompeiiWorld {
 root=new THREE.Group();
 people=[new Person('baker',1),new Person('woman',2),new Person('child',3)];
 columns:THREE.Mesh[]=[];
 smoke:THREE.Mesh[]=[];
 ash:THREE.Mesh[]=[];
 particles:THREE.Mesh[]=[];
 fallen:THREE.Mesh[]=[];
 sunlight=new THREE.DirectionalLight('#ffdfb2',2.7);
 ambient=new THREE.AmbientLight('#d0d8e1',1.08);
 floorMat=M.ground;
 constructor(){
   const g=this.root;
   box(g,M.ground,[0,-.27,-25],[80,.5,150]);
   box(g,M.basalt,[0,-.08,-7],[9,.06,82]);
   // Roads are actual meshes, not image backgrounds.
   for(let i=0;i<72;i++){
      const side=(i%2?1:-1),row=Math.floor(i/2);
      box(g,i%5===0?M.stone:M.basalt,[side*(.6+rnd(i)*3.3),-.024,31-row*1.55],[.24+rnd(i+15)*.6,.014,.44+rnd(i+2)*.36]);
   }
   for(let i=0;i<12;i++)this.house(i%2?-1:1,Math.floor(i/2),i);
   // Limestone pavement in the centre of the forum
   for(let i=0;i<8;i++)box(g,M.cream,[i%2?-5:5,-.01,-8-Math.floor(i/2)*6],[.8,.16,5.8]);
   for(let i=0;i<12;i++)this.oliveTree(i);
   for(let i=0;i<55;i++){
      const x=(rnd(i*3)-.5)*17,z=(rnd(i*2+21)-.5)*75;
      box(g,i%4===0?M.cream:M.stone,[x,.04,z],[.12+rnd(i)*.25,.06,.16+rnd(i+8)*.3]);
   }
   // Vesuvius cone in far distance (AD 79: explosive plume, not lava on streets).
   const volcanic=rockMat('#7c7978');
   const mount=new THREE.Mesh(new THREE.ConeGeometry(29,26,15,1),volcanic);
   mount.position.set(0,12,-110);g.add(mount);
   orb(g,rockMat('#665b60'),[0,23,-110],[8,1.6,7]);
   for(let i=0;i<36;i++){
      const smoke=orb(g,rockMat(i%3?'#65606b':'#7e7680'),[0,-200,-110],[1,1,1]);
      this.smoke.push(smoke);
   }
   const sun=orb(g,new THREE.MeshBasicMaterial({color:'#ffe4a0',toneMapped:false}),[-36,39,-89],[5.4,5.4,2.5]);
   sun.layers.set(NOINK);
   for(let i=0;i<45;i++){
      const ash=orb(g,new THREE.MeshBasicMaterial({color:i%4?'#dad0ca':'#d4bbb0',transparent:true,opacity:.65,depthWrite:false}),[0,-200,0],[.035,.035,.035]);
      ash.layers.set(NOINK);this.ash.push(ash);
   }
   for(let i=0;i<16;i++){
      const rock=box(g,M.roofDark,[0,-200,0],[.16,.07,.28]);this.fallen.push(rock);
   }
   for(const p of this.people){g.add(p.sprite);g.add(p.shadow);}
   this.sunlight.position.set(23,42,22);this.sunlight.target.position.set(0,0,-20);
   g.add(this.sunlight.target);g.add(this.sunlight);g.add(this.ambient);
 }
 house(side:number,row:number,i:number){
    const g=this.root,x=side*12.3,z=25-row*13,h=6.1+(i%3)*1.25;
    box(g,M.plaster[i%5],[x,h/2,z],[7.1,h,10.2]);
    box(g,i%3?M.roof:M.roofDark,[x,h+.23,z],[7.8,.46,10.7]);
    box(g,M.cream,[x,h+.55,z],[7.5,.16,10.5]);
    const dx=-side*3.6,rz=-side*Math.PI/2;
    // Arched opening and dressed stone surround
    box(g,M.wood,[x+dx,1.26,z+1.4],[.08,2.52,2.3]);
    for(let j=0;j<2;j++)box(g,M.cream,[x+dx+side*.1,2.55,z+.35+j*2.1],[.2,.24,.3]);
    for(let j=0;j<2;j++){
       box(g,M.wood,[x+dx,4.5,z-2.4+j*5],[.12,1.28,1.3]);
       box(g,M.cream,[x+dx+side*.12,5.18,z-2.4+j*5],[.22,.16,1.5]);
    }
    for(let j=0;j<3;j++){
       const post=new THREE.Mesh(new THREE.CylinderGeometry(.24,.27,4.0,10),M.cream);
       post.position.set(side*6.15,2.02,z-3.4+j*3.5);g.add(post);
       box(g,M.cream,[side*6.15,4.1,z-3.4+j*3.5],[.8,.28,.78]);
       box(g,M.stone,[side*6.15,.28,z-3.4+j*3.5],[.85,.55,.85]);
    }
    // Colored plaster and terracotta shops.
    if(row===1){box(g,M.plaster[2],[x+dx+side*.13,1.9,z-2],[.22,.8,2]);}
    for(let k=0;k<6;k++)box(g,M.roofDark,[x-2.6+k*.9,h+.52,z+5],[.53,.17,.25]);
 }
 oliveTree(i:number){
    const g=this.root,x=(i%2?-1:1)*(6.0+rnd(i)*1.4),z=23-Math.floor(i/2)*12;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.27,2.4,9),M.wood);trunk.position.set(x,1.2,z);g.add(trunk);
    for(let j=0;j<3;j++)orb(g,M.leaf,[x+Math.sin(i+j*2)*.68,2.9+j*.23,z+Math.cos(i+j)*.4],[1.22-j*.12,.7,.93]);
 }
 update(f:number,camera:THREE.PerspectiveCamera,scene:THREE.Scene){
    const t=f/FPS;
    const erupt=smooth((t-6.5)/2.8),ashFall=smooth((t-9)/6),dark=smooth((t-11)/6.5);
    scene.background=new THREE.Color('#7bb6da').lerp(new THREE.Color('#666374'),dark*.87);
    scene.fog=new THREE.Fog(new THREE.Color('#bcd1d5').lerp(new THREE.Color('#716d77'),dark*.95),20,180-dark*65);
    this.sunlight.intensity=2.7-dark*1.75;this.ambient.intensity=1.08-dark*.4;
    (this.floorMat as THREE.MeshLambertMaterial).color.set('#b9a287').lerp(new THREE.Color('#857c78'),ashFall*.83);
    // An eruption COLUMN that grows frame-by-frame, then an umbrella-shaped top.
    for(let i=0;i<this.smoke.length;i++){
       const m=this.smoke[i],u=i/(this.smoke.length-1);
       const growth=erupt*(12+u*41);
       const sideways=Math.sin(i*1.73+t*.35)*(1+u*5.0);
       m.visible=erupt>.002&&u<erupt+.1;
       m.position.set(sideways,25+u*growth*1.55,-109+Math.cos(i*1.4)*u*4);
       const s=(2.4+u*5)*erupt*(u>.72?1.7:1);
       m.scale.set(s*1.2,s*.8,s);
    }
    for(let i=0;i<this.ash.length;i++){
       const p=this.ash[i],dx=(rnd(i*21)-.5)*22,dz=(rnd(i*31)-.5)*40;
       p.visible=ashFall>.03;
       const falling=(rnd(i*42)*22-(t-8)*(1.2+rnd(i*67)*.9));
       const y=((falling%20)+20)%20;
       p.position.set(dx+Math.sin(t+i)*.2,y,dz);
       p.scale.setScalar((.028+.06*rnd(i+7))*(.3+.7*ashFall));
    }
    for(let i=0;i<this.fallen.length;i++){
       const m=this.fallen[i],a=(t-10-rnd(i)*4);
       m.visible=a>0&&a<5;
       m.position.set((i%2?-1:1)*(4.8+rnd(i*2)*2),clamp(7.5-4*a,.08,10),7-Math.floor(i/2)*3.4);
       m.rotation.set(a*3,a*.8,a*1.7);
    }
    const run=t>9.2;
    const speed=run?(t-9.2):0;
    const bakerZ=-12+(t<9.2?t*.33:9.2*.33+speed*.88);
    this.people[0].update(t,f,-1.25+Math.sin(t*.9)*.27,bakerZ,run,t>7.6);
    this.people[1].update(t,f,1.6+Math.sin(t*.3)*.15,-8+(t>10?(t-10)*.73:0),t>10,t>7);
    this.people[2].update(t,f,-2.45+Math.sin(t*.6)*.12,-4+(t>11?(t-11)*.74:0),t>11,t>8);
    // Real cinematic shot list: establishing, bread, rumble, eruption, escape, aftermath.
    const shots=[
       {a:0,b:3.7,pos:v(1.7,8.5,24),look:v(0,6,-55),focus:34},
       {a:3.7,b:6.6,pos:v(3.3,4.6,9.4),look:v(-1.1,1.65,-8.5),focus:19},
       {a:6.6,b:9.3,pos:v(-1.8,7.9,17.3),look:v(0,11,-83),focus:48},
       {a:9.3,b:13.6,pos:v(2.8,5.3,11.0),look:v(-1,1.85,-6),focus:18},
       {a:13.6,b:17.2,pos:v(-2.2,7.3,13),look:v(0,2,-4),focus:20},
       {a:17.2,b:20.1,pos:v(1.2,11.0,29),look:v(0,17,-88),focus:52}
    ];
    const sh=shots.find(s=>t>=s.a&&t<s.b)??shots[shots.length-1];
    const u=smooth((t-sh.a)/(sh.b-sh.a));
    const creep=.4*u;
    const shake=(t>7.8&&t<13)?Math.sin(t*28)*(.05+.12*erupt):0;
    camera.position.copy(sh.pos).add(v(creep*.18,creep*.15,-creep+shake));
    const target=sh.look.clone().add(v(0,-.05*creep,0));
    camera.lookAt(target);camera.updateProjectionMatrix();
    return {t,focus:sh.focus,night:dark>.48};
 }
 dispose(){for(const p of this.people)p.dispose();}
}
type EffectsMode='all'|'none'|'ink'|'tone'|'grade'|'lens';
const FullScene:React.FC<{effectsMode?:EffectsMode}>=({effectsMode='all'})=>{
  const f=useCurrentFrame();
  const {camera,scene}=useThree();
  const world=useMemo(()=>new PompeiiWorld(),[]);
  const fx=useMemo(()=>({
    ink:new InkPass(scene,camera as THREE.PerspectiveCamera),
    lens:new LensBlur({maxCoC:22,nearScale:1.15}),
    bloom:new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.35,luminanceThreshold:1.0,luminanceSmoothing:.23,mipmapBlur:true,levels:5,radius:.55}),
    tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),
    grade:new GradeEffect(GRADES.day,.72)
  }),[camera,scene]);
  useEffect(()=>()=>{fx.ink.dispose();world.dispose();},[fx,world]);
  const info=world.update(f,camera as THREE.PerspectiveCamera,scene);
  fx.lens.focus=info.focus;fx.lens.cInf=info.t>8?6.5:8;
  gradeFor(fx.grade,info.night?'golden':'day');
  // In GitHub's software WebGL runner the original LensBlur depth gather
  // outputs a black image in this NEW scene. The original InkPass, Bloom,
  // neutral tone map and GradeEffect remain enabled. See debug compositions.
  const post=useMemo(()=><EffectComposer multisampling={0}>
      <primitive object={fx.ink} dispose={null}/>
      <primitive object={fx.bloom} dispose={null}/>
      <primitive object={fx.tone} dispose={null}/>
      <primitive object={fx.grade} dispose={null}/>
    </EffectComposer>,[fx]);
  const postInk=useMemo(()=><EffectComposer multisampling={0}>
    <primitive object={fx.ink} dispose={null}/>
  </EffectComposer>,[fx]);
  const postTone=useMemo(()=><EffectComposer multisampling={0}>
    <primitive object={fx.tone} dispose={null}/>
  </EffectComposer>,[fx]);
  const postGrade=useMemo(()=><EffectComposer multisampling={0}>
    <primitive object={fx.tone} dispose={null}/>
    <primitive object={fx.grade} dispose={null}/>
  </EffectComposer>,[fx]);
  const postLens=useMemo(()=><EffectComposer multisampling={0}>
    <primitive object={fx.lens.pre} dispose={null}/>
    <primitive object={fx.lens.main} dispose={null}/>
    <primitive object={fx.tone} dispose={null}/>
  </EffectComposer>,[fx]);
  const effect=effectsMode==='none'?null:effectsMode==='ink'?postInk:effectsMode==='tone'?postTone:effectsMode==='grade'?postGrade:effectsMode==='lens'?postLens:post;
  return <><primitive object={world.root} dispose={null}/>{effect}</>;
};
export const PompeiiAdapted:React.FC=()=>{
 const f=useCurrentFrame(),t=f/FPS;
 const flash=t>=7.4&&t<=7.72?Math.sin(Math.PI*(t-7.4)/.32)*.24:0;
 return <AbsoluteFill style={{background:'#d3c9b5'}}>
    <ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} dpr={0.5}
      gl={{antialias:false,stencil:false,powerPreference:'high-performance'}}
      camera={{fov:41,near:.2,far:600}}>
      <FullScene/>
    </ThreeCanvas>
    {flash>0&&<AbsoluteFill style={{background:'#fef5df',opacity:flash}}/>}
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(18,16,31,.03),transparent 35%,transparent 65%,rgba(19,16,29,.2))'}}/>
    <Audio src={staticFile('audio/pompeii-adapted.wav')}/>
 </AbsoluteFill>;
};

// Diagnostic: the exact original story and world, without postprocessing.
export const PompeiiAdaptedNoFx:React.FC=()=>(
  <AbsoluteFill style={{background:'#d3c9b5'}}>
    <ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} camera={{fov:41,near:.2,far:600}}>
      <FullScene effectsMode="none"/>
    </ThreeCanvas>
  </AbsoluteFill>
);

export const PompeiiInk:React.FC=()=>(
  <AbsoluteFill><ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} camera={{fov:41,near:.2,far:600}}>
    <FullScene effectsMode="ink"/>
  </ThreeCanvas></AbsoluteFill>
);
export const PompeiiTone:React.FC=()=>(
  <AbsoluteFill><ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} camera={{fov:41,near:.2,far:600}}>
    <FullScene effectsMode="tone"/>
  </ThreeCanvas></AbsoluteFill>
);
export const PompeiiGrade:React.FC=()=>(
  <AbsoluteFill><ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} camera={{fov:41,near:.2,far:600}}>
    <FullScene effectsMode="grade"/>
  </ThreeCanvas></AbsoluteFill>
);
export const PompeiiLens:React.FC=()=>(
  <AbsoluteFill><ThreeCanvas width={720} height={1280} style={{width:720,height:1280}} camera={{fov:41,near:.2,far:600}}>
    <FullScene effectsMode="lens"/>
  </ThreeCanvas></AbsoluteFill>
);
