import * as THREE from 'three';

export function buildLandscape(scene,m){
  const terrain=new THREE.PlaneGeometry(700,700,1,1);terrain.rotateX(-Math.PI/2);terrain.translate(0,-.06,0);
  terrain.computeVertexNormals();const earth=new THREE.Mesh(terrain,m.ground);earth.receiveShadow=true;scene.add(earth);
  // Gravel pads are flush with the landscape; there is no display platform.
  const pad=new THREE.Mesh(new THREE.PlaneGeometry(82,116),new THREE.MeshStandardMaterial({color:'#76756b',map:m.concrete.map,roughness:1}));pad.rotation.x=-Math.PI/2;pad.position.set(-38,-.025,-25);pad.receiveShadow=true;scene.add(pad);
  const route=new THREE.CatmullRomCurve3([new THREE.Vector3(-140,.02,40),new THREE.Vector3(-65,.02,40),new THREE.Vector3(4,.02,40),new THREE.Vector3(40,.02,40),new THREE.Vector3(61,.02,34),new THREE.Vector3(68,.02,23),new THREE.Vector3(68,.02,15)],false,'catmullrom',.35);
  const vertices=[],uv=[],idx=[];
  for(let i=0;i<=240;i++){const t=i/240,point=route.getPoint(t),tangent=route.getTangent(t),side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(4.1);for(const s of [-1,1]){const q=point.clone().addScaledVector(side,s);vertices.push(q.x,.025,q.z);uv.push(s===-1?0:1,t);}if(i<240){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const road=new THREE.Mesh(geo,m.road);road.receiveShadow=true;scene.add(road);
  const dashGeo=new THREE.BoxGeometry(.12,.012,2.4),dashMat=new THREE.MeshStandardMaterial({color:'#d8d8c6',roughness:.8});
  for(let i=0;i<47;i++){const t=i/47,p=route.getPoint(t),d=route.getTangent(t);const dash=new THREE.Mesh(dashGeo,dashMat);dash.position.copy(p);dash.position.y=.045;dash.rotation.y=Math.atan2(d.x,d.z);scene.add(dash);}
  return {route};
}

export function buildEnergy(scene,uniforms){
  // Physical-height light traces travel from panel conductors to the road.
  const paths=[
    [[-69,1.8,19],[-49,1.8,19],[-26,1.8,19],[-4,1.2,22],[5,.2,30],[17,.18,37],[42,.18,37],[61,.18,30],[67,.18,18]],
    [[-69,1.8,10],[-49,1.8,10],[-26,1.8,10],[-4,1.2,18],[5,.2,30],[17,.18,38],[42,.18,38],[61,.18,31],[68,.18,18]],
    [[-69,1.8,1],[-49,1.8,1],[-26,1.8,1],[-4,1.2,14],[5,.2,30],[17,.18,39],[42,.18,39],[61,.18,32],[69,.18,18]],
  ];
  const material=new THREE.ShaderMaterial({uniforms:{uTime:uniforms.time,uStrength:uniforms.energy},transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uStrength;void main(){float head=clamp((uTime-2.)/24.,0.,1.);float d=head-vUv.x;float trail=exp(-max(d,0.)*15.)*step(0.,d);float tail=pow(max(0.,sin(vUv.x*52.-uTime*3.)),14.)*.18;gl_FragColor=vec4(vec3(.34,.95,.065)*(2.+trail*3.),(.12+trail*.85+tail)*uStrength);}'});
  for(const points of paths){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,180,.018,6,false),material);scene.add(mesh);}
}
