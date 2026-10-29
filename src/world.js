import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import {loadAssets,makeMaterials} from './cinema/materials.js';
import {buildSolar} from './cinema/solar.js';
import {buildLandscape} from './cinema/environment.js';
import {buildPowerSystem} from './cinema/power.js';
import {buildStation} from './cinema/station.js';
import {createScenePlayback,sceneEase} from './cinema/scene-playback.js';
import {SUN_DIRECTION,FLIGHT_KEYS,FILM_END} from './cinema/choreography.js';
import {createFlightSampler} from './cinema/flight-sampler.js';

const clamp=THREE.MathUtils.clamp;
const smooth=THREE.MathUtils.smoothstep;
const lerp=THREE.MathUtils.lerp;
const DURATION=FILM_END+.001;

// One continuous camera follows sunlight, conversion and inspection.
function flightTrack(keys){
 return {keys,position:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.p)),false,'catmullrom',.25),target:new THREE.CatmullRomCurve3(keys.map(k=>new THREE.Vector3(...k.q)),false,'catmullrom',.25)};
}
export async function createWorld(canvas,{reducedMotion,onProgress,onLoad,onInteraction=()=>{}}){
 const mobile=()=>innerWidth<=720;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 const pixelRatio=Math.min(devicePixelRatio,mobile()?1.15:1);
 renderer.setPixelRatio(pixelRatio);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(49,1,.08,2000);
 const uniforms={time:{value:0},energy:{value:0},scan:{value:0},vehicleScanZ:{value:7}};
 const assets=await loadAssets(renderer,onLoad);
 scene.background=assets.sky;scene.environment=assets.sky;
 scene.backgroundRotation.y=scene.environmentRotation.y=2.08;
 scene.backgroundIntensity=.95;scene.environmentIntensity=.85;
 scene.backgroundBlurriness=0;scene.fog=new THREE.FogExp2('#c4cccb',.0015);
 const materials=makeMaterials(assets);
 const land=buildLandscape(scene,materials,assets);
 const solar=buildSolar(scene,materials,uniforms);
 const power=buildPowerSystem(scene,materials,assets,uniforms);
 const station=buildStation(scene,materials,assets,uniforms);
 const ambient=new THREE.HemisphereLight('#dbe9f2','#756851',1.1);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#ffdda4',2.7);sun.castShadow=true;
 const sunDirection=new THREE.Vector3(...SUN_DIRECTION);
 // A compact emissive photosphere restores the solar disk that PMREM blurs.
 // It shares the HDR/light direction and remains part of this same 3D sky.
 const sunDisk=new THREE.Mesh(new THREE.SphereGeometry(42,48,32),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe5a2').multiplyScalar(8),toneMapped:false,fog:false}));sunDisk.frustumCulled=false;scene.add(sunDisk);
 sun.shadow.mapSize.set(mobile()?1024:2048,mobile()?1024:2048);
 Object.assign(sun.shadow.camera,{left:-62,right:62,top:62,bottom:-62,near:1,far:200});
 sun.shadow.bias=-.00013;sun.shadow.normalBias=.035;sun.shadow.radius=3;
 scene.add(sun,sun.target);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.29,.38,1.02);composer.addPass(bloom);
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
 let paused=params.get('still')==='1',hidden=document.hidden,last=performance.now(),forceDraw=true,warming=true;
 const sampleMain=createFlightSampler(FLIGHT_KEYS);
 const playback=createScenePlayback(filmTime);
 let sceneState=playback.state,currentPose=sampleMain(filmTime);
 const returnStart=sampleMain(FILM_END),returnEnd=sampleMain(0);
 const returnFlight=flightTrack([
  {t:0,p:returnStart.p.toArray(),q:returnStart.q.toArray(),fov:52,roll:0},
  {t:1,p:[83,27,49],q:[48,4,6],fov:59,roll:-.025},
  {t:2,p:[15,38,53],q:[-10,1,0],fov:57,roll:-.015},
  {t:3,p:[-43,18,42],q:[-45,3,17],fov:53,roll:0},
  {t:4,p:returnEnd.p.toArray(),q:returnEnd.q.toArray(),fov:returnEnd.fov,roll:0},
 ]);
 const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();
 const right=new THREE.Vector3();
 let rendered=0,frameMs=0,advances=0,lastShadowSector=-1,parkedShadow=false;
 const samples=[[],[],[]];let baselinePrograms=0;
 const frameProfile=()=>samples.map(list=>{const sorted=[...list].sort((a,b)=>a-b);return {count:sorted.length,p95:sorted.length?+sorted[Math.floor((sorted.length-1)*.95)].toFixed(1):0,max:sorted.length?+sorted.at(-1).toFixed(1):0,over100:sorted.filter(v=>v>100).length};});
 renderer.shadowMap.autoUpdate=false;
 const target=new THREE.Vector3();
 function draw(t,notify=true){
  t=clamp(t,0,DURATION-.001);uniforms.time.value=t;
  scene.backgroundIntensity=lerp(.48,.82,smooth(t,.4,2.2));
  renderer.toneMappingExposure=lerp(.65,.90,smooth(t,.4,2.2));
  uniforms.energy.value=smooth(t,.7,1.7)*(1-smooth(t,12.5,14));
  uniforms.scan.value=smooth(t,27,28)*(1-smooth(t,37,38));
  power.update(t);
  currentPose=sampleMain(t);
  if(sceneState.restarting){
   const s=sceneEase(clamp(sceneState.restartProgress,0,1));
   currentPose={p:returnFlight.position.getPoint(s),q:returnFlight.target.getPoint(s),fov:lerp(returnStart.fov,returnEnd.fov,s)+Math.sin(s*Math.PI)*6,roll:-Math.sin(s*Math.PI)*.018};
  }
  camera.position.copy(currentPose.p);target.copy(currentPose.q);
  const transition=!sceneState.waiting&&!sceneState.restarting&&sceneState.index>0?Math.sin(clamp(sceneState.progress/.28,0,1)*Math.PI):0;
  camera.fov=currentPose.fov+(mobile()?12:0)+transition*3;
  right.copy(target).sub(camera.position).cross(new THREE.Vector3(0,1,0)).normalize();
  const nearEngine=smooth(t,30.4,31.5)*(1-smooth(t,34,35.5));
  camera.near=lerp(.08,.008,nearEngine);
  const parallax=lerp(1,.06,nearEngine);
  camera.position.addScaledVector(right,pointer.x*.20*parallax);
  camera.position.y+=pointer.y*.08*parallax;target.addScaledVector(right,pointer.x*.10*parallax);
  // Banking remains restrained, with forward motion and parallax carrying the shot.
  camera.up.set(0,1,0);camera.lookAt(target);camera.rotateZ(currentPose.roll||0);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  sunDisk.position.copy(camera.position).addScaledVector(sunDirection,1200);
  bloom.strength=.29+transition*.10;
  const carZ=lerp(26,8.0,smooth(t,24.8,27.4));
  station.car.position.set(0,.25,carZ);
  station.scanner.visible=t>=27.4&&t<=37;
  station.scanner.position.z=lerp(10.5,5.5,(Math.sin((t-27.4)*1.3)*.5+.5));
  uniforms.vehicleScanZ.value=station.scanner.position.z-1;
  station.interior.intensity=45+smooth(t,24,27)*35;
  station.updateInspection(t,nearEngine);
  // Shadow coverage follows the flight, preserving near-detail at both locations.
  const shadowSector=t<12?0:t<23?1:2;
  const centerX=[-37,16,68][shadowSector];
  sun.target.position.set(centerX,0,0);sun.position.copy(sun.target.position).addScaledVector(sunDirection,150);sun.target.updateMatrixWorld();
  const parked=t>=27.4;
  if(shadowSector!==lastShadowSector||parked!==parkedShadow){renderer.shadowMap.needsUpdate=true;lastShadowSector=shadowSector;parkedShadow=parked;}
  grade.uniforms.uTime.value=t;
  canvas.dataset.time=t.toFixed(3);canvas.dataset.paused=String(paused);
  canvas.dataset.scene=String(sceneState.index+1);canvas.dataset.waiting=String(sceneState.waiting);
  canvas.dataset.phase=sceneState.restarting?'returning':sceneState.waiting?'awaiting-input':'playing';
  canvas.dataset.programs=String(renderer.info.programs?.length||0);
  canvas.dataset.advances=String(advances);
  if(notify){onInteraction({...sceneState,paused});onProgress(sceneState.index);}
  composer.render();
 }
 // Compile hidden people, engine and all lighting/material variants BEFORE
 // autoplay. Representative renders upload their textures/geometry/FBOs too.
 await renderer.compileAsync(scene,camera);
 const warmTimes=[0,2.8,6,14,18.5,22,26.5,28.8,31.8,34.8,37];
 for(let i=0;i<warmTimes.length;i++){draw(warmTimes[i],false);onLoad(.92+(i+1)/warmTimes.length*.07);}
 await renderer.compileAsync(scene,camera);
 lastShadowSector=-1;draw(filmTime);
 const gl=renderer.getContext();
 if(gl.fenceSync){
  const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
  await new Promise(resolve=>{const started=performance.now();function check(){const result=gl.clientWaitSync(fence,0,0);if(result===gl.ALREADY_SIGNALED||result===gl.CONDITION_SATISFIED||performance.now()-started>3000){gl.deleteSync(fence);resolve();}else setTimeout(check,8);}check();});
 }
 warming=false;last=performance.now();baselinePrograms=renderer.info.programs.length;canvas.dataset.prewarmed='true';canvas.dataset.baselinePrograms=String(baselinePrograms);onLoad(1);
 function render(time){
  const now=Number.isFinite(time)?time:performance.now();
  const dt=Math.max(0,(now-last)/1000);last=now;
  if(hidden)return;
  const movingPointer=pointer.distanceToSquared(pointerTarget)>.000001;
  pointer.lerp(pointerTarget,1-Math.exp(-dt*4));
  const wasPlaying=!paused&&!sceneState.waiting;
  if(!paused){
   sceneState=playback.tick(dt*(reducedMotion?.65:1));filmTime=sceneState.time;
  }
  if(!wasPlaying&&!movingPointer&&!forceDraw)return;
  forceDraw=false;
  if(wasPlaying&&!warming){const list=samples[sceneState.index];list.push(dt*1000);if(list.length>6000)list.shift();}
  const start=performance.now();draw(filmTime);frameMs=lerp(frameMs,performance.now()-start,.04);rendered++;canvas.dataset.renderMs=frameMs.toFixed(1);
  canvas.dataset.frameMs=(dt*1000).toFixed(1);
  if(rendered%60===0||sceneState.waiting)canvas.dataset.profile=JSON.stringify({frames:frameProfile(),programs:renderer.info.programs.length,baselinePrograms});
 }
 renderer.setAnimationLoop(render);
 document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=performance.now();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);canvas.parentElement.classList.add('failed');});
 return {
  setPaused(value){paused=value;forceDraw=true;last=performance.now();},
  point(x,y){pointerTarget.set(clamp(x,-1,1),clamp(y,-1,1));},
  advance(target){const accepted=playback.advance(target);if(accepted){sceneState=playback.state;filmTime=sceneState.time;advances++;forceDraw=true;last=performance.now();onInteraction({...sceneState,paused});}return accepted;},
  seek(value){playback.seek(value);sceneState=playback.state;filmTime=sceneState.time;forceDraw=true;draw(filmTime);},
  metrics(){return {time:filmTime,paused,scene:sceneState.index+1,waiting:sceneState.waiting,restarting:sceneState.restarting,advances,rendered,renderMs:Math.round(frameMs*10)/10,programs:renderer.info.programs.length,baselinePrograms,frames:frameProfile(),panels:solar.panels,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray()};},
  dispose(){renderer.setAnimationLoop(null);observer.disconnect();scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const material of Array.isArray(obj.material)?obj.material:[obj.material])material.dispose();}});composer.dispose();renderer.dispose();}
 };
}
