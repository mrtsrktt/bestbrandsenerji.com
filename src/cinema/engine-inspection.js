import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// An illustrative internal cutaway sits INSIDE the car's authored engine bay.
// The actual hood, engine, brake discs and calipers remain the entry geometry.
export function buildEngineInspection(car,vehicle,m){
  const hoodMaterials=[],engineMaterials=[],brakes=[];
  const hood=vehicle.getObjectByName('BodyHood');
  hood?.traverse(obj=>{if(obj.isMesh)for(const material of Array.isArray(obj.material)?obj.material:[obj.material])hoodMaterials.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});});
  const engine=vehicle.getObjectByName('Engine');
  engine?.traverse(obj=>{if(obj.isMesh)for(const material of Array.isArray(obj.material)?obj.material:[obj.material])engineMaterials.push({material,opacity:material.opacity});});
  // Opacity may animate; the opaque/transparent shader variant must stay fixed.
  for(const entry of [...hoodMaterials,...engineMaterials])entry.material.transparent=true;
  vehicle.traverse(obj=>{if(obj.isMesh&&/WheelFront.*Brake/.test(obj.name)){for(const material of Array.isArray(obj.material)?obj.material:[obj.material])brakes.push(material);}});
  const assembly=new THREE.Group();assembly.position.set(0,.65,1.90);car.add(assembly);
  const aluminum=new THREE.MeshPhysicalMaterial({color:'#a6b1b4',metalness:.88,roughness:.23,clearcoat:.2});
  const graphite=new THREE.MeshStandardMaterial({color:'#26383b',metalness:.65,roughness:.36});
  const copper=new THREE.MeshStandardMaterial({color:'#9b7050',metalness:.85,roughness:.28});
  const black=new THREE.MeshStandardMaterial({color:'#1a2125',roughness:.72});
  const white=new THREE.MeshStandardMaterial({color:'#d5dadd',roughness:.5,metalness:.12});
  function box(w,h,d,mat,x,y,z,r=.01){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;assembly.add(mesh);return mesh;}
  function cylinder(radius,length,mat,x,y,z,axis='y'){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,32),mat);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);mesh.castShadow=true;assembly.add(mesh);return mesh;}
  function pipe(points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,36,r,10,false),mat);assembly.add(mesh);}
  box(1.08,.055,.58,graphite,0,-.20,0);
  box(1.09,.045,.10,aluminum,0,.19,-.25);
  const pistons=[],rods=[],rings=[];
  for(let i=0;i<4;i++){
    const x=-.36+i*.24;
    const piston=cylinder(.092,.09,aluminum,x,0,0);pistons.push(piston);
    const ringSet=new THREE.Group();ringSet.position.set(x,.02,0);assembly.add(ringSet);rings.push(ringSet);
    for(let j=0;j<3;j++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.0925,.0012,8,64),graphite);ring.rotation.x=Math.PI/2;ring.position.y=-j*.008;ringSet.add(ring);}
    const crown=new THREE.Mesh(new THREE.TorusGeometry(.086,.002,8,64),aluminum);crown.rotation.x=Math.PI/2;crown.position.set(x,.047,0);assembly.add(crown);piston.add(crown);crown.position.set(0,.047,0);
    const rod=cylinder(.018,.16,copper,x,-.10,0);rods.push(rod);
    cylinder(.022,.12,white,x,.19,-.18);cylinder(.012,.04,copper,x,.27,-.18);
    for(const z of [-.14,.14])cylinder(.014,.12,aluminum,x,.12,z);
    pipe([[x,.28,-.18],[x,.32,-.22],[x+.02,.30,-.28]],.011,black);
  }
  const crank=cylinder(.025,1.04,aluminum,0,-.16,0,'x');
  for(const x of [-.47,-.12,.12,.47]){cylinder(.065,.045,graphite,x,-.16,0,'x');}
  for(const z of [-.18,.18]){cylinder(.019,1.05,aluminum,0,.15,z,'x');for(let i=0;i<8;i++)cylinder(.033,.025,graphite,-.43+i*.12,.15,z,'x');}
  for(const x of [-.49,.49])for(const z of [-.25,.25])cylinder(.018,.025,aluminum,x,.22,z);
  pipe([[-.56,.04,.2],[-.59,.17,.27],[-.32,.25,.31],[.20,.22,.32],[.51,.10,.24]],.027,black);
  pipe([[-.52,-.16,-.2],[-.57,-.12,-.25],[-.55,.12,-.29]],.018,copper);
  const diagnosticLight=new THREE.PointLight('#c9e5df',0,1.6,2);diagnosticLight.position.set(0,1.05,2);car.add(diagnosticLight);
  return {update(t,close){
    const reveal=THREE.MathUtils.smoothstep(t,29.8,31.4)*(1-THREE.MathUtils.smoothstep(t,34.3,35.5));
    for(const s of hoodMaterials){s.material.opacity=s.opacity*(1-reveal*.93);s.material.depthWrite=reveal>.01?false:s.depthWrite;}
    for(const s of engineMaterials){s.material.opacity=s.opacity*(1-reveal*.88);s.material.depthWrite=reveal<.1;}
    assembly.visible=reveal>.05;diagnosticLight.intensity=reveal*1.8;
    for(let i=0;i<4;i++){const travel=Math.sin((t-31)*2.1+(i%2)*Math.PI)*.045;pistons[i].position.y=travel;rings[i].position.y=travel+.02;rods[i].position.y=travel*.5-.1;}
    crank.rotation.x=(t-31)*2.1;
    const brakePulse=THREE.MathUtils.smoothstep(t,28,28.5)*(1-THREE.MathUtils.smoothstep(t,30,30.5));
    for(const material of brakes){material.emissive?.set('#78b828');material.emissiveIntensity=brakePulse*.32;}
  }};
}
