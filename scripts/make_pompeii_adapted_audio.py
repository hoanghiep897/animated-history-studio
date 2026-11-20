#!/usr/bin/env python3
"""Original 20s cinematic score & synchronised sounds for Pompeii (AD 79).
No music samples, paid services or external API. PCM stereo WAV, deterministic.
"""
import math,random,struct,wave
from pathlib import Path
SR=22050
DUR=20
random.seed(79)
OUT=Path("public/audio/pompeii-adapted.wav")
OUT.parent.mkdir(parents=True,exist_ok=True)
N=int(SR*DUR)
# D minor, 87 BPM: warm life in town -> tectonic pulse -> ash -> escape -> silence.
theme=[(0,2.2,293.66),(2.2,2.0,349.23),(4.2,2.2,392.0),
       (6.4,1.9,329.63),(8.3,2.0,293.66),(10.3,2.0,261.63),
       (12.3,2.1,233.08),(14.4,2.1,220.0),(16.5,3.2,146.83)]
data=bytearray()
for i in range(N):
    t=i/SR
    val=0.0
    for st,l,f in theme:
        if st<=t<st+l:
            u=(t-st)/l
            a=min(1,(t-st)*6)*(1-u)**1.25
            # bell/flute lead for original story score
            val+=.105*a*(math.sin(2*math.pi*f*t)+.29*math.sin(4*math.pi*f*t)+.13*math.sin(6*math.pi*f*t))
    # Dm / Bb / Gm / A minor held chords
    fs=[[146.83,174.61,220],[116.54,146.83,174.61],[98,146.83,196],[110,164.81,220]][int(t/5)%4]
    val+=.015*sum(math.sin(2*math.pi*f*t) for f in fs)
    if t>5.6:
        z=t-5.6
        val+=min(.16,.03+z*.013)*math.sin(2*math.pi*(47+4*math.sin(t*.21))*t)
        val+=.017*random.uniform(-1,1)*min(1,z/3)
    if t>=9:
        # ash patter, light intermittent pebble impacts
        val+=.016*random.uniform(-1,1)*(0.4+0.6*abs(math.sin(t*16.4)))
    for hit in (6.8,7.5,8.3,10.2,12.4,14.1,16.0):
        dt=t-hit
        if 0<dt<1.1:
            val+=(0.16*math.sin(2*math.pi*(73-44*dt)*dt)+.08*random.uniform(-1,1))*math.exp(-7.0*dt)
    # wooden cart wheels / footsteps
    for beat in (2.1,3.1,4.0,4.6,5.4,11.0,11.5,12,12.5,13.0,13.5,14.0,14.5,15.0,15.5):
        dt=t-beat
        if 0<dt<.12:
            val+=.055*random.uniform(-1,1)*math.exp(-dt*40)
    val*=min(1,t/0.7,max(0,(DUR-t)/1.1))
    val=max(-.9,min(.9,val))
    pan=.032*math.sin(t*.4)
    data.extend(struct.pack('<hh',int(val*(1-pan)*27000),int(val*(1+pan)*27000)))
with wave.open(str(OUT),"wb") as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(data)
print(OUT, "20 seconds",len(data),"PCM stereo")
