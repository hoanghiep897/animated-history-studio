import React from 'react';
import {Composition} from 'remotion';
import {Pompeii} from './videos/pompeii/Pompeii';
import {BridgeWithMusic} from './videos/bridge/BridgeWithMusic';
import {BRIDGE_FRAMES} from '../upstream/bridge/Bridge';
import {PompeiiAdapted,PompeiiAdaptedNoFx,PompeiiInk,PompeiiTone,PompeiiGrade,PompeiiLens,FPS,DURATION} from './videos/pompeii-adapted/PompeiiAdapted';
import {VisualDebug} from './videos/pompeii-adapted/Debug';
import {BachDang938,FPS as BD_FPS,DURATION as BD_SEC} from './videos/bach-dang/BachDang938';
import {BachDangExtended,FPS as EX_FPS,DURATION as EX_SEC} from './videos/bach-dang/BachDangExtended';
import {BachDangV4,FPS as V4_FPS,DURATION as V4_SEC} from './videos/bach-dang/BachDangV4';

export const Root: React.FC = () => (<>
  <Composition id="PompeiiShort" component={Pompeii} durationInFrames={576} fps={24} width={720} height={1280}/>
  <Composition id="BridgeTemplate" component={BridgeWithMusic} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920}/>
  <Composition id="PompeiiAdapted" component={PompeiiAdapted} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="PompeiiNoFx" component={PompeiiAdaptedNoFx} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="PompeiiInk" component={PompeiiInk} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="PompeiiTone" component={PompeiiTone} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="PompeiiGrade" component={PompeiiGrade} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="PompeiiLens" component={PompeiiLens} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
  <Composition id="BachDang938" component={BachDang938} durationInFrames={BD_FPS*BD_SEC} fps={BD_FPS} width={720} height={1280}/>
  <Composition id="BachDangExtended" component={BachDangExtended} durationInFrames={EX_FPS*EX_SEC} fps={EX_FPS} width={720} height={1280}/>
  <Composition id="BachDangV4" component={BachDangV4} durationInFrames={V4_FPS*V4_SEC} fps={V4_FPS} width={720} height={1280}/>
  <Composition id="VisualDebug" component={VisualDebug} durationInFrames={25} fps={25} width={720} height={1280}/>
</>);
