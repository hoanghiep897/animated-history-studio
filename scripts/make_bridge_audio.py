#!/usr/bin/env python3
"""Generate a new instrumental march for testing the upstream template; no voiceover or proprietary samples."""
import math
import struct
import wave
from pathlib import Path

SR=16000
DURATION=67.5
BPM=116
BEAT=60/BPM
BAR=BEAT*4
PATH=Path("public/audio/bridge.wav")
PATH.parent.mkdir(parents=True,exist_ok=True)

notes=[293.66,329.63,349.23,392.00,440.00,392.00,349.23,329.63,
       293.66,261.63,293.66,349.23,329.63,293.66,261.63,220.00]
samples=bytearray()
for k in range(int(SR*DURATION)):
    t=k/SR
    q=t/BEAT
    idx=int(q*.5)%len(notes)
    f=notes[idx]
    local=(q*.5)%1.0
    env=min(1,local*18)*max(0,1-local)**1.1
    # fife-like melody and lower rhythmic brass
    melody=(math.sin(2*math.pi*f*t)+0.27*math.sin(2*math.pi*2*f*t))*.09*env
    bassf=[146.83,174.61,130.81,110.0][int(t/(BAR*2))%4]
    bass=(math.sin(2*math.pi*bassf*t)+.23*math.sin(2*math.pi*2*bassf*t))*.065
    beat=q%1
    drum=.10*math.exp(-beat*22)*math.sin(2*math.pi*(66-35*min(.3,beat))*t)
    value=(melody+bass+drum)*min(1,t/1.6,(DURATION-t)/2.0)
    value=max(-.85,min(.85,value))
    v=int(value*27500)
    samples.extend(struct.pack('<hh',v,v))
with wave.open(str(PATH),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(samples)
print(f"Created {PATH}")
