import * as THREE from 'three';

// Detailed CC0 MakeHuman-derived clothed figures retain their skin, hair,
// facial anatomy and fabric textures. No primitive mannequin body parts.
export function buildInspectors(parent,assets,u){
  const crew=new THREE.Group();parent.add(crew);
  const people=[];
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
  const contactContext=contactCanvas.getContext('2d'),contactGradient=contactContext.createRadialGradient(64,64,9,64,64,64);contactGradient.addColorStop(0,'rgba(0,0,0,.48)');contactGradient.addColorStop(1,'rgba(0,0,0,0)');contactContext.fillStyle=contactGradient;contactContext.fillRect(0,0,128,128);
  const contactMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contactCanvas),transparent:true,depthWrite:false,opacity:.48});
  const tabletCanvas=document.createElement('canvas');tabletCanvas.width=256;tabletCanvas.height=160;const tabletContext=tabletCanvas.getContext('2d');tabletContext.fillStyle='#0d2928';tabletContext.fillRect(0,0,256,160);tabletContext.fillStyle='#a7d276';tabletContext.fillRect(18,16,125,4);
  for(let i=0;i<3;i++){const y=50+i*36;tabletContext.strokeStyle='#91c95a';tabletContext.lineWidth=3;tabletContext.beginPath();tabletContext.moveTo(21,y);tabletContext.lineTo(27,y+6);tabletContext.lineTo(38,y-6);tabletContext.stroke();tabletContext.fillStyle='#8caaa3';tabletContext.fillRect(54,y-4,150-i*19,3);tabletContext.fillStyle='#426761';tabletContext.fillRect(54,y+4,102+i*13,2);}
  const tabletTexture=new THREE.CanvasTexture(tabletCanvas);tabletTexture.colorSpace=THREE.SRGBColorSpace;
  const specs=[
    [assets.inspectorReach,1.75,5.8,-Math.PI/2,'engine'],
    [assets.inspectorTablet,2.2,8.7,-Math.PI/2,'tablet'],
    [assets.inspectorWheel,-1.95,6.8,Math.PI/2,'wheel'],
  ];
  for(const [asset,x,z,angle,role] of specs){
    const model=new THREE.Group();asset.scene.updateMatrixWorld(true);
    asset.scene.traverse(source=>{
      if(!source.isMesh||/parcel|cardboard/i.test(source.name))return;
      const geo=source.geometry.clone().applyMatrix4(source.matrixWorld);
      const materials=(Array.isArray(source.material)?source.material:[source.material]).map(original=>{
        if(role==='tablet'&&/Tablet display/.test(source.name))return new THREE.MeshBasicMaterial({map:tabletTexture,toneMapped:false});
        const material=original.clone();material.metalness=0;material.roughness=Math.max(.48,material.roughness||.6);material.envMapIntensity=.8;
        if(/top|cotton|casualsuit/i.test(material.name)&&!/body\.body|hair|eyelash/i.test(material.name))material.color.multiply(new THREE.Color('#a7bbc2'));
        if(role==='tablet'&&/brushed metal/i.test(material.name)){material.emissive?.set('#6caa67');material.emissiveIntensity=.15;}
        material.onBeforeCompile=shader=>{
          shader.uniforms.uInspectionTime=u.time;
          shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uInspectionTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
            float upper=smoothstep(.65,1.48,transformed.y);
            transformed.z+=sin(uInspectionTime*1.45+${people.length.toFixed(1)})*.005*upper;
            transformed.x+=sin(uInspectionTime*.68+${people.length.toFixed(1)})*.002*upper;
          `);
        };
        return material;
      });
      const mesh=new THREE.Mesh(geo,Array.isArray(source.material)?materials:materials[0]);mesh.name=source.name;mesh.castShadow=true;mesh.receiveShadow=true;model.add(mesh);
    });
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());
    for(const child of model.children)child.geometry.translate(-center.x,-bounds.min.y,-center.z);
    model.position.set(x,.10,z);model.rotation.y=angle;crew.add(model);people.push(model);
    if(role==='engine'){
      const probe=new THREE.Mesh(new THREE.BoxGeometry(.16,.06,.12),new THREE.MeshStandardMaterial({color:'#26383b',metalness:.6,roughness:.35}));probe.position.set(0,1.02,.30);model.add(probe);
      const tip=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.12,16),new THREE.MeshStandardMaterial({color:'#b8c4c5',metalness:.85,roughness:.22}));tip.rotation.x=Math.PI/2;tip.position.set(0,1.02,.40);model.add(tip);
    }
    const contact=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.1),contactMaterial);contact.rotation.x=-Math.PI/2;contact.position.set(x,.087,z);crew.add(contact);
  }
  // A focused inspection torch illuminates the real front brake assembly.
  // Keep the light in the render light list even while crew geometry is hidden.
  // Changing NUM_SPOT_LIGHTS halfway through the film recompiles every PBR material.
  const torch=new THREE.SpotLight('#edf4f4',0,3.5,.25,.7,1.4);torch.position.set(-1.30,.85,6.45);torch.target.position.set(-.95,.64,6.6);parent.add(torch,torch.target);
  return {crew,update(t){crew.visible=t>=24.8;torch.intensity=THREE.MathUtils.smoothstep(t,27.4,28.2)*(1-THREE.MathUtils.smoothstep(t,30.2,30.8))*18;}};
}
