// Exactly three scenes. Reaching an endpoint consumes no further time until
// the visitor explicitly advances. A suspended tab cannot skip a gate.
export const SCENES=Object.freeze([
  {start:0,end:12,duration:12,name:'Güneşten enerjiye',next:'Enerji dönüşümünü keşfet',target:1},
  {start:12,end:23,duration:11,name:'Enerjinin dönüşümü',next:'Araç muayene istasyonlarına ilerle',target:2},
  {start:23,end:39,duration:16,name:'Araç muayene istasyonları',next:'Yolculuğu yeniden başlat',target:0},
]);
// Cosine velocity ramps at the edges; constant cruise through the actual shots.
export const sceneEase=p=>{const r=.12;if(p<r)return (p-r/Math.PI*Math.sin(Math.PI*p/r))/(2*(1-r));if(p>1-r)return 1-sceneEase(1-p);return (p-r/2)/(1-r);};
function inverseEase(value){let lo=0,hi=1;for(let i=0;i<35;i++){const mid=(lo+hi)/2;if(sceneEase(mid)<value)lo=mid;else hi=mid;}return (lo+hi)/2;}
export function createScenePlayback(initialTime=0){
  let index=0,elapsed=0,waiting=false,restarting=false,restartElapsed=0;
  function seek(time){
    const t=Math.max(0,Math.min(39,time));
    index=SCENES.findIndex(s=>t<=s.end+.000001);if(index<0)index=2;
    const s=SCENES[index];elapsed=inverseEase((t-s.start)/(s.end-s.start))*s.duration;
    waiting=t>=s.end-.000001;restarting=false;restartElapsed=0;
  }
  seek(initialTime);
  function snapshot(){const s=SCENES[index],progress=Math.min(1,elapsed/s.duration);return {index,name:s.name,waiting,restarting,restartProgress:restartElapsed/4.6,progress,time:s.start+(s.end-s.start)*sceneEase(progress),label:s.next,target:s.target};}
  return {
    tick(dt){
      if(restarting){restartElapsed=Math.min(4.6,restartElapsed+Math.max(0,dt));if(restartElapsed>=4.6){index=0;elapsed=0;waiting=false;restarting=false;}return snapshot();}
      if(!waiting){elapsed=Math.min(SCENES[index].duration,elapsed+Math.max(0,dt));if(elapsed>=SCENES[index].duration)waiting=true;}
      return snapshot();
    },
    advance(target=SCENES[index].target){if(!waiting||restarting||target!==SCENES[index].target)return false;if(index===2){restarting=true;restartElapsed=0;waiting=false;}else{index++;elapsed=0;waiting=false;}return true;},
    seek,
    get state(){return snapshot();},
  };
}
