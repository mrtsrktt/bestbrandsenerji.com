import { createWorld } from './world.js';

const menuToggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('#mobile-menu');
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');menu.classList.toggle('open',open);menu.inert=!open;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){menuToggle.click();menuToggle.focus();}});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const params=new URLSearchParams(location.search);
const wrap=document.querySelector('#scene-wrap');
const hero=document.querySelector('.hero');
const pauseButton=document.querySelector('#film-pause');
const nextButton=document.querySelector('#scene-next');
const invitation=document.querySelector('.scene-invitation');
const steps=document.querySelector('.scene-steps');
const status=document.querySelector('#journey-status');
let paused=params.get('still')==='1';
let previousState='';
function updatePause(){
 pauseButton.setAttribute('aria-pressed',String(paused));
 pauseButton.setAttribute('aria-label',paused?'Animasyona devam et':'Animasyonu duraklat');
 pauseButton.querySelector('path').setAttribute('d',paused?'M7 4l9 6-9 6V4Z':'M7 5v10M13 5v10');
 hero.classList.toggle('is-paused',paused);
}
function updateScene(state){
 const {index,name,waiting,restarting,label,target}=state;
 const key=index+':'+waiting+':'+restarting;
 if(key===previousState)return;
 previousState=key;
 hero.dataset.scene=String(index+1);
 hero.classList.toggle('is-awaiting',waiting);
 hero.classList.toggle('is-travelling',restarting||(!waiting&&index>0));
 invitation.hidden=!waiting;
 pauseButton.hidden=waiting;
 nextButton.querySelector('.scene-next-caption').textContent=label;
 nextButton.setAttribute('aria-label',index===2?'Üç sahneli yolculuğu yeniden başlat':label+' — '+(target+1)+'. sahneyi başlat');
 steps.setAttribute('aria-label','Sahne '+(index+1)+' / 3');
 [...steps.children].forEach((el,i)=>{el.classList.toggle('active',i===index);el.classList.toggle('complete',i<index);});
 wrap.setAttribute('aria-label',name+'. '+(waiting?'Sahne tamamlandı. Sonraki sahne için ilerleme butonuna basın.':restarting?'Başlangıca dönülüyor.':'Animasyon oynuyor.'));
 status.textContent=restarting?'Başlangıca dönülüyor.':waiting?name+' tamamlandı. '+label+' butonuyla devam edebilirsiniz.':(index+1)+'. sahne başladı: '+name+'.';
}
async function start(){
 try{
  const world=await createWorld(document.querySelector('#world'),{reducedMotion:reduced.matches,onProgress:()=>{},onInteraction:updateScene,onLoad:progress=>{document.querySelector('#load-progress').style.width=Math.round(progress*100)+'%';}});
  world.setPaused(paused);
  wrap.classList.add('ready');document.querySelector('#loading-screen').classList.add('done');document.body.classList.add('is-ready');
  pauseButton.addEventListener('click',()=>{paused=!paused;world.setPaused(paused);updatePause();});
  nextButton.addEventListener('click',()=>{
   if(world.advance()){paused=false;world.setPaused(false);updatePause();pauseButton.focus({preventScroll:true});}
  });
  wrap.addEventListener('pointermove',event=>{const r=wrap.getBoundingClientRect();world.point((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);});
  wrap.addEventListener('pointerleave',()=>world.point(0,0));
  window.heroReview={seek:world.seek,pause:()=>{paused=true;world.setPaused(true);updatePause();},metrics:world.metrics};
  updatePause();
 }catch(error){console.error('Scene initialization failed',error);wrap.classList.add('ready','failed');document.querySelector('#loading-screen').classList.add('done');invitation.hidden=true;document.querySelector('.journey-toolbar').hidden=true;status.textContent='Animasyon yüklenemedi.';}
}
start();
