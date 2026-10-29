import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/murat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const names=['inspector-reach','inspector-tablet','inspector-wheel'];
await fs.mkdir('public/assets/people',{recursive:true});
for(const name of names){
  const source=await fs.readFile(path.join('outputs/people-source',name+'.glb'));
  const jsonLength=source.readUInt32LE(12),json=JSON.parse(source.subarray(20,20+jsonLength).toString());
  const binary=source.subarray(28+jsonLength),parts=[];let offset=0;
  const imageViews=new Map((json.images||[]).map(image=>[image.bufferView,image]));
  for(const [i,view] of json.bufferViews.entries()){
    let bytes=binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
    const image=imageViews.get(i);
    if(image){const metadata=await sharp(bytes).metadata();const processor=sharp(bytes).resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true});bytes=metadata.hasAlpha?await processor.png({compressionLevel:9}).toBuffer():await processor.jpeg({quality:88,mozjpeg:true}).toBuffer();image.mimeType=metadata.hasAlpha?'image/png':'image/jpeg';}
    const pad=(4-offset%4)%4;if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}
    view.byteOffset=offset;view.byteLength=bytes.length;parts.push(bytes);offset+=bytes.length;
  }
  const tail=(4-offset%4)%4;if(tail){parts.push(Buffer.alloc(tail));offset+=tail;}
  json.buffers[0].byteLength=offset;
  json.asset.extras={...json.asset.extras,source:'Innerscene / MakeHuman CC0; textures resized for web; mesh topology retained.'};
  let text=Buffer.from(JSON.stringify(json));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,0x20)]);
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+text.length+offset,8);header.writeUInt32LE(text.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(offset);binHeader.writeUInt32LE(0x004e4942,4);
  const result=Buffer.concat([header,text,binHeader,...parts]);await fs.writeFile(path.join('public/assets/people',name+'.glb'),result);
  console.log(name,Math.round(source.length/1024)+' -> '+Math.round(result.length/1024)+' KB',JSON.stringify({meshes:json.meshes.length,skins:json.skins?.length||0,names:json.materials.map(m=>m.name)}));
}
