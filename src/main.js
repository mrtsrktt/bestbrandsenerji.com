import { createWorld } from './world.js';

const menuToggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('#mobile-menu');
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');menu.classList.toggle('open',open);menu.inert=!open;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){menuToggle.click();menuToggle.focus();}});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const params=new URLSearchParams(location.search);
const wrap=document.querySelector('#scene-wrap');
const hero=document.querySelector('.hero');
let paused=params.get('still')==='1';
function updateState(){wrap.setAttribute('aria-pressed',String(paused));wrap.setAttribute('aria-label',paused?'Animasyon duraklatıldı. Devam ettirmek için tıklayın.':'Animasyon oynuyor. Duraklatmak için tıklayın.');hero.classList.toggle('is-paused',paused);}
async function start(){
 try{
  const world=await createWorld(document.querySelector('#world'),{reducedMotion:reduced.matches,onProgress:()=>{},onLoad:progress=>{document.querySelector('#load-progress').style.width=Math.round(progress*100)+'%';}});
  world.setPaused(paused);
  wrap.classList.add('ready');
  document.querySelector('#loading-screen').classList.add('done');
  document.body.classList.add('is-ready');
  function toggle(){paused=!paused;world.setPaused(paused);updateState();}
  wrap.addEventListener('click',toggle);
  wrap.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle();}});
  window.heroReview={seek:world.seek,pause:()=>{paused=true;world.setPaused(true);updateState();},metrics:world.metrics};
  updateState();
 }catch(error){console.error('Scene initialization failed',error);wrap.classList.add('ready','failed');document.querySelector('#loading-screen').classList.add('done');wrap.removeAttribute('role');wrap.removeAttribute('tabindex');}
}
start();
