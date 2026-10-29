import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {panelSurface,collectionPath,acPath} from './electrical-paths.js';
import {SUN_DIRECTION} from './choreography.js';

export function buildPowerSystem(scene,m,assets,u){
  const group=new THREE.Group();scene.add(group);
  const inverterEffects=[];
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  function box(w,h,d,material,x,y,z){const o=new THREE.Mesh(boxGeometry,material);o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
  function rod(a,b,r=.04,material=m.steel){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),material);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());mesh.castShadow=true;group.add(mesh);return mesh;}
  // Energy control building, carrying the parent brand.
  box(8,.2,6,m.concrete,7,.03,19);
  box(7,3.5,5,m.wall,7,1.85,19);
  box(7.5,.17,5.5,m.darkSteel,7,3.68,19);
  box(6.4,1.25,.08,m.white,7,2.8,21.55);
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.1),new THREE.MeshBasicMaterial({map:assets.energyLogo,transparent:true,toneMapped:false}));logo.position.set(7,2.8,21.6);group.add(logo);
  box(.95,2.1,.06,m.darkSteel,8.8,1.2,21.56);
  for(let k=0;k<8;k++)box(1.2,.035,.05,m.darkSteel,5.5,.85+k*.12,21.56);
  // String inverters, cable glands, ventilation, DC and AC cable trunks.
  for(let i=0;i<4;i++){
    const z=9-i*3.1;
    box(1.5,.18,1.5,m.concrete,5,.1,z);
    const housing=m.white.clone();housing.emissive.set('#8ccf3b');housing.emissiveIntensity=0;
    const cabinet=box(.92,1.9,.55,housing,5,1.15,z);
    const edgeMaterial=new THREE.LineBasicMaterial({color:new THREE.Color('#e4f49a').multiplyScalar(3),transparent:true,opacity:0,depthWrite:false,toneMapped:false});
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.93,1.91,.56)),edgeMaterial);edge.position.copy(cabinet.position);group.add(edge);
    box(.8,.08,.58,m.darkSteel,5,2.12,z);
    box(.42,.22,.025,m.black,5,1.58,z+.29);
    const indicator=new THREE.MeshBasicMaterial({color:'#25492e',toneMapped:false});
    box(.27,.038,.03,indicator,5,1.59,z+.306);
    inverterEffects.push({housing,edgeMaterial,indicator});
    for(let k=0;k<6;k++)box(.63,.022,.018,m.darkSteel,5,.72+k*.065,z+.29);
    for(const x of [4.75,5,5.25])rod([x,.18,z],[x,.42,z],.025,m.black);
  }
  box(1,.12,16,m.darkSteel,5,.11,3);
  // Oil-cooled transformer: core, radiators, expansion tank and ceramic bushings.
  box(13,.2,19,m.concrete,16,.035,-5);
  box(3.3,.24,5,m.darkSteel,15,.25,-5);
  const transformerPaint=new THREE.MeshPhysicalMaterial({color:'#73847e',metalness:.4,roughness:.38,clearcoat:.35,normalMap:assets.asphaltNormal,normalScale:new THREE.Vector2(.04,.04)});
  transformerPaint.emissive.set('#85bf3c');transformerPaint.emissiveIntensity=0;
  box(2.7,2.5,3.7,transformerPaint,15,1.6,-5);
  for(const z of [-6.88,-3.12]){for(const x of [13.9,16.1])for(const y of [.65,1.5,2.35]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.04,6),m.steel);bolt.rotation.x=Math.PI/2;bolt.position.set(x,y,z);group.add(bolt);}}
  box(.6,.33,.02,m.white,15,2,-3.13);
  const hazard=new THREE.Shape();hazard.moveTo(-.14,0);hazard.lineTo(.14,0);hazard.lineTo(0,.25);hazard.closePath();const warning=new THREE.Mesh(new THREE.ShapeGeometry(hazard),new THREE.MeshBasicMaterial({color:'#e9b74e'}));warning.position.set(15,1.15,-3.12);group.add(warning);
  box(3.05,.15,4.1,m.steel,15,2.95,-5);
  const radiator=m.steel.clone();radiator.emissive.set('#9bd847');radiator.emissiveIntensity=0;
  for(let i=0;i<19;i++)for(const x of [13.2,16.8])box(.6,2.0,.065,radiator,x,1.5,-6.65+i*.18);
  const transformerEdgeMaterial=new THREE.LineBasicMaterial({color:new THREE.Color('#c4e869').multiplyScalar(3),transparent:true,opacity:0,depthWrite:false,toneMapped:false});
  const transformerEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.72,2.52,3.72)),transformerEdgeMaterial);transformerEdge.position.set(15,1.6,-5);group.add(transformerEdge);
  const transformerGlow=new THREE.PointLight('#a4d85d',0,8,2);transformerGlow.position.set(15,2.6,-2.9);group.add(transformerGlow);
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,3.2,28),m.steel);tank.rotation.z=Math.PI/2;tank.position.set(15,3.25,-6.3);group.add(tank);
  function insulator(x,y,z){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.075,.1,.9,16),m.white);stem.position.set(x,y+.45,z);group.add(stem);for(let j=0;j<9;j++){const rib=new THREE.Mesh(new THREE.TorusGeometry(.13,.026,6,16),m.white);rib.rotation.x=Math.PI/2;rib.position.set(x,y+.1+j*.085,z);group.add(rib);}rod([x,y+.85,z],[x,y+1.02,z],.06,m.steel);}
  for(const x of [14.1,15,15.9]){insulator(x,3.0,-4.4);insulator(x,3.0,-5.6);}
  for(let i=0;i<3;i++){
    const x=11+i*4;
    rod([x,0,-13],[x,6.5,-13],.1,m.darkSteel);
    insulator(x,5.4,-13);rod([14.1+i*.9,4.02,-4.4],[x,6.42,-13],.025,m.steel);
  }
  rod([10,6.5,-13],[20,6.5,-13],.065,m.steel);
  // Switching gantry and three-phase breakers complete the production system.
  for(const x of [9,22]){rod([x,0,-18],[x,9,-18],.13,m.darkSteel);rod([x,7.5,-18],[x===9?22:9,9,-18],.06,m.steel);}
  rod([9,9,-18],[22,9,-18],.15,m.darkSteel);
  for(let phase=0;phase<3;phase++){
    const x=11.5+phase*4;
    box(1.6,1.5,1.4,transformerPaint,x,.85,-17.3);
    insulator(x,1.6,-17.3);insulator(x,2.7,-17.3);insulator(x,3.8,-17.3);
    rod([x,4.85,-17.3],[x,7.8,-18],.035,m.steel);
    box(.55,.7,.4,m.darkSteel,x,1.2,-16.4);
    box(.08,.05,.025,m.greenLight,x,1.4,-16.18);
  }
  // Steel lattice transmission towers, rather than decorative poles.
  const towers=[[15,-28],[28,-72],[44,-125]];
  for(const [x,z] of towers){
    for(const side of [-1,1])for(const depth of [-1,1])rod([x+side*2.6,0,z+depth*2.6],[x+side*.65,21,z+depth*.65],.10,m.darkSteel);
    for(let h=0;h<18;h+=3.5){const w=lerp(2.6,.65,h/21),w2=lerp(2.6,.65,(h+3.5)/21);for(const side of [-1,1]){rod([x-w,h,z+side*w],[x+w2,h+3.5,z+side*w2],.035);rod([x+w,h,z+side*w],[x-w2,h+3.5,z+side*w2],.035);rod([x+side*w,h,z-w],[x+side*w2,h+3.5,z+w2],.035);rod([x+side*w,h,z+w],[x+side*w2,h+3.5,z-w2],.035);}}
    for(const h of [14,18]){rod([x-5,h,z],[x+5,h,z],.08);rod([x-5,h,z],[x,h+2,z],.045);rod([x+5,h,z],[x,h+2,z],.045);}
  }
  // Curved three-phase conductors leave the GES for the grid, not the station.
  const conductorCurves=[];
  for(let phase=0;phase<3;phase++){
    const dx=(phase-1)*3.8;
    const pts=[[11+phase*4,6.42,-13],[15+dx,15,-28],[21+dx,11,-49],[28+dx,15,-72],[36+dx,10,-99],[44+dx,15,-125]];
    const curve=new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v)));conductorCurves.push(curve);
    const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,90,.023,4,false),m.darkSteel);group.add(cable);
  }
  const pulseMaterial=(color,start,end)=>new THREE.ShaderMaterial({uniforms:{uTime:u.time,uColor:{value:new THREE.Color(color)},uStart:{value:start},uEnd:{value:end}},transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uStart,uEnd;void main(){float activation=smoothstep(uStart,uStart+.15,uTime)*(1.-smoothstep(uEnd+.15,uEnd+.8,uTime));float head=clamp((uTime-uStart)/(uEnd-uStart),0.,1.);float d=head-vUv.x;float pulse=exp(-max(d,0.)*13.)*smoothstep(-.008,.008,d);vec3 light=mix(uColor,vec3(1.,1.,.8),pow(pulse,2.));gl_FragColor=vec4(light*(2.2+pulse*5.),(.025+pulse*.95)*activation);}'});
  const collection=pulseMaterial('#9adf3d',11.9,14.2),distribution=pulseMaterial('#8ddb32',20.1,22.6);
  const photons=new THREE.ShaderMaterial({uniforms:{uTime:u.time},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;void main(){float activation=smoothstep(.5,1.3,uTime)*(1.-smoothstep(11.4,12.2,uTime));float head=fract(uTime*.58);float pulse=exp(-pow((vUv.x-head)*12.,2.));float feather=pow(sin(vUv.y*3.14159),2.);float approach=.25+.75*smoothstep(.1,.9,vUv.x);gl_FragColor=vec4(vec3(1.,.81,.50)*(1.8+pulse*2.4),(.035+pulse*.34)*feather*approach*activation);}'});
  // Multiple luminous pulses form a clear sun -> cells -> inverter -> transformer beat.
  for(let i=0;i<24;i++){
    const end=panelSurface(-68+(i%8)*7.86,1+Math.floor(i/8),.15,.006);
    const begin=end.clone().addScaledVector(new THREE.Vector3(...SUN_DIRECTION),110);
    const curve=new THREE.LineCurve3(begin,end);group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,1,.10,8,false),photons));
  }
  // Both the visible insulation and the explanatory light use the SAME curve.
  // DC is collected beneath the tilted modules, then drops into the cable tray.
  for(const row of [1,2,3,5,7]){
    const curve=collectionPath(row);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,220,.037,6,false),m.rubber));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,220,.065,6,false),collection));
  }
  const ac=acPath();
  group.add(new THREE.Mesh(new THREE.TubeGeometry(ac,100,.06,8,false),m.rubber));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(ac,100,.10,8,false),pulseMaterial('#b8e757',14.6,18.0)));
  // Transformer output overlays the actual bushing-to-gantry leads.
  for(let phase=0;phase<3;phase++){
    const curve=new THREE.LineCurve3(new THREE.Vector3(14.1+phase*.9,4.02,-4.4),new THREE.Vector3(11+phase*4,6.42,-13));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,1,.07,6,false),pulseMaterial('#b9e95c',18.9,20.1)));
  }
  for(const curve of conductorCurves)group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,100,.085,6,false),distribution));
  const smooth=THREE.MathUtils.smoothstep,indicatorColor=new THREE.Color('#a6de49');
  const envelope=(t,start,hold,end)=>smooth(t,start,start+.30)*(1-smooth(t,hold,end));
  return {group,update(t){
    for(let i=0;i<inverterEffects.length;i++){const effect=inverterEffects[i],strength=envelope(t,13.8+i*.16,15.1+i*.16,16.2+i*.16);effect.housing.emissiveIntensity=strength*.75;effect.edgeMaterial.opacity=strength*.85;effect.indicator.color.copy(indicatorColor).multiplyScalar(.15+strength*5);}
    const strength=envelope(t,17.75,19.4,20.7);transformerPaint.emissiveIntensity=strength*.50;radiator.emissiveIntensity=strength*.65;transformerEdgeMaterial.opacity=strength*.85;transformerGlow.intensity=strength*16;
  }};
}
const lerp=THREE.MathUtils.lerp;
