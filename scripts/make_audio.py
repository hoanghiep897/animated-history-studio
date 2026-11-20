#!/usr/bin/env python3
"""Deterministic original score/SFX; standard library only. 24 seconds, stereo, PCM WAV."""
import math, random, struct, wave
from pathlib import Path

SR, DUR = 22050, 24.0
N = int(SR * DUR)
random.seed(79)
out = Path("public/audio/pompeii.wav")
out.parent.mkdir(parents=True, exist_ok=True)

# D minor strings, atmospheric hand-composed short motif with rumble, ash and impact.
notes = [(0.0,2.8,146.83),(2.8,2.3,174.61),(5.1,2.5,220.0),
         (7.6,2.2,196.0),(9.8,2.8,146.83),(12.6,2.5,130.81),
         (15.1,3.0,174.61),(18.1,3.0,146.83),(21.1,2.9,110.0)]
chords = [(0, [146.83, 174.61, 220.0]), (7.7,[130.81,174.61,196.0]),
          (14.0,[116.54,146.83,174.61]), (20.0,[110.0,146.83,220.0])]
sound = bytearray()
for i in range(N):
    t = i / SR
    val = 0.0
    for start, length, freq in notes:
        if start <= t < start + length:
            r = (t-start)/length
            env = min(1.0, (t-start)*3.5) * (1-r)**1.5
            val += .13 * env * (math.sin(2*math.pi*freq*t) +
                     .35*math.sin(2*math.pi*freq*2*t) + .17*math.sin(2*math.pi*freq*3*t))
    for st, fs in chords:
        if st <= t < st+8:
            env = min(1, (t-st)/1.5)*min(1, (st+8-t)/1.5)
            val += .025 * env * sum(math.sin(2*math.pi*f*t+.6*j) for j,f in enumerate(fs))
    if t >= 7.8:
        val += .05*math.sin(2*math.pi*(42+8*math.sin(.17*t))*t)*min(1, (t-7.8)/3)
    if t >= 10:
        val += .012 * random.uniform(-1,1) * min(1,(t-10)/5)
    for hit in [4.5,7.9,10.0,12.3,16.1,19.0,22.1]:
        z=t-hit
        if 0 <= z <= .7:
            val += (0.14*math.sin(2*math.pi*(65-44*z)*z) + .065*random.uniform(-1,1))*math.exp(-9*z)
    # fade in/out
    val *= min(1,t/0.6,max(0.0,(DUR-t)/1.1))
    val=max(-.95,min(.95,val))
    l=int(val*28000)
    r=int((val*.97 + .009*math.sin(2*math.pi*3*t)*val)*28000)
    sound += struct.pack('<hh',l,r)
with wave.open(str(out),'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(sound)
print(f"Wrote {out}: {DUR}s, {len(sound)} bytes")
