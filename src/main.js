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
const returnButton=document.querySelector('#journey-return');
const status=document.querySelector('#journey-status');
const hotspots=[document.querySelector('#journey-primary'),document.querySelector('#journey-secondary')];
let paused=params.get('still')==='1';
let previousAction='';
function updateState(){
 pauseButton.setAttribute('aria-pressed',String(paused));
 pauseButton.setAttribute('aria-label',paused?'Animasyona devam et':'Animasyonu duraklat');
 pauseButton.querySelector('path').setAttribute('d',paused?'M7 4l9 6-9 6V4Z':'M7 5v10M13 5v10');
 hero.classList.toggle('is-paused',paused);
}
function updateJourney({active,options,width,height}){
 hero.classList.toggle('is-exploring',Boolean(active));
 returnButton.hidden=!active;
 if(active!==previousAction){if(active)status.textContent=({join:'Enerji akışına katıldınız.',convert:'Enerjinin dönüşümünü yakından inceliyorsunuz.',grid:'Şebekeye doğru ilerliyorsunuz.',inspect:'Aracın ölçüm sürecini inceliyorsunuz.'})[active];previousAction=active;}
 wrap.setAttribute('aria-label',active?'Yakın çekim yolculuğu devam ediyor.':options[0]?.label||'Sinematik yolculuk devam ediyor.');
 hotspots.forEach((button,i)=>{
  const option=options[i];button.hidden=!option;
  if(!option)return;
  button.dataset.action=option.action;
  button.querySelector('.hotspot-label').textContent=option.label;
  const x=option.inView?option.x:width-220;
  const y=option.inView?option.y:height*.45+i*70;
  button.style.transform='translate3d('+Math.max(50,Math.min(width-230,x))+'px,'+Math.max(60,Math.min(height-165,y))+'px,0)';
 });
}
async function start(){
 try{
  const world=await createWorld(document.querySelector('#world'),{reducedMotion:reduced.matches,onProgress:()=>{},onInteraction:updateJourney,onLoad:progress=>{document.querySelector('#load-progress').style.width=Math.round(progress*100)+'%';}});
  world.setPaused(paused);wrap.classList.add('ready');document.querySelector('#loading-screen').classList.add('done');document.body.classList.add('is-ready');
  function toggle(){paused=!paused;world.setPaused(paused);updateState();}
  function interact(action){if(world.interact(action)){paused=false;world.setPaused(false);updateState();}}
  wrap.addEventListener('click',()=>interact());
  wrap.addEventListener('pointermove',event=>{const r=wrap.getBoundingClientRect();world.point((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);});
  wrap.addEventListener('pointerleave',()=>world.point(0,0));
  wrap.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();interact();}});
  pauseButton.addEventListener('click',toggle);
  returnButton.addEventListener('click',()=>{world.returnToFilm();paused=false;world.setPaused(false);updateState();wrap.focus({preventScroll:true});});
  hotspots.forEach(button=>button.addEventListener('click',()=>{interact(button.dataset.action);wrap.focus({preventScroll:true});}));
  window.heroReview={seek:world.seek,pause:()=>{paused=true;world.setPaused(true);updateState();},metrics:world.metrics};
  updateState();
 }catch(error){console.error('Scene initialization failed',error);wrap.classList.add('ready','failed');document.querySelector('#loading-screen').classList.add('done');wrap.removeAttribute('role');wrap.removeAttribute('tabindex');document.querySelector('.journey-toolbar').hidden=true;}
}
start();
