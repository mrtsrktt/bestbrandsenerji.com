import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import styles from './NetworkMap.module.css';

type Location = { name: string; lat: number; lon: number; type: 'solar' | 'car' | 'hq'; label?: 'left' | 'right'; dx?: number; dy?: number };

const LOCATIONS: Location[] = [
  { name: 'Pazaryeri GES', lat: 39.99, lon: 29.90, type: 'solar', dx: 34, dy: -20 }, { name: 'Yahyalı GES', lat: 38.10, lon: 35.36, type: 'solar' },
  { name: 'Yalvaç GES', lat: 38.30, lon: 31.18, type: 'solar' }, { name: 'Aziziye GES', lat: 39.95, lon: 41.10, type: 'solar' },
  { name: 'Tatvan GES', lat: 38.50, lon: 42.28, type: 'solar', label: 'left', dx: -32, dy: -16 }, { name: 'Çalkışla / İspir GES', lat: 40.48, lon: 40.99, type: 'solar', label: 'left', dx: -44, dy: -18 },
  { name: 'Iğdır', lat: 39.92, lon: 44.04, type: 'car', dx: 36, dy: 10 }, { name: 'Ağrı', lat: 39.72, lon: 43.05, type: 'car', label: 'left', dx: 30, dy: 18 },
  { name: 'Erzurum Merkez', lat: 39.90, lon: 41.27, type: 'car', label: 'left', dx: -34, dy: 30 }, { name: 'Oltu', lat: 40.55, lon: 42.00, type: 'car', label: 'left', dx: 34, dy: -12 },
  { name: 'Kars', lat: 40.60, lon: 43.10, type: 'car', dx: 28, dy: 0 }, { name: 'Bitlis', lat: 38.40, lon: 42.11, type: 'car', label: 'left', dx: -44, dy: 34 },
  { name: 'Ardahan', lat: 41.11, lon: 42.70, type: 'car', dx: 4, dy: -28 }, { name: 'Van Merkez', lat: 38.50, lon: 43.38, type: 'car', label: 'left', dx: 38, dy: 32 },
  { name: 'Erciş', lat: 39.03, lon: 43.36, type: 'car', label: 'left', dx: -38, dy: -18 }, { name: 'Eskişehir Merkez 1', lat: 39.77, lon: 30.49, type: 'car', label: 'left', dx: -40, dy: 28 },
  { name: 'Eskişehir Merkez 2', lat: 39.77, lon: 30.60, type: 'car', dx: 42, dy: 26 }, { name: 'Sivrihisar', lat: 39.45, lon: 31.54, type: 'car', dx: 28, dy: 28 },
  { name: 'Bilecik Merkez', lat: 40.14, lon: 29.98, type: 'car', label: 'left', dx: -35, dy: -22 }, { name: 'Bozüyük', lat: 39.91, lon: 30.04, type: 'car', dx: 18, dy: 16 },
  { name: 'Holding Merkezi', lat: 41.09, lon: 29.09, type: 'hq' },
];
const BOUNDS = { west: 24, east: 47, north: 44, south: 34 };

function Symbol({ type }: Pick<Location, 'type'>) {
  if (type === 'solar') return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m18.6 3-10 14h7.1L13.8 29 24 13.8h-7.1L18.6 3Z" /></svg>;
  if (type === 'car') return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11.5"/><path className={styles.check} d="m10.2 16.4 3.7 3.7 8-8" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 27V9l9-5 9 5v18M12 11h2m4 0h2m-8 5h2m4 0h2m-8 5h2m4 0h2" /></svg>;
}

export function NetworkMap() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const pinsRef = useRef<Array<HTMLDivElement | null>>([]);
  const filmRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef({ start: 0, playing: false, completed: false });
  const [assetsReady, setAssetsReady] = useState(false);
  const [filmReady, setFilmReady] = useState(false);
  const [playId, setPlayId] = useState(0);
  const [stage, setStage] = useState<'idle' | 'flight' | 'network' | 'complete'>('idle');
  const pinPositions = useMemo(() => LOCATIONS.map((location) => ({ ...location, x: ((location.lon - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100, y: ((BOUNDS.north - location.lat) / (BOUNDS.north - BOUNDS.south)) * 100 })), []);

  const play = useCallback(() => {
    if (!assetsReady || !filmReady || animationRef.current.playing) return;
    if (filmRef.current) {
      filmRef.current.currentTime = 0;
      filmRef.current.playbackRate = 4;
      void filmRef.current.play();
    }
    setPlayId((value) => value + 1); setStage('flight');
    animationRef.current = { start: performance.now(), playing: true, completed: false };
  }, [assetsReady, filmReady]);

  useEffect(() => {
    const host = canvasHostRef.current, section = sectionRef.current;
    if (!host || !section) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.13; host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .01, 80), loader = new THREE.TextureLoader();
    const geo=(lat:number,lon:number)=>new THREE.Vector3(Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180),Math.sin(lat*Math.PI/180),-Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180)).normalize();
    const readiness={earth:false,map:false,space:false};const markReady=()=>{if(readiness.earth&&readiness.map&&readiness.space)setAssetsReady(true);};
    const mapPreload=new Image();mapPreload.onload=()=>{readiness.map=true;markReady();};mapPreload.src='/assets/turkey-satellite.jpg';
    const spacePreload=new Image();spacePreload.onload=()=>{readiness.space=true;markReady();};spacePreload.src='/assets/cinematic-starfield.png';
    const earthTexture = loader.load('/assets/earth-day-8k.jpg', () => { readiness.earth=true;markReady(); });
    earthTexture.colorSpace = THREE.SRGBColorSpace; earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();earthTexture.minFilter=THREE.LinearMipmapLinearFilter;earthTexture.magFilter=THREE.LinearFilter;earthTexture.generateMipmaps=true;
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 192), new THREE.MeshPhysicalMaterial({ map: earthTexture, roughness: .67, metalness: .01, clearcoat: .12, clearcoatRoughness: .78 })); scene.add(earth);
    const detailTexture=loader.load('/assets/turkey-satellite.jpg');detailTexture.colorSpace=THREE.SRGBColorSpace;detailTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();detailTexture.minFilter=THREE.LinearMipmapLinearFilter;detailTexture.magFilter=THREE.LinearFilter;
    const patchColumns=184,patchRows=88,patchPositions:number[]=[],patchUvs:number[]=[],patchIndices:number[]=[];
    for(let row=0;row<=patchRows;row++){const v=row/patchRows,lat=BOUNDS.south+(BOUNDS.north-BOUNDS.south)*v;for(let column=0;column<=patchColumns;column++){const u=column/patchColumns,lon=BOUNDS.west+(BOUNDS.east-BOUNDS.west)*u;const point=geo(lat,lon).multiplyScalar(1.003);patchPositions.push(point.x,point.y,point.z);patchUvs.push(u,v);}}
    for(let row=0;row<patchRows;row++){for(let column=0;column<patchColumns;column++){const a=row*(patchColumns+1)+column,b=a+1,c=a+patchColumns+1,d=c+1;patchIndices.push(a,c,b,b,c,d);}}
    const patchGeometry=new THREE.BufferGeometry();patchGeometry.setAttribute('position',new THREE.Float32BufferAttribute(patchPositions,3));patchGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(patchUvs,2));patchGeometry.setIndex(patchIndices);patchGeometry.computeVertexNormals();
    const smoothstep=(min:number,max:number,value:number)=>{const t=THREE.MathUtils.clamp((value-min)/(max-min),0,1);return t*t*(3-2*t);};const maskSize=256,maskData=new Uint8Array(maskSize*maskSize*4);for(let y=0;y<maskSize;y++){for(let x=0;x<maskSize;x++){const u=x/(maskSize-1),v=y/(maskSize-1),edge=Math.min(u,1-u,v,1-v),value=Math.round(smoothstep(0,.19,edge)*255),offset=(y*maskSize+x)*4;maskData[offset]=value;maskData[offset+1]=value;maskData[offset+2]=value;maskData[offset+3]=255;}}const detailMask=new THREE.DataTexture(maskData,maskSize,maskSize,THREE.RGBAFormat);detailMask.needsUpdate=true;
    const detailMaterial=new THREE.MeshBasicMaterial({map:detailTexture,alphaMap:detailMask,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});const detailPatch=new THREE.Mesh(patchGeometry,detailMaterial);detailPatch.renderOrder=20;scene.add(detailPatch);
    scene.add(new THREE.AmbientLight(0xaec2d5, .84)); const sun=new THREE.DirectionalLight(0xfff7ec,3.8);sun.position.set(-3,3.5,6);scene.add(sun);const fill=new THREE.DirectionalLight(0x7894b2,.58);fill.position.set(5,-1,-4);scene.add(fill);
    const startDirection=geo(22,76),turkeyDirection=geo(38.35,37),flightRotation=new THREE.Quaternion().setFromUnitVectors(startDirection,turkeyDirection);
    earth.rotation.y=0;camera.position.copy(startDirection).multiplyScalar(3.28);camera.lookAt(0,0,0);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.075;controls.rotateSpeed=.34;controls.minDistance=1.21;controls.maxDistance=1.52;controls.target.set(0,0,0);
    let userTurning=false,returnAt=0;const onControlStart=()=>{userTurning=true;returnAt=Infinity;};const onControlEnd=()=>{userTurning=false;returnAt=performance.now()+1700;};controls.addEventListener('start',onControlStart);controls.addEventListener('end',onControlEnd);
    const locationVectors=LOCATIONS.map(location=>geo(location.lat,location.lon).multiplyScalar(1.012));
    const visibility={current:false};let raf=0,lastStage='idle';const observer=new IntersectionObserver(([entry])=>{visibility.current=entry.isIntersecting;},{threshold:.12});observer.observe(section);
    const resize=()=>{const {width,height}=section.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(section);resize();
    const render=(now:number)=>{const animation=animationRef.current;let flight=animation.completed?1:0,network=animation.completed?1:0;if(animation.playing){const elapsed=(now-animation.start)/1000;flight=THREE.MathUtils.clamp(elapsed/2.7,0,1);network=THREE.MathUtils.clamp((elapsed-2.55)/2.65,0,1);const next=elapsed<2.55?'flight':elapsed<5.2?'network':'complete';if(next!==lastStage){lastStage=next;setStage(next);}if(elapsed>=5.2){animationRef.current={...animationRef.current,playing:false,completed:true};returnAt=now+1400;}}const smooth=(value:number)=>value*value*(3-2*value);const journey=Math.pow(flight,2.15);const orbit=smooth(THREE.MathUtils.clamp(flight/.52,0,1));const dolly=smooth(THREE.MathUtils.clamp((flight-.10)/.90,0,1));const idleTurn=animation.playing||animation.completed?0:Math.sin(now*.00012)*.022;if(animation.playing||!animation.completed){const rotation=new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(),flightRotation,orbit);const direction=startDirection.clone().applyAxisAngle(new THREE.Vector3(0,1,0),idleTurn).applyQuaternion(rotation);camera.position.copy(direction).multiplyScalar(THREE.MathUtils.lerp(3.28,1.27,dolly));camera.up.set(Math.sin(flight*Math.PI)*.055,1,Math.sin(flight*Math.PI*2)*.012).normalize();camera.lookAt(0,0,0);}controls.enabled=animation.completed&&!animation.playing;if(controls.enabled){controls.update();if(!userTurning&&now>returnAt){const radius=THREE.MathUtils.lerp(camera.position.length(),1.27,.035);const current=camera.position.clone().normalize();current.lerp(turkeyDirection,.035).normalize();camera.position.copy(current.multiplyScalar(radius));camera.lookAt(0,0,0);}}camera.updateMatrixWorld();if(!animation.playing&&!animation.completed)earth.rotation.y+=visibility.current?.00007:0;detailPatch.rotation.copy(earth.rotation);detailMaterial.opacity=smooth(THREE.MathUtils.clamp((flight-.72)/.22,0,1))*.92;const cloud=flight<.80?0:flight<.91?smooth((flight-.80)/.11):flight<.97?1-smooth((flight-.91)/.06):0;section.style.setProperty('--flight',flight.toFixed(4));section.style.setProperty('--journey',journey.toFixed(4));section.style.setProperty('--cloud',cloud.toFixed(4));section.style.setProperty('--network',network.toFixed(4));const cameraFacing=camera.position.clone().normalize();locationVectors.forEach((local,index)=>{const element=pinsRef.current[index];if(!element)return;const world=local.clone().applyEuler(earth.rotation);const facing=world.clone().normalize().dot(cameraFacing);const projected=world.clone().project(camera);const visible=network>.02&&facing>.28&&Math.abs(projected.x)<1.08&&Math.abs(projected.y)<1.08;element.style.left=`${(projected.x*.5+.5)*100}%`;element.style.top=`${(-projected.y*.5+.5)*100}%`;element.style.visibility=visible?'visible':'hidden';element.style.opacity=visible?String(Math.min(1,network*3)):'0';});if(visibility.current)renderer.render(scene,camera);raf=requestAnimationFrame(render);};raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();ro.disconnect();controls.removeEventListener('start',onControlStart);controls.removeEventListener('end',onControlEnd);controls.dispose();earthTexture.dispose();detailTexture.dispose();detailMask.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
  }, []);

  return <section ref={sectionRef} className={styles.section} id="yatirim-agimiz" aria-label="Türkiye yatırım haritası">
    <div className={styles.space} aria-hidden="true"/><video ref={filmRef} className={styles.earthFilm} src="/assets/nasa-earth-intro.mp4" autoPlay muted loop playsInline preload="auto" onCanPlay={()=>setFilmReady(true)} aria-hidden="true"/><div ref={canvasHostRef} className={styles.globe} aria-hidden="true"/><div className={styles.vignette} aria-hidden="true"/><div className={styles.clouds} aria-hidden="true"><i/><i/><i/></div>
    <div className={styles.globePins} aria-hidden={stage==='idle'} key={playId}>{pinPositions.map((pin,index)=>{const dx=pin.dx??0,dy=pin.dy??0;return <div ref={element=>{pinsRef.current[index]=element;}} className={styles.pin} data-type={pin.type} data-label={pin.label??'right'} style={{'--delay':`${index*58}ms`,'--dx':`${dx}px`,'--dy':`${dy}px`,'--line':`${Math.hypot(dx,dy)}px`,'--angle':`${Math.atan2(dy,dx)}rad`} as React.CSSProperties} key={pin.name}><span className={styles.ripple}/><span className={styles.symbol}><Symbol type={pin.type}/></span><strong>{pin.name}</strong></div>})}</div>
    {stage==='idle'&&<div className={styles.launch}><span>BEST BRANDS • TÜRKİYE YATIRIM AĞI</span><button type="button" onClick={play} disabled={!assetsReady||!filmReady}><i aria-hidden="true"/>{assetsReady&&filmReady?'Yatırım Ağını Keşfet':'Sahne hazırlanıyor'}</button></div>}
    {stage==='complete'&&<button className={styles.replay} type="button" onClick={play}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg>Tekrar İzle</button>}
    <div className={styles.credit}>Dünya ve harita: NASA/GSFC Blue Marble</div>
  </section>;
}
