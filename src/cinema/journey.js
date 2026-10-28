import * as THREE from 'three';
import {panelSurface,collectionPath} from './electrical-paths.js';

const ease=t=>t*t*t*(t*(t*6-15)+10);
const key=(p,q,fov=47)=>({p:p.isVector3?p.toArray():p,q:q.isVector3?q.toArray():q,fov});

// Each detour starts at the current pose and ends at the main camera's exact pose.
// Simulation time, light propagation and camera share this single clock.
export function createJourney(sample){
  let active=null;
  function start(action,current,time){
    if(active)return false;
    let keys=[],next=6.5,seconds=9;
    if(action==='join'){
      const x=THREE.MathUtils.clamp(current.p.x+4,-55,-10),x2=Math.min(-4,x+12);
      const cable=collectionPath(2),a=cable.getPointAt(THREE.MathUtils.clamp((x2+80)/cable.getLength(),.45,.83)),b=cable.getPointAt(.87);
      seconds=THREE.MathUtils.mapLinear(x,-55,-10,9,5.5);
      keys=[key(panelSurface(x,2,.6).add(new THREE.Vector3(-2,1.15,2.8)),panelSurface(x+3,2)),key(panelSurface(x2,2,.5).add(new THREE.Vector3(-1,.6,2)),panelSurface(x2+4,2)),key(a.clone().add(new THREE.Vector3(-2,.45,2.1)),a.clone().add(new THREE.Vector3(6,0,0))),key(b.clone().add(new THREE.Vector3(-2,.7,2.5)),b.clone().add(new THREE.Vector3(4,0,0))),key([-.3,2.1,17],[4.75,.7,9])];
    }else if(action==='convert'){
      next=10.4;seconds=8;
      keys=[key([2.8,1.7,11],[5,1.4,9],39),key([7,1.8,10],[5,1.3,9],39),key([9,2.2,1],[13.6,.75,-4.4],44),key([11,4.6,-.8],[15,2.3,-5],43),key([18.5,4.9,-2],[15,3.6,-5],44)];
    }else if(action==='grid'){
      next=12.3;seconds=7;
      keys=[key([16,5.8,-.7],[15,4,-5]),key([23,10,-11],[15,6.4,-13]),key([23,16,-32],[22,13,-49]),key([31,19,-48],[28,15,-72]),key([36,20,-30],[24,10,-7])];
    }else if(action==='inspect'){
      next=23.5;seconds=8;
      keys=[key([65.8,1.3,10.8],[68,.8,7.7],42),key([66,1.15,7.3],[68,.6,6.6],43),key([68.7,1.5,4.4],[68,1.1,7.2],44),key([71.1,2.5,8],[68,1.2,8],46),key([72,3.2,15],[68,2,8],47)];
    }else return false;
    const end=sample(next);
    keys.unshift(key(current.p,current.q,current.fov));keys.push(key(end.p,end.q,end.fov));
    active={action,elapsed:0,seconds,next,from:time,keys,p:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.p)),false,'centripetal'),q:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.q)),false,'centripetal')};
    return true;
  }
  function update(dt){
    if(!active)return null;
    active.elapsed=Math.min(active.seconds,active.elapsed+dt);
    const progress=active.elapsed/active.seconds,s=ease(progress),n=s*(active.keys.length-1),i=Math.min(active.keys.length-2,Math.floor(n));
    const result={p:active.p.getPoint(s),q:active.q.getPoint(s),fov:THREE.MathUtils.lerp(active.keys[i].fov,active.keys[i+1].fov,n-i),time:THREE.MathUtils.lerp(active.from,active.next,s),action:active.action,progress,done:progress>=1,next:active.next};
    if(result.done)active=null;
    return result;
  }
  return {start,update,get active(){return active?.action||null;},finish(current,time){
    if(!active)return;
    const end=sample(active.next),middle=current.p.clone().lerp(end.p,.5);middle.y+=2;
    const keys=[key(current.p,current.q,current.fov),key(middle,current.q.clone().lerp(end.q,.5),47),key(end.p,end.q,end.fov)];
    active={...active,elapsed:0,seconds:2.5,from:time,keys,p:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.p)),false,'centripetal'),q:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.q)),false,'centripetal')};
  },clear(){active=null;}};
}
