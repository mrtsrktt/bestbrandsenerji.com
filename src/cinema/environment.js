import * as THREE from 'three';

export function buildLandscape(scene,m,assets){
  const terrain=new THREE.PlaneGeometry(700,700,220,220);terrain.rotateX(-Math.PI/2);
  const position=terrain.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i);
    const outside=THREE.MathUtils.smoothstep(Math.max(Math.abs(x-4)/130,Math.abs(z+20)/115),1,1.8);
    const undulation=Math.sin(x*.023+z*.013)*2.4+Math.sin(z*.052-x*.017)*1.3+Math.sin(x*.24+z*.15)*.08;
    position.setY(i,-.06+outside*undulation);
  }
  terrain.computeVertexNormals();const earth=new THREE.Mesh(terrain,m.ground);earth.receiveShadow=true;scene.add(earth);
  // Gravel pads are flush with the landscape; there is no display platform.
  const padColor=m.concrete.map.clone(),padNormal=m.concrete.normalMap.clone();
  for(const tex of [padColor,padNormal]){tex.repeat.set(41,58);tex.needsUpdate=true;}
  const pad=new THREE.Mesh(new THREE.PlaneGeometry(82,116),new THREE.MeshStandardMaterial({color:'#8d8879',map:padColor,normalMap:padNormal,normalScale:new THREE.Vector2(.3,.3),roughness:1}));pad.rotation.x=-Math.PI/2;pad.position.set(-38,-.025,-25);pad.receiveShadow=true;scene.add(pad);
  const route=new THREE.CatmullRomCurve3([new THREE.Vector3(-140,.02,40),new THREE.Vector3(-65,.02,40),new THREE.Vector3(4,.02,40),new THREE.Vector3(40,.02,40),new THREE.Vector3(61,.02,34),new THREE.Vector3(68,.02,23),new THREE.Vector3(68,.02,15)],false,'catmullrom',.35);
  const vertices=[],uv=[],idx=[];
  for(let i=0;i<=240;i++){const t=i/240,point=route.getPoint(t),tangent=route.getTangent(t),side=new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(4.1);for(const s of [-1,1]){const q=point.clone().addScaledVector(side,s);vertices.push(q.x,.025,q.z);uv.push(s===-1?0:1,t);}if(i<240){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const road=new THREE.Mesh(geo,m.road);road.receiveShadow=true;scene.add(road);
  const dashGeo=new THREE.BoxGeometry(.12,.012,2.4),dashMat=new THREE.MeshStandardMaterial({color:'#d8d8c6',roughness:.8});
  for(let i=0;i<47;i++){const t=i/47,p=route.getPoint(t),d=route.getTangent(t);const dash=new THREE.Mesh(dashGeo,dashMat);dash.position.copy(p);dash.position.y=.045;dash.rotation.y=Math.atan2(d.x,d.z);scene.add(dash);}
  // Low concrete curbs and drainage follow the road instead of floating beside it.
  for(const sign of [-1,1]){
    const curbPoints=[];
    for(let i=0;i<=160;i++){const p=route.getPoint(i/160),d=route.getTangent(i/160);p.add(new THREE.Vector3(-d.z,0,d.x).normalize().multiplyScalar(sign*4.25));p.y=.035;curbPoints.push(p);}
    const curb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curbPoints),160,.065,5,false),m.concrete);curb.receiveShadow=true;scene.add(curb);
  }
  // Scanned geology gives the foreground an irregular, photographic silhouette.
  let seed=9317;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  assets.rock.scene.updateMatrixWorld(true);
  const rockBounds=new THREE.Box3().setFromObject(assets.rock.scene),rockSize=rockBounds.getSize(new THREE.Vector3());
  const rockBase=1/Math.max(rockSize.x,rockSize.z);
  const rockTransforms=[];const dummy=new THREE.Object3D();
  for(let i=0;i<75;i++){
    const t=random()*.92,p=route.getPoint(t),d=route.getTangent(t),side=new THREE.Vector3(-d.z,0,d.x).normalize();
    p.addScaledVector(side,(random()<.5?-1:1)*(5+random()*3.5));
    if((p.x>-80&&p.x<5&&p.z<33)||(p.x>51&&p.x<92&&p.z>-23&&p.z<23))continue;
    const scale=(.12+Math.pow(random(),2)*.8)*rockBase;
    dummy.position.set(p.x,-.1,p.z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.setScalar(scale);dummy.updateMatrix();rockTransforms.push(dummy.matrix.clone());
  }
  assets.rock.scene.traverse(obj=>{if(!obj.isMesh)return;const rocks=new THREE.InstancedMesh(obj.geometry,obj.material,rockTransforms.length);for(let i=0;i<rockTransforms.length;i++)rocks.setMatrixAt(i,rockTransforms[i].clone().multiply(obj.matrixWorld));rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);});
  // Slender, curved grass on the verges; no low-poly cones or geometric trees.
  const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.025,0,0,.025,0,0,.012,.19,.035,-.012,.19,.035,0,.34,.08],3));blade.setIndex([0,1,2,0,2,3,3,2,4]);blade.computeVertexNormals();
  const grass=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({color:'#7b8054',roughness:1,side:THREE.DoubleSide}),9000);
  const color=new THREE.Color();
  for(let i=0;i<9000;i++){
    const t=random(),p=route.getPoint(t),d=route.getTangent(t);p.add(new THREE.Vector3(-d.z,0,d.x).normalize().multiplyScalar((random()<.5?-1:1)*(4.55+random()*4)));
    const onPad=(p.x>-80&&p.x<5&&p.z<33)||(p.x>51&&p.x<92&&p.z>-23&&p.z<23);
    dummy.position.set(p.x,0,p.z);dummy.rotation.set(0,random()*6.28,0);dummy.scale.setScalar(onPad?0:.35+random()*.6);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,color.setHSL(.16+random()*.05,.2+random()*.15,.21+random()*.15));
  }
  grass.receiveShadow=true;scene.add(grass);
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
