import * as THREE from 'three';

// The free travelling measurement wave is a brand metaphor, not a power cable
// connecting the GES to the inspection station. It becomes the optical scan.
export function buildMeasurementBridge(scene){
  const curve=new THREE.CatmullRomCurve3([[16,4,-13],[24,9,1],[35,8,24],[49,7,29],[61,5,22],[68,2.5,12],[68,1.4,8]].map(p=>new THREE.Vector3(...p)));
  const points=[];for(let i=0;i<=180;i++){const x=i/180*5-2.5;points.push(new THREE.Vector3(x,Math.sin(x*6)*Math.exp(-x*x*.22)*.45,0));}
  const wave=new THREE.CatmullRomCurve3(points);
  const material=new THREE.MeshBasicMaterial({color:new THREE.Color('#78b828').multiplyScalar(4),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const signal=new THREE.Group();scene.add(signal);signal.add(new THREE.Mesh(new THREE.TubeGeometry(wave,180,.025,5,false),material));
  const halo=new THREE.Mesh(new THREE.TubeGeometry(wave,180,.10,5,false),new THREE.MeshBasicMaterial({color:'#78b828',transparent:true,opacity:.06,depthWrite:false,blending:THREE.AdditiveBlending}));signal.add(halo);
  return {update(t,camera){const progress=THREE.MathUtils.smoothstep(t,11.2,18);signal.position.copy(curve.getPoint(progress));signal.quaternion.copy(camera.quaternion);signal.visible=t>=11&&t<18.5;material.opacity=THREE.MathUtils.smoothstep(t,11,11.8)*(1-THREE.MathUtils.smoothstep(t,17.7,18.5));signal.scale.y=1-THREE.MathUtils.smoothstep(t,16,18)*.95;}};
}
