import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {PompeiiAdapted} from './PompeiiAdapted';

const Scene:React.FC=()=>{
 const {scene,camera}=useThree();
 scene.background=new THREE.Color('#4d8ed8');
 camera.position.set(1.5,3,10);camera.lookAt(0,0,0);
 return <>
  <ambientLight intensity={2}/>
  <mesh position={[0,0,0]}>
    <boxGeometry args={[4,4,1]}/><meshBasicMaterial color="#fe3322"/>
  </mesh>
  <mesh position={[0,-2,1]}>
    <sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#24ff64"/>
  </mesh>
 </>;
};
export const VisualDebug:React.FC=()=>(
  <AbsoluteFill style={{background:'#000'}}>
    <ThreeCanvas width={720} height={1280} style={{width:720,height:1280}}
      camera={{fov:45,near:.1,far:100,position:[0,0,12]}}>
      <Scene/>
    </ThreeCanvas>
  </AbsoluteFill>
);
