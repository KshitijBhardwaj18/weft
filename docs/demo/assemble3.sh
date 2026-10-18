#!/bin/bash
set -e
cd /tmp/demo-rec
G=/Users/kshitij/development/companyharness/docs/blog/graphics
W=app_all.mp4
END=215.33
# left-panel track from segs.json
python3 - <<PY
import json
S=json.load(open("segs_all.json")); end=$END
with open("panels.txt","w") as f:
    for i,s in enumerate(S):
        start = 0 if i==0 else s[0]
        stop = S[i+1][0] if i+1<len(S) else end
        f.write(f"file 'panels/p{i:02d}.png'\nduration {stop-start:.3f}\n")
    f.write(f"file 'panels/p{len(S)-1:02d}.png'\n")
PY
ffmpeg -y -v error -f concat -safe 0 -i panels.txt -i "$W" -filter_complex "[0:v]fps=30,format=yuv420p[bg];[1:v]fps=30,scale=1328:830[app];[bg][app]overlay=536:120:shortest=1,format=yuv420p" -t $END -c:v libx264 -crf 21 -preset veryfast walk.mp4
rm -f s*.mp4
i=0
for spec in cover:6 router:9 moments:10 graph:8 teammates:8 @walk loop:8 close:7; do
  i=$((i+1)); n=$(printf "%02d" $i)
  if [ "$spec" = "@walk" ]; then cp walk.mp4 s$n.mp4
  else
    name=${spec%%:*}; d=${spec##*:}; f=$((d*30))
    ffmpeg -y -v error -loop 1 -i "$G/$name.png" -vf "scale=3840:2160,zoompan=z='min(1+0.0004*on,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${f}:s=1920x1080:fps=30,format=yuv420p" -frames:v ${f} -c:v libx264 -crf 20 -preset veryfast s$n.mp4
  fi
done
ls s0*.mp4 | sed 's/^/file /' > list2.txt
ffmpeg -y -v error -f concat -safe 0 -i list2.txt -c:v libx264 -crf 22 -preset medium -pix_fmt yuv420p -r 30 -movflags +faststart /Users/kshitij/development/companyharness/docs/demo/weft-demo.mp4
ffprobe -v error -show_entries format=duration:stream=width,height -of compact /Users/kshitij/development/companyharness/docs/demo/weft-demo.mp4
