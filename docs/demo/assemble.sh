#!/bin/bash
set -e
G=/Users/kshitij/development/companyharness/docs/blog/graphics
W=$(ls out3/*.webm)
rm -f seg*.mp4
i=0
for spec in cover:6 router:8 moments:9 graph:8 teammates:8 @walk loop:8 close:7; do
  i=$((i+1)); n=$(printf "%02d" $i)
  if [ "$spec" = "@walk" ]; then
    ffmpeg -y -v error -i "$W" -vf "fps=30,scale=1440:900,format=yuv420p" -c:v libx264 -crf 22 -preset veryfast -an seg$n.mp4
  else
    name=${spec%%:*}; d=${spec##*:}; f=$((d*30))
    ffmpeg -y -v error -loop 1 -i "$G/$name.png" -vf "scale=2880:1620,zoompan=z='min(1+0.0004*on,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${f}:s=1440x810:fps=30,pad=1440:900:0:45:color=0xF4F3EC,format=yuv420p" -frames:v ${f} -c:v libx264 -crf 20 -preset veryfast seg$n.mp4
  fi
  echo "seg$n $spec"
done
ls seg*.mp4 | sed 's/^/file /' > list.txt
ffmpeg -y -v error -f concat -safe 0 -i list.txt -c:v libx264 -crf 22 -preset medium -pix_fmt yuv420p -r 30 -movflags +faststart /Users/kshitij/development/companyharness/docs/demo/weft-demo.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 /Users/kshitij/development/companyharness/docs/demo/weft-demo.mp4
