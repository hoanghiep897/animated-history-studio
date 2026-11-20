import React from 'react';
import {Composition} from 'remotion';
import {Pompeii} from './videos/pompeii/Pompeii';
export const Root: React.FC = () => (<>
  <Composition id="PompeiiShort" component={Pompeii} durationInFrames={576} fps={24} width={720} height={1280}/>
</>);
