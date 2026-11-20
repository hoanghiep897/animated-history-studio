import React,{useMemo,useEffect,useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
// Reuse the actual 2D drawing API of the referenced animated-shorts repository.
import {Pen} from '../../../upstream/bridge/toon';

const FPS=24, smooth=(u:number)=>{let a=Math.max(0,Math.min(1,u));return a*a*(3-2*a);};
const rnd=(n:number)=>{const r=Math.sin(n*137.43)*43758.5453;return r-Math.floor(r);};
type Person='baker'|'woman'|'elder';

function drawPerson(kind:Person,phase:number,fast:boolean){
 const c=document.createElement('canvas');c.width=360;c.height=600;
 const ctx=c.getContext('2d')!;ctx.scale(.6,.6);const p=new Pen(ctx);p.ol=10;
 const skin=kind==='elder'?'#e8c09a':'#ffdbb4';
 const tunic=kind==='baker'?'#eee1bd':kind==='woman'?'#718a79':'#ac7955';
 const trim=kind==='baker'?'#6e8d7c':kind==='woman'?'#b95848':'#735342';
 const hair=kind==='elder'?'#70625b':kind==='woman'?'#543c3b':'#27222d';
 const swing=Math.sin(phase*2*Math.PI)*(fast?72:27);
 p.stroke([[265,718],[260-swing*.48,829],[252-swing,950]],31,'#292733');
 p.stroke([[324,717],[336+swing*.48,836],[337+swing,947]],31,'#292733');
 p.stroke([[229-swing,950],[276-swing,950]],23,'#684933');
 p.stroke([[321+swing,950],[370+swing,950]],23,'#684933');
 p.poly([[242,420],[356,420],[390,739],[200,739]],tunic,14);
 p.poly([[202,719],[389,720],[401,779],[195,779]],trim,11);
 p.line([[233,470],[200-12*(fast?1.6:1),558],[186-(fast?30:0),656]],skin,30);
 p.line([[364,469],[408+(fast?20:0),540],[394+(fast?35:0),649]],skin,30);
 p.ell(185-(fast?30:0),657,18,19,skin,7);p.ell(394+(fast?35:0),649,18,19,skin,7);
 p.ell(300,281,121,133,skin,15);
 p.poly([[180,272],[179,227],[197,173],[239,148],[273,160],[302,139],[345,158],[381,156],[419,208],[425,267],[398,239],[371,219],[342,231],[305,209],[267,218],[235,205],[210,243]],hair,9);
 if(kind==='woman')p.ell(406,296,39,46,hair,9);
 p.ell(259,287,7,10,'#292530',0);p.ell(338,287,7,10,'#292530',0);
 p.arc(300,340,27,fast?20:10,fast?188:15,fast?345:162,7,'#90534d');
 if(kind==='baker'){
   p.poly([[224,567],[375,567],[356,682],[245,681]],'#b77e4d',10);
   for(let i=0;i<4;i++)p.ell(252+i*31,568,21,15,'#dda760',5);
   for(let i=0;i<4;i++)p.stroke([[239,600+i*18],[360,600+i*18]],4,'#e1b37b');
 }
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function Actor({kind,x,z,t,fast,size=1}:{kind:Person;x:number;z:number;t:number;fast:boolean;size?:number}){
 const phase=(t*(fast?1.8:.7)+x*.2)%1;
 const texture=useMemo(()=>drawPerson(kind,phase,fast),[kind,phase,fast]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <sprite position={[x,1.4*size+Math.abs(Math.sin(phase*6.28))*.04,z]} scale={[1.45*size,2.55*size,1]}>
   <spriteMaterial map={texture} transparent alphaTest={.015} depthWrite={false} toneMapped={false}/>
 </sprite>;
}
function CameraRig({t}:{t:number}){
 const {camera}=useThree();
 useLayoutEffect(()=>{
   const f=smooth((t-9)/9),shake=t>7.9&&t<10.5?Math.sin(t*30)*.11:0;
   camera.position.set(2.7-f*.25+shake,8.5+f*.75,22.5+f*2.5);
   camera.lookAt(0,2.8,-5.2+f*1.8);camera.updateProjectionMatrix();
 },[camera,t]);return null;
}
const colors=['#db9b78','#ead0a0','#b97e63','#d8b283','#d59875'];
function House({side,row}:{side:-1|1;row:number}){
 const x=side*10.2,z=12-row*10,h=6+((row+3*side+20)%3)*1.25;
 const sideX=x-side*2.45,ry=side>0?-Math.PI/2:Math.PI/2;
 return <group>
   <mesh position={[x,h/2,z]}><boxGeometry args={[4.9,h,7.3]}/><meshLambertMaterial color={colors[(row+(side+1))%colors.length]}/></mesh>
   <mesh position={[x,h+.22,z]}><boxGeometry args={[5.5,.46,7.8]}/><meshLambertMaterial color="#aa684f"/></mesh>
   <mesh position={[x,h+.51,z]}><boxGeometry args={[5.1,.12,7.4]}/><meshLambertMaterial color="#e8c69b"/></mesh>
   <mesh position={[sideX,1.25,z+.9]} rotation={[0,ry,0]}><planeGeometry args={[1.6,2.5]}/><meshLambertMaterial side={THREE.DoubleSide} color="#604537"/></mesh>
   {[-1.6,1.7].map((dz,i)=><mesh key={i} position={[sideX,4.1,z+dz]} rotation={[0,ry,0]}>
      <planeGeometry args={[1.05,1.35]}/><meshLambertMaterial side={THREE.DoubleSide} color="#645c58"/>
   </mesh>)}
   {[0,1].map((i)=><group key={i} position={[sideX+side*.24,0,z-1.5+i*3.4]}>
     <mesh position={[0,2.2,0]}><cylinderGeometry args={[.19,.25,4.4,8]}/><meshLambertMaterial color="#e9d6b5"/></mesh>
     <mesh position={[0,4.5,0]}><boxGeometry args={[.62,.25,.62]}/><meshLambertMaterial color="#d9b78e"/></mesh>
   </group>)}
 </group>;
}
function Tree({i}:{i:number}){
 const x=(i%2?1:-1)*(5.4+rnd(i)*2),z=13-Math.floor(i/2)*11;
 return <group position={[x,0,z]}>
   <mesh position={[0,1.45,0]}><cylinderGeometry args={[.15,.25,2.9,7]}/><meshLambertMaterial color="#674833"/></mesh>
   {[0,1,2].map(j=><mesh key={j} position={[Math.sin(j+i)*.58,3.25+j*.3,Math.cos(j*2+i)*.5]}>
     <sphereGeometry args={[1.1-j*.12,9,7]}/><meshLambertMaterial color={['#64835b','#587954','#71915f'][j]}/>
   </mesh>)}
 </group>;
}
function Volcano({t}:{t:number}){
 const intensity=smooth((t-7.3)/3.8);
 return <group>
   <mesh position={[0,6.3,-76]}><coneGeometry args={[20,19,11,3]}/><meshLambertMaterial color="#696e70" flatShading/></mesh>
   {intensity>0&&Array.from({length:22},(_,i)=>{
     const u=i/21,wiggle=Math.sin(i*2.3+t*.2)*u*8;
     return <mesh key={i} position={[wiggle,14+(13+u*18)*intensity+u*9,-76]}>
       <sphereGeometry args={[(1.4+u*5)*intensity,10,8]}/>
       <meshLambertMaterial color={i%3?'#55545d':'#73717a'} transparent opacity={.5+u*.18} depthWrite={false}/>
     </mesh>;
   })}
   {intensity>0&&<pointLight color="#ff8747" intensity={intensity*17} position={[0,16,-72]} distance={50}/>}
 </group>;
}
function Environment({t}:{t:number}){
 const ash=smooth((t-12)/8);
 return <group>
  <mesh position={[0,-.11,-16]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[170,170]}/><meshLambertMaterial color={ash>.55?'#857d76':'#b7a082'}/>
  </mesh>
  <mesh position={[0,-.015,-10]}><boxGeometry args={[7,.05,90]}/><meshLambertMaterial color="#797c77"/></mesh>
  {Array.from({length:33},(_,i)=><mesh key={i} position={[i%2?1.6:-1.6,.018,16-i*1.5]}>
    <boxGeometry args={[2.85,.035,.075]}/><meshLambertMaterial color="#bcb0a2"/>
  </mesh>)}
  {Array.from({length:10},(_,i)=><House key={i} row={Math.floor(i/2)} side={i%2?1:-1}/>)}
  {Array.from({length:8},(_,i)=><Tree key={i} i={i}/>)}
  {Array.from({length:44},(_,i)=><mesh key={i} position={[(rnd(i*3)-.5)*20,.12,(rnd(i*3+7)-.5)*56]}>
    <boxGeometry args={[.08+rnd(i+2)*.36,.16,.1+rnd(i+3)*.3]}/><meshLambertMaterial color={i%3?'#957a6d':'#ba9f89'}/>
  </mesh>)}
  <Volcano t={t}/>
  {t>10&&Array.from({length:60},(_,i)=>{
    const y=((rnd(i+15)*13-(t-10)*(1+rnd(i)*.8))%13+13)%13;
    return <mesh key={i} position={[(rnd(i+30)-.5)*25,y+.3,(rnd(i+90)-.5)*28]}>
      <sphereGeometry args={[.03+rnd(i)*.04,5,5]}/><meshBasicMaterial color="#e7d9c9" opacity={.4+ash*.35} transparent/>
    </mesh>;
  })}
 </group>;
}
function Story({t}:{t:number}){
 const ash=smooth((t-10)/13),running=t>10;
 const roadZ=-3+(t<10?t*.18:1.8+(t-10)*.58);
 return <>
   <color attach="background" args={[new THREE.Color('#b0c9df').lerp(new THREE.Color('#76767e'),ash)]}/>
   <fog attach="fog" args={[ash>.5?'#86828a':'#bec7bd',17,120]}/>
   <ambientLight intensity={1.2-ash*.35} color="#f5e5d3"/>
   <directionalLight position={[12,26,10]} intensity={2.3-ash*.7} color={ash>.3?'#e7b2a1':'#fff1d7'}/>
   <CameraRig t={t}/><Environment t={t}/>
   <Actor kind="baker" x={Math.sin(t*.55)*.35} z={roadZ} t={t} fast={running} size={1.12}/>
   <Actor kind="woman" x={-1.7+Math.sin(t*.4)*.32} z={-5.5+(t>11?(t-11)*.51:0)} t={t} fast={t>11} size={.94}/>
   <Actor kind="elder" x={2.0+Math.sin(t*.3)*.4} z={-9+(t>12?(t-12)*.45:0)} t={t} fast={t>12} size={.87}/>
   {t>12&&Array.from({length:14},(_,i)=>{
     const age=(t*1.4+rnd(i)*3)%3;
     return <mesh key={i} position={[Math.sin(i*3)*4,.25+age*.21,-6+rnd(i*5)*12]}>
       <sphereGeometry args={[.2+age*.16,8,6]}/><meshBasicMaterial color="#dfd4c7" transparent opacity={(3-age)*.08} depthWrite={false}/>
     </mesh>;
   })}
 </>;
}
export const Pompeii:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),t=frame/FPS;
 const flash=t>8.3&&t<8.7?.22*Math.sin((t-8.3)*Math.PI/.4):0;
 return <AbsoluteFill style={{background:'#b0c9df'}}>
    <ThreeCanvas width={width} height={height} orthographic={false}
      camera={{fov:53,near:.1,far:230,position:[11,9,19]}} style={{width,height}}>
      <Story t={t}/>
    </ThreeCanvas>
    {flash>0&&<AbsoluteFill style={{background:'#ffebc8',opacity:flash,pointerEvents:'none'}}/>}
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(19,21,34,.06),transparent 28%,transparent 70%,rgba(20,20,30,.25))'}}/>
    <Audio src={staticFile('audio/pompeii.wav')}/>
 </AbsoluteFill>;
};
