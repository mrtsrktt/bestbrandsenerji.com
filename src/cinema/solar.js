import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildSolar(scene,materials,uniforms){
  const columns=58,rows=25,count=columns*rows;
  const panel=new THREE.MeshPhysicalMaterial({color:'#0b2339',metalness:.48,roughness:.23,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.5});
  panel.onBeforeCompile=shader=>{
    shader.uniforms.uFilmTime=uniforms.time;shader.uniforms.uEnergy=uniforms.energy;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCellUv;varying vec3 vSolarWorld;').replace('#include <uv_vertex>','#include <uv_vertex>\nvCellUv=uv;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec4 solarLocal=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      solarLocal=instanceMatrix*solarLocal;
      #endif
      vSolarWorld=(modelMatrix*solarLocal).xyz;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec2 vCellUv; varying vec3 vSolarWorld; uniform float uFilmTime; uniform float uEnergy;
      float aaLine(float v,float width){return 1.0-smoothstep(width,width+fwidth(v)*1.1,abs(v));}
    `).replace('#include <color_fragment>',`#include <color_fragment>
      vec2 cells=vCellUv*vec2(6.,12.);
      vec2 c=fract(cells);
      float gap=max(aaLine(c.x-.5,.008),aaLine(c.y-.5,.009));
      vec2 edge=min(c,1.-c);float border=1.-smoothstep(.006,.018,min(edge.x,edge.y));
      float corner=1.-smoothstep(.065,.085,edge.x+edge.y);
      float fingers=aaLine(fract(c.x*13.)-.5,.008)*.035;
      float bars=aaLine(fract(c.x*3.)-.5,.011);
      float variation=sin(floor(cells.x)*1.7+floor(cells.y)*2.31)*.035;
      diffuseColor.rgb*=1.+variation;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.13,.16),max(border,corner)*.8);
      diffuseColor.rgb+=vec3(fingers+bars*.024);
    `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float waveCenter=-65.+uFilmTime*12.;
      float wave=exp(-pow((vSolarWorld.x-waveCenter)*.22,2.));
      float drift=pow(max(0.,sin(vSolarWorld.z*.55-uFilmTime*2.4)),18.);
      float conduction=(border*.72+bars*.3+gap*.2)*wave;
      totalEmissiveRadiance+=vec3(1.,.66,.23)*wave*.2*uEnergy;
      totalEmissiveRadiance+=vec3(.27,.72,.055)*(conduction*6.+wave*.09+drift*border*.35)*uEnergy;
    `);
  };
  const panelGeo=new THREE.PlaneGeometry(1.185,2.335);panelGeo.rotateX(-Math.PI/2);panelGeo.translate(0,.048,0);
  const frames=new THREE.InstancedMesh(new RoundedBoxGeometry(1.25,.075,2.4,1,.012),materials.steel,count);
  const panels=new THREE.InstancedMesh(panelGeo,panel,count);
  const supports=new THREE.InstancedMesh(new THREE.BoxGeometry(.055,1.6,.055),materials.steel,count*2);
  frames.castShadow=true;frames.receiveShadow=true;panels.receiveShadow=true;
  const o=new THREE.Object3D();let i=0;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const x=-76+col*1.31,z=28-row*4.35;
    o.position.set(x,1.45,z);o.rotation.set(.38,0,0);o.scale.set(1,1,1);o.updateMatrix();frames.setMatrixAt(i,o.matrix);panels.setMatrixAt(i,o.matrix);
    for(let side=0;side<2;side++){o.position.set(x+(side? .42:-.42),.65,z);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();supports.setMatrixAt(i*2+side,o.matrix);}
    i++;
  }
  scene.add(frames,panels,supports);
  // Aluminum rail ends and conduits make the low flight read at a real scale.
  const railGeo=new THREE.BoxGeometry(77,.06,.065);const rails=new THREE.InstancedMesh(railGeo,materials.steel,rows*2);
  for(let r=0;r<rows;r++)for(let s=0;s<2;s++){o.position.set(-38,1.22+(s?.23:-.23),28-r*4.35+(s?.65:-.65));o.rotation.set(0,0,0);o.updateMatrix();rails.setMatrixAt(r*2+s,o.matrix);}rails.castShadow=true;scene.add(rails);
  // Perimeter fence, fine enough to remain a physical boundary, not decoration.
  const fencePoints=[];
  for(const x of [-79,3])for(let z=-81;z<=32;z+=4){fencePoints.push(new THREE.Vector3(x,0,z),new THREE.Vector3(x,1.9,z));}
  for(const x of [-79,3])for(const y of [.3,1.1,1.8])fencePoints.push(new THREE.Vector3(x,y,-81),new THREE.Vector3(x,y,32));
  const fence=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fencePoints),new THREE.LineBasicMaterial({color:'#7e8d8c',transparent:true,opacity:.38}));scene.add(fence);
  return {panels:count};
}
