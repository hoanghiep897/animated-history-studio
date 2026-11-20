import React from 'react';
import {Composition} from 'remotion';
import {Pompeii} from './videos/pompeii/Pompeii';
import {BridgeWithMusic} from './videos/bridge/BridgeWithMusic';
import {BRIDGE_FRAMES} from '../upstream/bridge/Bridge';

export const Root: React.FC = () => (<>
  <Composition id="PompeiiShort" component={Pompeii} durationInFrames={576} fps={24} width={720} height={1280}/>
  {/* Exact original BridgeShort visual engine; only external soundtrack is added. */}
  <Composition id="BridgeTemplate" component={BridgeWithMusic} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920}/>
</>);
