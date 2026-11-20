#!/usr/bin/env python3
"""Original stereo score and Foley — Bạch Đằng 938 extended (48 seconds).
All tones / noise synthesized deterministically. No copyrighted music samples.
Output is a PCM WAV in Remotion's public folder.
"""
import math, random, struct, wave
from pathlib import Path

SR=22050
DURATION=48
OUT=Path("public/audio/bach-dang-extended.wav")
OUT.parent.mkdir(parents=True,exist_ok=True)
random.seed(93848)
samples=bytearray()
# New pentatonic-like motif, original to this short, in D minor colours.
lead=[
 (0,.9,293.66),(1.3,.9,349.23),(2.5,1.1,392),(4.1,1,440),
 (6.2,.9,349.23),(7.5,.9,293.66),(9,1.2,261.63),
 (10.8,.9,293.66),(12.2,.9,392),(13.7,.8,440),
 (15.1,.9,392),(16.5,1.5,349.23),
 (18.6,1.7,293.66),(21.0,1.6,261.63),
 (24.0,.8,220),(25.5,1.1,261.63),(28.5,1.3,293.66),
 (31.5,1.5,261.63),(34,1.8,220),
 (38,1.0,349.23),(39.4,.8,392),(40.8,.8,440),
 (42,1.2,523.25),(44,1.4,440),(46,1.6,293.66)]
harmonies=[
 (0,12,[146.83,196,293.66]),
 (12,18,[130.81,174.61,261.63]),
 (18,26,[116.54,174.61,233.08]),
 (26,38,[98,146.83,196]),
 (38,45,[146.83,220,293.66]),
 (45,48,[146.83,196,293.66])
]
def burst(t,at,amp,duration=1):
 dt=t-at
 if not (0<dt<duration):return 0.0
 return amp*math.exp(-9*dt)*(
   math.sin(2*math.pi*(75-30*dt)*dt)
   +.39*random.uniform(-1,1))
events=[
 (26.4,.32),(26.74,.16),(27.1,.19),(29.8,.30),(30.17,.20),
 (31.9,.08),(33.7,.11),(36,.13),(38.4,.12),
 (40,.09),(41,.12),(42,.11),(43,.08),(44,.15)]
for i in range(DURATION*SR):
 t=i/SR
 value=0.
 for start,length,f in lead:
  if start<=t<start+length:
   env=min(1.,(t-start)*13.)*max(0.,1-(t-start)/length)**1.4
   value+=.12*env*(math.sin(2*math.pi*f*t)
       +.24*math.sin(4*math.pi*f*t)+.08*math.sin(6*math.pi*f*t))
 for a,b,chord in harmonies:
  if a<=t<b:
   value+=.012*sum(math.sin(2*math.pi*f*t) for f in chord)
   break
 # Tidal ambience, stronger during ebb.
 noise=random.uniform(-1,1)
 tide=min(1,max(0,(t-17)/12))
 value+=noise*(.009+.013*tide)*(0.5+0.5*math.sin(t*.6)**2)
 # Deep drum heartbeat gets faster after impact and counterattack.
 if t>=4:
  beat=.68 if t<17 else .51 if t<38 else .34
  dt=t%beat
  if dt<.30:
   value+= (.08 if t<17 else .12 if t<38 else .18)*math.exp(-18*dt)*math.sin(2*math.pi*(64-30*dt)*dt)
  if t>38 and (t%(.68))<.13:
   value+=.04*noise*math.exp(-20*(t%(.68)))
 # Rising tension at ebb and low resonance after ship impact.
 if 18<t<40:
  value+=.035*math.sin(2*math.pi*(49+1.8*math.sin(t*.31))*t)
 for at,amp in events:
  value+=burst(t,at,amp,.95)
 # Ripping planks and pouring water, 27–39s.
 if 26.4<t<39:
  value+=random.uniform(-1,1)*.024*(.2+.8*abs(math.sin(t*13)))
 if 39<t<45:
  value+=random.uniform(-1,1)*.014*(.4+.6*abs(math.sin(t*18)))
 value*=min(1,t/.8,max(0,(DURATION-t)/1.15))
 value=max(-.91,min(.91,value))
 left=int(28500*value*(1-.04*math.sin(t*.38)))
 right=int(28500*value*(1+.04*math.sin(t*.38)))
 samples+=struct.pack("<hh",left,right)
with wave.open(str(OUT),"wb") as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(samples)
print("Generated",OUT,"duration",DURATION,"s, stereo",len(samples),"PCM bytes")
