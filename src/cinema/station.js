import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildStation(scene,m,assets,uniforms){
  const g=new THREE.Group();g.position.set(68,0,-1);scene.add(g);
  const cache=new Map();
  function box(w,h,d,mat,x=0,y=0,z=0,parent=g,radius=0){const key=[w,h,d,radius].join(':');let geo=cache.get(key);if(!geo){geo=radius?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d);cache.set(key,geo);}const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function tube(a,b,r=.045,mat=m.steel,parent=g){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
  // Full-size inspection hall: 29m frontage, 30m long, 6m clear height.
  box(36,.2,42,m.concrete,2,-.11,1);
  box(26,.1,29,m.floor,0,.025,0);
  box(.3,6.7,30,m.wall,-13.4,3.35,0);
  box(.3,6.7,30,m.wall,13.4,3.35,0);
  box(27,6.7,.25,m.wall,0,3.35,-15);
  box(27.8,.18,31.5,m.white,0,6.65,0);
  // Standing-seam roof and roof-edge flashings.
  for(let x=-13.5;x<=13.5;x+=.45)box(.028,.065,31.5,m.steel,x,6.77,0);
  box(28,2.7,.4,m.white,0,6.6,15.65);
  box(28,.09,.42,m.brand,0,7.98,15.65);
  for(const x of [-13,-4.5,4.5,13]){
    box(.32,5.65,.4,m.darkSteel,x,2.83,15);
    for(const z of [-10,0,10]){box(.24,6.5,.24,m.darkSteel,x,3.25,z);}
  }
  // Individual wall panels, service conduit and wall guards.
  for(let z=-14;z<=14;z+=.75){box(.035,5.8,.025,m.steel,-13.2,3.2,z);box(.035,5.8,.025,m.steel,13.2,3.2,z);}
  for(const x of [-13.0,13.0]){tube([x,1.2,-14],[x,1.2,14],.05,m.darkSteel);tube([x,4.8,-14],[x,4.8,14],.025,m.steel);}
  // Exposed roof trusses, diagonal members, skylight strips and suspended LEDs.
  for(let z=-12;z<=12;z+=6){
    box(26,.15,.15,m.darkSteel,0,5.9,z);
    for(let x=-12;x<12;x+=4){tube([x,5.9,z],[x+2,6.45,z],.035,m.steel);tube([x+2,6.45,z],[x+4,5.9,z],.035,m.steel);}
    for(const x of [-8.8,0,8.8]){box(.16,.12,3.2,m.white,x,5.6,z);box(.12,.018,3.1,m.light,x,5.53,z);}
  }
  // A glazed office/service wing carries physical architectural detail.
  box(7,.15,26,m.concrete,17.2,.02,-1);
  box(7.4,.2,27,m.white,17.2,4.1,-1);
  box(.2,4,26,m.wall,20.8,2,-1);
  box(7,4,.2,m.wall,17.2,2,-14);
  box(7,.2,.18,m.brand,17.2,3.95,12.3);
  box(7,3.6,.035,m.glass,17.2,2,12.3);
  for(let x=13.8;x<=20.7;x+=1.15)box(.06,3.9,.07,m.darkSteel,x,2,12.35);
  box(6,.045,.045,m.steel,17.2,2.6,12.4);
  // Actual operating-company logos from Best Brands' public media library.
  for(const [texture,x,width] of [[assets.besteLogo,-6.2,7.2],[assets.esbiLogo,6.2,6.7]]){
    const ratio=texture.image.width/texture.image.height;
    const logo=new THREE.Mesh(new THREE.PlaneGeometry(width,width/ratio),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));logo.position.set(x,6.65,15.89);g.add(logo);
  }
  // Real floor markings and industrial rollers in all three lanes.
  const yellow=new THREE.MeshStandardMaterial({color:'#c5ac55',roughness:.7});
  const lanes=[-8.75,0,8.75];
  for(const x of lanes){
    for(const s of [-1,1]){
      box(.06,.009,26,yellow,x+s*2.45,.09,0);
      box(.65,.14,9,m.darkSteel,x+s*.96,.14,8, g,.025);
      box(.58,.04,8.8,m.steel,x+s*.96,.23,8);
      for(const z of [5.2,9.3])for(let j=0;j<3;j++){
        const roller=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.7,24),m.darkSteel);roller.rotation.z=Math.PI/2;roller.position.set(x+s*.96,.25,z+j*.28);roller.castShadow=true;g.add(roller);
      }
    }
    for(let z=-10;z<14;z+=3.5)box(.08,.008,1.4,m.white,x,.09,z);
    // Four-column precision measurement portal.
    for(const s of [-1,1]){
      box(.28,3.4,.42,m.white,x+s*1.8,1.8,1.5,g,.035);
      box(.08,2.8,.035,m.greenLight,x+s*1.8,1.9,1.73);
      box(.38,.5,.5,m.darkSteel,x+s*1.8,.3,1.5,g,.03);
      box(.16,.16,.06,m.black,x+s*1.8,2.7,1.76,g,.02);
    }
    box(3.9,.24,.45,m.white,x,3.52,1.5,g,.04);
    box(3.45,.035,.035,m.light,x,3.39,1.74);
    // Operator terminal and display.
    box(.12,1.35,.12,m.steel,x+2.6,.78,5.8);
    box(.72,.48,.09,m.black,x+2.6,1.62,5.8,g,.035);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.64,.38),new THREE.MeshBasicMaterial({color:'#12372d'}));screen.position.set(x+2.6,1.62,5.851);g.add(screen);
    for(let k=0;k<4;k++)box(.24+k*.08,.009,.004,m.greenLight,x+2.6,1.73-k*.06,5.855);
    box(.6,.045,.35,m.darkSteel,x+2.6,1.25,5.95);
  }
  // Parking guides, painted arrows and steel protection bollards.
  for(const x of [-12,-4.5,4.5,12]){box(.14,.9,.14,m.darkSteel,x,.45,17.7);box(.15,.12,.15,yellow,x,.74,17.7);}
  for(const x of [-8.75,0,8.75]){box(.15,.008,2,m.white,x,.015,22);const shape=new THREE.Shape();shape.moveTo(-.45,0);shape.lineTo(.45,0);shape.lineTo(0,1);shape.closePath();const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),m.white);arrow.rotation.x=-Math.PI/2;arrow.position.set(x,.022,20.8);g.add(arrow);}
  // A focused wash of ceiling light inside, with a moving scanner on the car.
  const interior=new THREE.PointLight('#d5e4ed',90,32,2);interior.position.set(0,4.8,5);g.add(interior);
  const fill=new THREE.PointLight('#c4dbe3',55,26,2);fill.position.set(0,4.6,-6);g.add(fill);
  const scanner=new THREE.Group();scanner.position.set(0,0,8);g.add(scanner);
  const scanMaterial=new THREE.ShaderMaterial({uniforms:{uTime:uniforms.time,uScan:uniforms.scan},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uScan;void main(){float edge=pow(abs(vUv.x-.5)*2.,5.);float raster=.3+.7*pow(max(0.,sin(vUv.y*220.+uTime*8.)),6.);gl_FragColor=vec4(vec3(.30,1.,.045),(.045+edge*.13)*raster*uScan);}'});
  const scanPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.5),scanMaterial);scanPlane.position.y=1.3;scanner.add(scanPlane);
  for(const x of [-1.7,1.7])box(.018,2.55,.018,m.greenLight,x,1.3,0,scanner);
  box(3.4,.018,.018,m.greenLight,0,2.57,0,scanner);
  box(3.4,.018,.018,m.greenLight,0,.035,0,scanner);
  // The vehicle uses authored bodywork, tire normals, interior and actual glass.
  const vehicle=assets.car.scene;
  vehicle.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(vehicle),size=bounds.getSize(new THREE.Vector3());
  const scale=4.8/Math.max(size.x,size.z);
  vehicle.scale.multiplyScalar(scale);vehicle.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(vehicle),center=b2.getCenter(new THREE.Vector3());
  vehicle.position.sub(new THREE.Vector3(center.x,b2.min.y,center.z));
  const car=new THREE.Group();car.add(vehicle);g.add(car);car.rotation.y=Math.PI;
  vehicle.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;obj.receiveShadow=true;
    if(/License|Emblem/i.test(obj.name)){obj.visible=false;return;}
    if(!obj.material)return;
    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const altered=source.map(original=>{const mm=original.clone();
      if(/Paint 1/i.test(mm.name)){mm.color.set('#b0b7bc');mm.metalness=.72;mm.roughness=.28;mm.iridescence=0;mm.clearcoat=1;mm.normalScale?.set(.12,.12);}
      if(/Paint 2/i.test(mm.name)){mm.color.set('#1d282f');mm.metalness=.75;mm.roughness=.28;mm.iridescence=0;}
      if(mm.map&&/Panel/i.test(mm.name))mm.map=null;
      if(/Tireside/i.test(mm.name)){mm.map=null;mm.color.set('#15191c');}
      if(/Headlight/i.test(mm.name)){mm.emissive?.set('#d5e8f0');mm.emissiveIntensity=1.5;}
      if(/Glass/i.test(mm.name)){mm.color.set('#b7cbd2');mm.roughness=.08;mm.transmission=.6;}
      return mm;});obj.material=Array.isArray(obj.material)?altered:altered[0];
  });
  // Soft contact occlusion grounds the wheels even inside the indirect light.
  const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');const grad=ctx.createRadialGradient(64,64,10,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.65)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.5,6.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,opacity:.65}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.16;car.add(shadow);
  return {group:g,car,scanner,interior};
}
