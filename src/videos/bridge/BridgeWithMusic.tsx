import React from 'react';
import {AbsoluteFill,Audio,staticFile} from 'remotion';
import {BridgeShort} from '../../../upstream/bridge/Bridge';

/** Original upstream film template, unchanged. Only a separate, original music bed is added. */
export const BridgeWithMusic: React.FC = () => (
  <AbsoluteFill>
    <BridgeShort/>
    <Audio src={staticFile('audio/bridge.wav')} volume={0.48}/>
  </AbsoluteFill>
);
