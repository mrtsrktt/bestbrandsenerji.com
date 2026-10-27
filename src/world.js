import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
function smooth(a,b,v){ const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t); }

export function createWorld(canvas, {reducedMotion, onProgress}) {
  const mobile = () => innerWidth <= 720;
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#0b1815');
  scene.background = bg;
  scene.fog = new THREE.FogExp2(bg, .022);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile()?1.5:1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 150);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const envMap = pmrem.fromScene(environment, .04);
  scene.environment = envMap.texture;
  scene.environmentIntensity = .38;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#c6decd','#18281a',1.05));
  const sun = new THREE.DirectionalLight('#f2d5a0',3.4);
  sun.position.set(-12,17,5);
  sun.castShadow=true;
  sun.shadow.mapSize.set(mobile()?1024:2048,mobile()?1024:2048);
  sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;
  sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;sun.shadow.radius=3;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#9cbba9',1.4);rim.position.set(12,8,-12);scene.add(rim);
  const light = new THREE.PointLight('#c8f486',30,18,2);light.position.set(0,2,0);scene.add(light);
  const world = new THREE.Group();scene.add(world);
  world.rotation.y = -.10;

  const mat = (color, roughness=.6, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const materials={earth:mat('#18221a',.95),edge:mat('#3c4937',.82),grass:mat('#354631',.95),dark:mat('#101f1c',.75),road:mat('#182c26',.96),frame:mat('#9ba99d',.3,.8),white:mat('#b3c2b5',.35,.35),roof:mat('#657d70',.38,.65),black:mat('#101a19',.3,.4),lime:mat('#b9de81',.5,.15),mark:mat('#a7b293',.8)};
  const glowMat=new THREE.MeshBasicMaterial({color:'#d0ed99',toneMapped:false});
  const amberMat=new THREE.MeshBasicMaterial({color:'#efcf95',toneMapped:false});
  const geometryCache=new Map();
  function box(w,h,d,material,x=0,y=0,z=0,parent=world,radius=0){
    const key=`${w}:${h}:${d}:${radius}`;
    let geometry=geometryCache.get(key);
    if(!geometry){ geometry=radius?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d);geometryCache.set(key,geometry); }
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function line(points,color='#9bbf71',opacity=.5,parent=world){const m=new THREE.LineBasicMaterial({color,transparent:true,opacity});const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),m);parent.add(l);return l;}

  // Contoured, layered ground. Rounded edges catch the morning light.
  box(25.6,.55,17.6,materials.earth,0,-.72,0,world,.3);
  box(25.35,.13,17.35,materials.edge,0,-.39,0,world,.15);
  box(25.1,.22,17.1,materials.grass,0,-.23,0,world,.15);
  box(24.9,.05,16.9,mat('#293c2c',1),0,-.095,0,world,.1);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),mat('#0c1b15',1));ground.rotation.x=-Math.PI/2;ground.position.y=-1.2;ground.receiveShadow=true;scene.add(ground);
  // Delicate topographical contours surround the developed land.
  for(let i=0;i<13;i++){
    const points=[];const sx=15+i*1.1,sz=11+i*.7;
    for(let j=0;j<=160;j++){const a=j/160*Math.PI*2;const n=.5*Math.sin(a*5+i*.18)+.25*Math.sin(a*9);points.push([Math.cos(a)*(sx+n),-.98,Math.sin(a)*(sz+n)]);}
    line(points,'#829963',.07-i*.003);
  }
  // Land survey ticks, a quiet reference to engineering precision.
  for(let x=-11;x<=11;x+=2){line([[x,.003,7.9],[x,.003,8.15]],'#b4be94',.34);}
  for(let z=-7;z<=7;z+=2){line([[12,.003,z],[12.3,.003,z]],'#b4be94',.3);}

  // Physical photovoltaic glass; cell borders and fine conducting fingers
  // are generated in the material, avoiding hundreds of tiny mesh objects.
  const panelMaterial = new THREE.MeshPhysicalMaterial({color:'#102c3b',metalness:.38,roughness:.38,clearcoat:.8,clearcoatRoughness:.3});
  panelMaterial.onBeforeCompile = shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vPanelUV;').replace('#include <uv_vertex>','#include <uv_vertex>\nvPanelUV = uv;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vPanelUV;').replace('#include <color_fragment>',`#include <color_fragment>
      vec2 cell = fract(vPanelUV * vec2(6.,12.));
      vec2 aa=fwidth(vPanelUV*vec2(6.,12.))*.65;
      float border = smoothstep(vec2(.012),vec2(.012)+aa,cell).x*smoothstep(vec2(.012),vec2(.012)+aa,cell).y*(1.-smoothstep(.988-aa.x,.988,cell.x))*(1.-smoothstep(.988-aa.y,.988,cell.y));
      diffuseColor.rgb=mix(vec3(.055,.085,.10),diffuseColor.rgb,border);
    `);
  };
  const panels=[];
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const g=new THREE.Group();world.add(g);
    const x=-9.7+col*2.12,z=-5.9+row*2.46;
    g.position.set(x,.53,z);g.rotation.x=.27;
    box(1.93,.085,2.17,materials.frame,0,0,0,g,.025);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.84,2.08),panelMaterial);glass.rotation.x=-Math.PI/2;glass.position.y=.047;glass.castShadow=true;g.add(glass);
    box(.038,.014,2.1,materials.frame,0,.053,0,g);
    for(const dx of [-.68,.68]){box(.055,.7,.055,materials.frame,x+dx,.23,z,world);}
    panels.push({g,x,z,row,col,glass,delay:(col+row)*.025});
  }
  // A service path separates arrays, with an electrical control cabinet.
  box(.58,.018,13,mat('#6d7655',1),.62,-.043,-.6);
  box(.7,1.1,.48,materials.white,.5,.52,-6.6,world,.035);
  box(.45,.03,.025,glowMat,.5,.83,-6.345);
  // Small, individually structured trees and planted strips.
  const treeTrunk=new THREE.CylinderGeometry(.035,.05,.6,5);
  const crown=new THREE.IcosahedronGeometry(.25,2);
  const trees=new THREE.Group();world.add(trees);
  const leafMaterials=['#3e5739','#5a7049','#334b35'].map(c=>mat(c,.95));
  function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);trees.add(g);const t=new THREE.Mesh(treeTrunk,mat('#625d3d'));t.position.y=.25;g.add(t);for(let k=0;k<9;k++){const a=k*2.4,r=k<6?.23:.12;const c=new THREE.Mesh(crown,leafMaterials[k%3]);c.position.set(Math.cos(a)*r,.75+(k%3)*.19,Math.sin(a)*r);c.scale.set(1,1.4,1);c.castShadow=true;g.add(c);}}
  for(let i=0;i<12;i++)tree(-11.6+i*1.9,-7.5,.75+(i%3)*.16);
  for(let i=0;i<7;i++)tree(11.5,-6+i*1.9,.85+(i%2)*.2);
  tree(1.4,1.8);tree(1.6,-5.9);tree(2.3,6.8);tree(10.2,6.6);

  // One continuous ribbon becomes the road leading into the inspection bays.
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-12.5,.04,6.6),new THREE.Vector3(-7,.04,6.7),new THREE.Vector3(.2,.04,6.5),new THREE.Vector3(5.7,.04,4.1),new THREE.Vector3(6.4,.04,.4),new THREE.Vector3(6.4,.04,-4.7)
  ],false,'catmullrom',.35);
  function ribbon(curve,width,material,y=.015){const verts=[],uv=[],indices=[];for(let i=0;i<=180;i++){const t=i/180,p=curve.getPoint(t),d=curve.getTangent(t),side=new THREE.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);for(const sign of [-1,1]){const q=p.clone().addScaledVector(side,sign);verts.push(q.x,y,q.z);uv.push(sign===-1?0:1,t);}if(i<180){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;world.add(mesh);return mesh;}
  ribbon(route,2.8,materials.edge,.006);ribbon(route,2.55,materials.road,.018);
  for(let i=0;i<32;i++){const p=route.getPoint(i/32),d=route.getTangent(i/32);const dash=box(.045,.012,.29,materials.mark,p.x,.038,p.z);dash.rotation.y=Math.atan2(d.x,d.z);}
  const roadEdges=[];
  for(const side of [-1,1]){const pts=[];for(let i=0;i<=160;i++){const p=route.getPoint(i/160),d=route.getTangent(i/160);pts.push([p.x-d.z*1.15*side,.041,p.z+d.x*1.15*side]);}roadEdges.push(line(pts,'#c4d7a2',.55));}
  const energyCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-9,1.1,-4),new THREE.Vector3(-5,1.05,0),new THREE.Vector3(-1,.17,4.5),new THREE.Vector3(2,.17,6),new THREE.Vector3(5.7,.17,4.1),new THREE.Vector3(6.4,.17,.4),new THREE.Vector3(6.4,.17,-3)]);
  const energyMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{uTime:{value:0},uVisibility:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uVisibility;void main(){float head=fract(uTime*.085);float d=mod(head-vUv.x+1.,1.);float trail=exp(-d*17.);float alpha=(.06+trail*.94)*uVisibility;gl_FragColor=vec4(vec3(.76,.98,.42)*(1.+trail*.8),alpha);}'});
  const energy=new THREE.Mesh(new THREE.TubeGeometry(energyCurve,160,.028,6,false),energyMaterial);world.add(energy);
  const energyOuter=new THREE.Mesh(new THREE.TubeGeometry(energyCurve,160,.12,6,false),new THREE.MeshBasicMaterial({color:'#b9ee70',transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending}));world.add(energyOuter);

  const station=new THREE.Group();station.position.set(6.1,0,-3.3);world.add(station);
  box(8.6,.12,6.3,mat('#737b62',.85),0,.035,0,station,.06);
  // Three open bays, translucent glazing, slender fascia and vertical cladding.
  box(7.8,2.3,.14,materials.white,0,1.2,-2.5,station);
  box(.16,2.3,4.9,materials.white,-3.82,1.2,-.1,station);
  box(.16,2.3,4.9,materials.white,3.82,1.2,-.1,station);
  for(const x of [-3.8,-1.28,1.28,3.8]){box(.14,2.4,.2,materials.frame,x,1.25,2.35,station);}
  box(8.12,.18,5.5,materials.roof,0,2.47,-.05,station,.04);
  box(8.15,.36,.13,materials.dark,0,2.35,2.71,station);
  box(8.2,.055,.06,glowMat,0,2.56,2.8,station);
  box(7.8,.3,.15,materials.white,0,2.18,2.56,station);
  for(const x of [-2.56,0,2.56]){
    box(2.18,.03,4.5,mat('#3f4e43'),x,.15,-.05,station);
    for(const offset of [-.67,.67]){box(.13,.05,3.7,materials.frame,x+offset,.19,.05,station);box(.025,.01,3.7,glowMat,x+offset,.22,.05,station);}
    box(1.7,.04,.15,materials.black,x,.24,.9,station);box(1.7,.04,.15,materials.black,x,.24,-.9,station);
    // Overhead inspection ring.
    box(.055,1.95,.055,materials.frame,x-1,1.13,0,station);box(.055,1.95,.055,materials.frame,x+1,1.13,0,station);box(2.05,.055,.055,materials.frame,x,2.1,0,station);
    box(.025,1.8,.025,glowMat,x-1.02,1.15,.04,station);box(.025,1.8,.025,glowMat,x+1.02,1.15,.04,station);
    box(1.5,.03,.085,glowMat,x,2.35,.4,station);
  }
  // Clerestory glazing and service wing.
  const glassMat = new THREE.MeshPhysicalMaterial({color:'#3c6661',metalness:.4,roughness:.12,transparent:true,opacity:.72});
  box(1.3,1.9,4.8,materials.dark,4.5,1.02,-.1,station,.04);
  for(let i=0;i<7;i++)box(.024,1.9,4.8,materials.frame,3.9+i*.18,1.02,-.1,station);
  box(1.33,1.2,.025,glassMat,4.5,1.35,2.32,station);
  box(1.6,.16,5.1,materials.roof,4.5,2.08,-.1,station,.04);
  for(let z=-1.8;z<2;z+=.33)box(8,.014,.025,materials.frame,0,2.57,z,station);
  // Architectural lettering, rendered locally as a texture.
  function textSprite(text,color='#dbe7ce',size=60){const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const ctx=cv.getContext('2d');ctx.clearRect(0,0,1024,128);ctx.font=`500 ${size}px sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,64);const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(3.15,.4),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));}
  const sign=textSprite('BEST BRANDS  /  ARAÇ MUAYENE');sign.position.set(0,2.37,2.79);station.add(sign);
  for(let x=-3.1;x<=3.2;x+=2.55){const bollard=box(.06,.55,.06,materials.frame,x,.38,3.7,station);box(.065,.09,.065,amberMat,x,.65,3.7,station);}
  const scan=new THREE.Group();station.add(scan);scan.position.x=.3;
  const scanMat=new THREE.MeshBasicMaterial({color:'#c7f18c',transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const scanPlane=new THREE.Mesh(new THREE.PlaneGeometry(2,1.9),scanMat);scanPlane.position.y=1.15;scan.add(scanPlane);
  line([[-1,.18,0],[-1,2.1,0],[1,2.1,0],[1,.18,0]],'#d6ffac',.8,scan);

  // Bespoke vehicle: continuous body and canopy, separate alloys, lights and trim.
  const car=new THREE.Group();world.add(car);car.scale.setScalar(.77);
  function loft(sections,material){const positions=[],indices=[];const ring=8;for(const [z,w,y,h]of sections){positions.push(-w*.8,y,z,-w,y+h*.18,z,-w,y+h*.72,z,-w*.8,y+h,z,w*.8,y+h,z,w,y+h*.72,z,w,y+h*.18,z,w*.8,y,z);}for(let i=0;i<sections.length-1;i++)for(let j=0;j<ring;j++){const a=i*ring+j,b=i*ring+(j+1)%ring,c=a+ring,d=b+ring;indices.push(a,c,b,b,c,d);}indices.push(0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7);const end=(sections.length-1)*ring;for(let j=1;j<ring-1;j++)indices.push(end,end+j+1,end+j);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;car.add(m);return m;}
  const paint=new THREE.MeshPhysicalMaterial({color:'#d9ddcc',metalness:.65,roughness:.24,clearcoat:1,clearcoatRoughness:.13});
  loft([[-1.8,.58,.28,.32],[-1.55,.8,.23,.52],[-.7,.85,.23,.56],[.8,.83,.23,.53],[1.5,.75,.28,.43],[1.8,.58,.35,.27]],paint);
  loft([[-.95,.69,.73,.02],[-.5,.59,.73,.6],[.53,.58,.73,.58],[1.04,.69,.73,.02]],new THREE.MeshPhysicalMaterial({color:'#142b2d',roughness:.12,metalness:.65,clearcoat:1}));
  box(1.09,.045,.86,paint,0,1.35,.02,car,.04);
  box(.045,.58,.05,paint,-.61,1.03,-.05,car);box(.045,.58,.05,paint,.61,1.03,-.05,car);
  const wheels=[];for(const x of [-.82,.82])for(const z of [-1.1,1.05]){
    const wheel=new THREE.Group();wheel.position.set(x,.35,z);car.add(wheel);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.19,24),mat('#101514',.9));tire.rotation.z=Math.PI/2;wheel.add(tire);tire.castShadow=true;
    const alloy=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.195,16),materials.frame);alloy.rotation.z=Math.PI/2;wheel.add(alloy);
    const center=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.2,12),materials.black);center.rotation.z=Math.PI/2;wheel.add(center);wheels.push(wheel);
  }
  for(const x of [-.46,.46]){box(.31,.055,.035,amberMat,x,.65,-1.73,car,.01);box(.28,.045,.035,new THREE.MeshBasicMaterial({color:'#e57959',toneMapped:false}),x,.66,1.72,car,.01);box(.14,.1,.2,paint,x*1.88,.98,-.22,car,.025);}
  box(.73,.08,.025,materials.black,0,.44,-1.805,car);box(.27,.08,.028,materials.white,0,.48,-1.825,car);

  // Fine suspended dust catches the light without resembling fireworks.
  const dustGeo=new THREE.BufferGeometry();const dustPositions=[];
  for(let i=0;i<80;i++){const a=i*2.39996,r=2+Math.sqrt(i)*1.25;dustPositions.push(Math.cos(a)*r,.4+(Math.sin(i*6.13)*.5+.5)*7,Math.sin(a)*r);}
  dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#d9dfb4',size:.023,transparent:true,opacity:.28,depthWrite:false}));world.add(dust);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.26,.5,.91);composer.addPass(bloom);composer.addPass(new OutputPass());
  const solarMarker=document.querySelector('#solar-marker'),stationMarker=document.querySelector('#station-marker');
  const rect=()=>canvas.parentElement.getBoundingClientRect();
  let width=1,height=1;
  function resize(){const r=rect();width=r.width;height=r.height;renderer.setSize(width,height,false);composer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
  const cameraState={x:23,y:21,z:30,tx:0,ty:0,tz:0};
  const timeline=gsap.timeline({paused:true});
  timeline.to(cameraState,{x:21,y:19,z:28,tx:0,ty:0,tz:.3,duration:7,ease:'sine.inOut'},0)
    .to(cameraState,{x:23,y:13,z:24,tx:4,ty:.5,tz:-1,duration:7,ease:'power2.inOut'},7)
    .to(cameraState,{x:25,y:23,z:31,tx:0,ty:0,tz:0,duration:6,ease:'power2.inOut'},16)
    .to(cameraState,{x:23,y:21,z:30,tx:0,ty:0,tz:0,duration:4,ease:'sine.inOut'},28);
  const reviewParams=new URLSearchParams(location.search);
  const initialTime=Number(reviewParams.get('time'));
  let storyTime=reviewParams.has('time')?clamp(initialTime||0,0,24):reducedMotion?20:0,elapsed=storyTime,paused=reviewParams.get('still')==='1',last=performance.now(),hidden=document.hidden;
  const scratch=new THREE.Vector3();
  const cameraTarget=new THREE.Vector3();
  function projectLabel(el,pos,opacity){scratch.copy(pos);world.localToWorld(scratch);scratch.project(camera);el.style.left=`${(scratch.x*.5+.5)*width}px`;el.style.top=`${(-scratch.y*.5+.5)*height}px`;el.style.opacity=String(opacity);el.style.visibility=scratch.z>1?'hidden':'visible';}
  function render(time){
    time=Number.isFinite(time)?time:performance.now();
    const dt=clamp((time-last)/1000,0,.05);last=time;
    if(!paused&&!hidden){storyTime=Math.min(storyTime+dt,24);elapsed+=dt;}
    timeline.time(storyTime,false);
    const inspection=smooth(7,13,storyTime)*(1-smooth(23,29,storyTime));
    const emergence=smooth(0,2,storyTime);
    panels.forEach(({g,x,z,row,col,delay})=>{
      const reveal=smooth(delay,1.3+delay,storyTime);
      const morph=row===4?smooth(6.6+col*.22,10.6+col*.22,storyTime)*(1-smooth(26,30,storyTime)):0;
      const destination=route.getPoint(.16+col*.11);
      const tangent=route.getTangent(.16+col*.11);
      g.position.set(lerp(x,destination.x,morph),lerp(.53+(1-reveal)*-.65,-.05,morph)+Math.sin(morph*Math.PI)*1.2,lerp(z,destination.z,morph));
      g.rotation.set(lerp(.27,0,morph),Math.atan2(tangent.x,tangent.z)*morph,0);
      g.scale.set(lerp(.92+.08*reveal,.05,morph),lerp(1,.25,morph),lerp(1,1.5,morph));
    });
    const pulseTime=paused?storyTime:elapsed;
    energyMaterial.uniforms.uTime.value=pulseTime;
    energyMaterial.uniforms.uVisibility.value=.5+.5*emergence;
    const p=energyCurve.getPoint((storyTime*.085)%1);light.position.copy(p);light.position.y+=1;
    light.intensity=12+inspection*13;
    scan.position.z=lerp(2,-2,(Math.sin(pulseTime*1.6)*.5+.5));scan.visible=inspection>.1;
    scanMat.opacity=.07+inspection*.12;
    const carT=lerp(.47,.91,smooth(7,16,storyTime));const cp=route.getPoint(carT);const tangent=route.getTangent(carT);
    car.position.set(cp.x+.25,.1,cp.z);car.rotation.y=Math.atan2(-tangent.x,-tangent.z);
    wheels.forEach(w=>w.rotation.x=-pulseTime*2);
    dust.rotation.y=pulseTime*.008;
    const mobileDistance=mobile()?1.08:1;
    camera.position.set(cameraState.x*mobileDistance,cameraState.y*mobileDistance,cameraState.z*mobileDistance);
    cameraTarget.set(cameraState.tx,cameraState.ty,cameraState.tz);
    camera.lookAt(cameraTarget);camera.updateMatrixWorld();world.updateMatrixWorld();
    projectLabel(solarMarker,new THREE.Vector3(-6,1.1,-5.5),mobile()?.75:(1-inspection*.9)*.9);
    projectLabel(stationMarker,new THREE.Vector3(7,3,-2),.25+inspection*.75);
    const chapter=storyTime<7?0:storyTime<16?1:2;
    const progress=chapter===0?storyTime/7:chapter===1?(storyTime-7)/9:(storyTime-16)/8;
    onProgress(chapter,progress);
    if(!hidden)composer.render();
  }
  renderer.setAnimationLoop(render);
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=performance.now();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);canvas.parentElement.classList.add('failed');});
  return {
    setPaused(value){paused=value;},
    seek(value){storyTime=clamp(value,0,31.99);elapsed=storyTime;},
    seekChapter(index){storyTime=[.8,8,18][index];elapsed=storyTime;},
    dispose(){renderer.setAnimationLoop(null);observer.disconnect();scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){const m=Array.isArray(obj.material)?obj.material:[obj.material];m.forEach(a=>a.dispose());}});composer.dispose();envMap.dispose();renderer.dispose();}
  };
}
