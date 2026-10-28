import * as THREE from 'three';

// Panel surface and wiring use the same installation coordinates.
export const PV_TILT=.38;
export const rowZ=row=>28-row*4.35;
export function panelSurface(x,row,depth=0,lift=.018){
  return new THREE.Vector3(x,1.45+Math.cos(PV_TILT)*(.048+lift)-Math.sin(PV_TILT)*depth,rowZ(row)+Math.sin(PV_TILT)*(.048+lift)+Math.cos(PV_TILT)*depth);
}
export function cableCurve(points){
  const path=new THREE.CurvePath();
  const p=points.map(v=>v.isVector3?v:new THREE.Vector3(...v));
  for(let i=1;i<p.length;i++)path.add(new THREE.LineCurve3(p[i-1],p[i]));
  return path;
}
export function collectionPath(row=2){
  const z=rowZ(row)+.35;
  return cableCurve([[-75.8,.97,z],[-.6,.97,z],[1.5,.97,z],[1.5,.32,z],[4.75,.32,z],[4.75,.32,9],[4.75,.5,9]]);
}
export const acPath=()=>cableCurve([[5.25,.5,9],[5.25,.27,9],[6.2,.27,9],[6.2,.27,-4.4],[13.6,.27,-4.4],[13.6,.75,-4.4]]);
