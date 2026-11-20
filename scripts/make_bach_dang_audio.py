#!/usr/bin/env python3
"""Bạch Đằng 938: original 24s music + sound design. Python standard library only.
Traditional-inspired pentatonic motif written specifically for this film, not sampled music.
3-layer taiko-like drum, flowing river noise, hull collision and wooden creaks.
"""
import math,random,struct,wave
from pathlib import Path
SR=22050
SEC=24
N=SR*SEC
random.seed(938)
PATH=Path("public/audio/bach-dang.wav")
PATH.parent.mkdir(parents=True,exist_ok=True)
# Small original pentatonic-style tune for flute-like lead.
melody=[
(0.0,.8,293.66),(1.0,.8,349.23),(2.0,1.0,392.0),(3.4,1.0,440),
(4.7,.7,392.0),(5.6,.7,349.23),(6.6,1.2,293.66),(8.1,.8,261.63),
(9.2,.75,293.66),(10.2,1.0,349.23),(11.5,.65,392.0),
(12.8,1.3,440),(14.6,.65,392),(15.3,1.2,349.23),
(17.0,1.2,293.66),(18.5,1.4,261.63),(21.0,2.8,293.66)]
chords=[[146.83,220.0,293.66],[130.81,196,261.63],
        [174.61,220.0,293.66],[146.83,174.61,261.63]]
def attack(z,lam):
 return math.exp(-lam*z) if 0<=z<1 else 0
data=bytearray()
for i in range(N):
 t=i/SR
 value=0.0
 for a,l,f in melody:
  if a<=t<a+l:
   u=(t-a)/l
   e=min(1,(t-a)*16)*(1-u)**1.28
   value+=.11*e*(math.sin(2*math.pi*f*t)+.22*math.sin(4*math.pi*f*t)+.09*math.sin(6*math.pi*f*t))
 for k,f in enumerate(chords[int(t/6)%4]):
  value+=.018*math.sin(2*math.pi*f*t+.1*k)
 # Soft river bed always present.
 value+=.009*random.uniform(-1,1)*(0.6+0.4*math.sin(2*math.pi*.22*t))
 # Increasing war-drums (tonal synthetic, not copyrighted samples)
 if t>3:
  beat_len=.62 if t<11 else .43
  b=t%beat_len
  intensity=.08 if t<10 else .15
  value+=intensity*attack(b,14)*math.sin(2*math.pi*(64-28*b)*b)
  if t>12 and t%(.86)<.16:
   value+=.043*random.uniform(-1,1)*math.exp(-14*(t%.86))
 # Horn-like bass drone for enemy fleet.
 if t>4:
  value+=min(.065,.007+(t-4)*.006)*math.sin(2*math.pi*(73.42+1.2*math.sin(.8*t))*t)
 # Stakes snap and heavy collision at 15-17 s, then victorious percussion.
 for hit,amp in [(13.5,.06),(14.6,.12),(15.0,.22),(15.45,.19),(16.2,.18),(17.4,.1),(20.0,.15),(22,.16)]:
  z=t-hit
  if 0<=z<.8:
   value+=amp*math.exp(-13*z)*(math.sin(2*math.pi*(81-40*z)*z)+.58*random.uniform(-1,1))
 # Shore hiss and cinematic outro.
 if 15<t<19: value+=.018*random.uniform(-1,1)
 value*=min(1,t/.9,max(0,(SEC-t)/1.1))
 value=max(-.94,min(.94,value))
 l=int(value*(1-.04*math.sin(t*.5))*28000)
 r=int(value*(1+.04*math.sin(t*.5))*28000)
 data+=struct.pack("<hh",l,r)
with wave.open(str(PATH),"wb") as f:
 f.setnchannels(2)
 f.setsampwidth(2)
 f.setframerate(SR)
 f.writeframes(data)
print(f"Generated {PATH} duration={SEC}s channels=2")
