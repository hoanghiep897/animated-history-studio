#!/usr/bin/env python3
"""Reject 20s MP4 exports whose 3D canvas is empty / transparent.
Samples four frames via ffmpeg using only the Python standard library.
"""
import math,sys,subprocess
from pathlib import Path
video=Path(sys.argv[1])
if not video.exists():
    raise SystemExit("video missing")
stdevs=[]
for sec in (2,7,12,18):
    p=subprocess.run(["ffmpeg","-v","error","-ss",str(sec),"-i",str(video),
      "-frames:v","1","-vf","scale=120:213","-pix_fmt","rgb24","-f","rawvideo","-"],
      stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    b=p.stdout
    if len(b)<120*213*3:
        raise SystemExit(f"frame missing at {sec}s")
    # sample only every 9th pixel to keep QA lightweight
    data=[(.2126*b[i]+.7152*b[i+1]+.0722*b[i+2]) for i in range(0,len(b),27)]
    avg=sum(data)/len(data)
    std=math.sqrt(sum((v-avg)**2 for v in data)/len(data))
    print(f"{sec}s luma_std={std:.2f}",flush=True)
    stdevs.append(std)
if min(stdevs)<15:
    raise SystemExit("ERROR: blank or low-detail frames detected; refusing to mark render as successful")
print("Visible 3D animation confirmed in sampled frames.")
