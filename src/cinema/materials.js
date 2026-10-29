import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BRAND = '#78b828';
export async function loadAssets(renderer,onLoad){
  const manager=new THREE.LoadingManager();
  manager.onProgress=(_url,loaded,total)=>onLoad(Math.min(.92,loaded/Math.max(total,1)*.9));
  const loader=new THREE.TextureLoader(manager);
  const load=(name)=>loader.loadAsync('/assets/'+name);
  const [sky,asphalt,asphaltNormal,asphaltRough,terrain,terrainNormal,car,besteLogo,esbiLogo,energyLogo,concreteColor,concreteNormal,concreteRough,rock,inspectorReach,inspectorTablet,inspectorWheel]=await Promise.all([
    new HDRLoader(manager).setDataType(THREE.FloatType).loadAsync('/assets/clear-sun.hdr'),
    load('asphalt-color.jpg'),load('asphalt-normal.jpg'),load('asphalt-rough.jpg'),load('terrain-color.jpg'),load('terrain-normal.jpg'),
    new GLTFLoader(manager).loadAsync('/assets/inspection-car.glb'),
    load('beste-logo.webp'),load('esbi-logo.webp'),load('bestbrands-original.png'),
    load('concrete-color.jpg'),load('concrete-normal.jpg'),load('concrete-rough.jpg'),
    new GLTFLoader(manager).loadAsync('/assets/rock/rock.gltf'),
    new GLTFLoader(manager).loadAsync('/assets/people/inspector-reach.glb'),
    new GLTFLoader(manager).loadAsync('/assets/people/inspector-tablet.glb'),
    new GLTFLoader(manager).loadAsync('/assets/people/inspector-wheel.glb'),
  ]);
  // Keep a crisp solar disk without letting the 24-EV source flood the bloom
  // pyramid. The directional sun supplies the matching physical key light.
  for(let i=0;i<sky.image.data.length;i+=4){const maximum=Math.max(sky.image.data[i],sky.image.data[i+1],sky.image.data[i+2]);if(maximum>8){const scale=8/maximum;sky.image.data[i]*=scale;sky.image.data[i+1]*=scale;sky.image.data[i+2]*=scale;}}
  sky.needsUpdate=true;sky.mapping=THREE.EquirectangularReflectionMapping;
  for(const texture of [asphalt,asphaltNormal,asphaltRough,terrain,terrainNormal,concreteColor,concreteNormal,concreteRough]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  asphalt.colorSpace=terrain.colorSpace=THREE.SRGBColorSpace;
  for(const logo of [besteLogo,esbiLogo,energyLogo,concreteColor])logo.colorSpace=THREE.SRGBColorSpace;
  return {sky,asphalt,asphaltNormal,asphaltRough,terrain,terrainNormal,car,besteLogo,esbiLogo,energyLogo,concreteColor,concreteNormal,concreteRough,rock,inspectorReach,inspectorTablet,inspectorWheel};
}

export function noiseTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');const image=ctx.createImageData(512,512);let seed=47121;
  for(let i=0;i<image.data.length;i+=4){seed=(Math.imul(1664525,seed)+1013904223)>>>0;const n=seed/4294967296;const v=145+n*44;image.data[i]=v;image.data[i+1]=v+2;image.data[i+2]=v-1;image.data[i+3]=255;}
  ctx.putImageData(image,0,0);
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(20,20);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

export function makeMaterials(assets){
  function repeated(texture,x,y){const t=texture.clone();t.repeat.set(x,y);t.needsUpdate=true;return t;}
  const ground=new THREE.MeshStandardMaterial({map:repeated(assets.terrain,95,95),normalMap:repeated(assets.terrainNormal,95,95),normalScale:new THREE.Vector2(.42,.42),roughness:1,color:'#adac94'});
  const road=new THREE.MeshStandardMaterial({map:repeated(assets.asphalt,3,45),normalMap:repeated(assets.asphaltNormal,3,45),roughnessMap:repeated(assets.asphaltRough,3,45),normalScale:new THREE.Vector2(.25,.25),roughness:.95,color:'#737b7b'});
  const concrete=new THREE.MeshStandardMaterial({map:repeated(assets.concreteColor,5,7),normalMap:repeated(assets.concreteNormal,5,7),roughnessMap:repeated(assets.concreteRough,5,7),normalScale:new THREE.Vector2(.18,.18),color:'#c1c7c3',roughness:.8,metalness:.02});
  const floor=new THREE.MeshPhysicalMaterial({map:repeated(assets.concreteColor,5,7),roughnessMap:repeated(assets.concreteRough,5,7),normalMap:repeated(assets.concreteNormal,5,7),normalScale:new THREE.Vector2(.06,.06),color:'#c4cdca',roughness:.35,metalness:.12,clearcoat:.35});
  return {ground,road,concrete,floor,steel:new THREE.MeshStandardMaterial({color:'#77868c',metalness:.85,roughness:.3}),darkSteel:new THREE.MeshStandardMaterial({color:'#283b3d',metalness:.65,roughness:.38}),wall:new THREE.MeshStandardMaterial({color:'#b8c5c5',metalness:.16,roughness:.5}),white:new THREE.MeshStandardMaterial({color:'#d9e1df',metalness:.3,roughness:.25}),brand:new THREE.MeshStandardMaterial({color:BRAND,metalness:.18,roughness:.38}),black:new THREE.MeshStandardMaterial({color:'#101618',roughness:.55,metalness:.3}),rubber:new THREE.MeshStandardMaterial({color:'#0c1012',roughness:.9}),glass:new THREE.MeshPhysicalMaterial({color:'#a2b6bf',metalness:.18,roughness:.07,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide}),light:new THREE.MeshBasicMaterial({color:new THREE.Color('#e3f3fa').multiplyScalar(2.4),toneMapped:false}),greenLight:new THREE.MeshBasicMaterial({color:new THREE.Color(BRAND).multiplyScalar(3),toneMapped:false})};
}
