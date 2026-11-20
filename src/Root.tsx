import React from 'react';
import {Composition} from 'remotion';
import {Pompeii} from './videos/pompeii/Pompeii';
import {BridgeWithMusic} from './videos/bridge/BridgeWithMusic';
import {BRIDGE_FRAMES} from '../upstream/bridge/Bridge';
import {PompeiiAdapted,FPS,DURATION} from './videos/pompeii-adapted/PompeiiAdapted';

export const Root: React.FC = () => (<>
  <Composition id="PompeiiShort" component={Pompeii} durationInFrames={576} fps={24} width={720} height={1280}/>
  <Composition id="BridgeTemplate" component={BridgeWithMusic} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920}/>
  <Composition id="PompeiiAdapted" component={PompeiiAdapted} durationInFrames={FPS*DURATION} fps={FPS} width={720} height={1280}/>
</>);
