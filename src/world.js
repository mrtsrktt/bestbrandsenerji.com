import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import gsap from 'gsap';
import {loadAssets,makeMaterials} from './cinema/materials.js';
import {buildSolar} from './cinema/solar.js';
import {buildLandscape} from './cinema/environment.js';
import {buildPowerSystem} from './cinema/power.js';
import {buildMeasurementBridge} from './cinema/bridge.js';
import {buildStation} from './cinema/station.js';

const clamp=THREE.MathUtils.clamp;
const smooth=THREE.MathUtils.smoothstep;
const lerp=THREE.MathUtils.lerp;
const DURATION=26;

// One continuous camera follows production, distribution and a measurement wave.
const energyFlight=[
 {t:0,p:[-58,2.6,27],q:[-48,12,-8],fov:51,roll:0},
 {t:1.8,p:[-51,2.2,21],q:[-40,1.5,8],fov:49,roll:-.015},
 {t:4,p:[-32,3.2,14],q:[-17,1.5,2],fov:50,roll:-.025},
 {t:6.5,p:[-1,2.8,11],q:[5,1.4,4],fov:43,roll:.015},
 {t:8.5,p:[9,3.4,4],q:[15,2.7,-5],fov:44,roll:.015},
 {t:10.4,p:[24,9,5],q:[15,4,-15],fov:51,roll:0},
 {t:11.8,p:[24,14,12],q:[18,7,-20],fov:51,roll:-.018},
 {t:13.2,p:[33,10,25],q:[46,7,20],fov:50,roll:-.02},
];
const stationFlight=[
 {t:14.4,p:[50,7,32],q:[68,6,16],fov:49,roll:0},
 {t:15.5,p:[65,3.8,25],q:[68,2,9],fov:49,roll:0},
 {t:17.5,p:[64.7,2.3,13],q:[68,1.25,8],fov:49,roll:.01},
 {t:19.5,p:[65,1.4,6],q:[68,1,8],fov:47,roll:0},
 {t:21.5,p:[71.5,2.7,3],q:[68,1.4,8],fov:49,roll:-.012},
 {t:23.5,p:[74,4,19],q:[68,3,6],fov:50,roll:0},
 {t:26,p:[80,8,33],q:[68,4,9],fov:52,roll:0},
];
function flightTrack(keys){
 return {keys,position:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.p)),false,'catmullrom',.25),target:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.q)),false,'catmullrom',.25)};
}
export async function createWorld(canvas,{reducedMotion,onProgress,onLoad}){
 const mobile=()=>innerWidth<=720;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 const pixelRatio=Math.min(devicePixelRatio,mobile()?1.15:1.35);
 renderer.setPixelRatio(pixelRatio);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(49,1,.08,2000);
 const uniforms={time:{value:0},energy:{value:0},scan:{value:0}};
 const assets=await loadAssets(renderer,onLoad);
 scene.background=assets.sky;scene.environment=assets.sky;
 scene.backgroundRotation.y=scene.environmentRotation.y=2.08;
 scene.backgroundIntensity=.95;scene.environmentIntensity=.85;
 scene.backgroundBlurriness=.008;scene.fog=new THREE.FogExp2('#bac2bb',.0017);
 const materials=makeMaterials(assets);
 const land=buildLandscape(scene,materials);
 const solar=buildSolar(scene,materials,uniforms);
 buildPowerSystem(scene,materials,assets,uniforms);
 const station=buildStation(scene,materials,assets,uniforms);
 const bridge=buildMeasurementBridge(scene);
 const ambient=new THREE.HemisphereLight('#dbe9f2','#554a35',.65);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#ffdda4',2.7);sun.castShadow=true;
 sun.shadow.mapSize.set(mobile()?1024:2048,mobile()?1024:2048);
 Object.assign(sun.shadow.camera,{left:-62,right:62,top:62,bottom:-62,near:1,far:200});
 sun.shadow.bias=-.00013;sun.shadow.normalBias=.035;sun.shadow.radius=3;
 scene.add(sun,sun.target);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const ao=new GTAOPass(scene,camera,512,512,undefined,{radius:.65,thickness:1.5,distanceExponent:1.5});ao.blendIntensity=.6;composer.addPass(ao);
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.29,.38,1.02);composer.addPass(bloom);
 const dof=new BokehPass(scene,camera,{focus:8,aperture:.000055,maxblur:.0045});composer.addPass(dof);
 const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
 const grade=new ShaderPass({
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uAspect:{value:1}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uAspect;varying vec2 vUv;
  void main(){
    vec3 c=texture2D(tDiffuse,vUv).rgb;
    float vignette=1.-.17*pow(length((vUv-.5)*vec2(1.1,1.)),1.4);c*=vignette;
    c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,1.05);
    gl_FragColor=vec4(c,1.);
  }`
 });composer.addPass(grade);composer.addPass(new OutputPass());
 let width=1,height=1;
 function resize(){const r=canvas.parentElement.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);composer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();fxaa.uniforms.resolution.value.set(1/(width*pixelRatio),1/(height*pixelRatio));grade.uniforms.uAspect.value=width/height;}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 const params=new URLSearchParams(location.search);
 let filmTime=params.has('time')?clamp(Number(params.get('time'))||0,0,DURATION-.001):0;
 let paused=params.get('still')==='1',hidden=document.hidden,last=performance.now();
 const track=flightTrack([...energyFlight,...stationFlight]);
 const state={u:0};
 const tl=gsap.timeline({paused:true});
 tl.to(state,{u:1,duration:DURATION,ease:'none'},0);
 let rendered=0,frameMs=0;
 const target=new THREE.Vector3();
 function draw(t){
  t=clamp(t,0,DURATION-.001);tl.time(t,false);uniforms.time.value=t;
  uniforms.energy.value=smooth(t,.25,1.05)*(1-smooth(t,12.8,13.5));
  uniforms.scan.value=smooth(t,16.5,18)*(1-smooth(t,23,25));
  let index=0;while(index<track.keys.length-2&&t>=track.keys[index+1].t)index++;
  const k0=track.keys[index],k1=track.keys[index+1];
  const fraction=clamp((t-k0.t)/(k1.t-k0.t),0,1);
  const u=(index+fraction)/(track.keys.length-1);
  camera.position.copy(track.position.getPoint(u));target.copy(track.target.getPoint(u));
  camera.fov=lerp(k0.fov,k1.fov,fraction)+(mobile()?12:0);
  // Banking remains restrained, with forward motion and parallax carrying the shot.
  camera.up.set(0,1,0);camera.lookAt(target);camera.rotateZ(lerp(k0.roll,k1.roll,fraction));
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  bridge.update(t,camera);
  const carZ=lerp(26,8.0,smooth(t,14,17));
  station.car.position.set(0,.25,carZ);
  station.scanner.visible=t>=17&&t<=25;
  station.scanner.position.z=lerp(10.5,5.5,(Math.sin((t-17)*1.3)*.5+.5));
  station.interior.intensity=90+smooth(t,14,17)*80;
  // Shadow coverage follows the flight, preserving near-detail at both locations.
  const centerX=lerp(lerp(-37,16,smooth(t,4,8)),68,smooth(t,12,15));
  sun.target.position.set(centerX,0,0);sun.position.set(centerX+32,16.5,-145);sun.target.updateMatrixWorld();
  grade.uniforms.uTime.value=t;
  ao.enabled=!mobile()&&((t>6&&t<11)||(t>16.5&&t<24));
  dof.enabled=!mobile()&&((t>1.3&&t<5.5)||(t>17&&t<23));
  dof.uniforms.focus.value=t<13.5?lerp(6,14,smooth(t,0,6)):camera.position.distanceTo(new THREE.Vector3(68,1.3,7));
  canvas.dataset.time=t.toFixed(3);canvas.dataset.paused=String(paused);
  onProgress(t<7?0:t<13.5?1:2);
  composer.render();
 }
 // Upload and compile before fading the loading cover; no blank first frame.
 draw(filmTime);onLoad(1);
 function render(time){
  const now=Number.isFinite(time)?time:performance.now();
  const dt=Math.max(0,(now-last)/1000);last=now;
  if(hidden)return;
  if(!paused)filmTime=(filmTime+dt*(reducedMotion?.65:1))%DURATION;
  const start=performance.now();draw(filmTime);frameMs=lerp(frameMs,performance.now()-start,.04);rendered++;canvas.dataset.renderMs=frameMs.toFixed(1);
 }
 renderer.setAnimationLoop(render);
 document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=performance.now();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);canvas.parentElement.classList.add('failed');});
 return {setPaused(value){paused=value;last=performance.now();},seek(value){filmTime=((value%DURATION)+DURATION)%DURATION;draw(filmTime);},seekChapter(index){filmTime=[2,9,19][index];draw(filmTime);},metrics(){return {time:filmTime,paused,rendered,renderMs:Math.round(frameMs*10)/10,panels:solar.panels,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},dispose(){renderer.setAnimationLoop(null);observer.disconnect();tl.kill();scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const material of Array.isArray(obj.material)?obj.material:[obj.material])material.dispose();}});composer.dispose();renderer.dispose();}};
}
