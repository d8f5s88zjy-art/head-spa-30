import {createMotionController,flipTranslate,createViewSwitcher} from '../recipes/native-motion.mjs';
import {clamp01} from '../recipes/motion-core.mjs';
const system=matchMedia('(prefers-reduced-motion: reduce)'),checkbox=document.querySelector('#reduce');
const listeners=new Set();
const media={get matches(){return system.matches||checkbox.checked;},addEventListener(_,fn){listeners.add(fn);},removeEventListener(_,fn){listeners.delete(fn);}};
const controller=createMotionController(media),switcher=createViewSwitcher(document,media);
const abort=new AbortController(),options={signal:abort.signal};
const specimen=document.querySelector('#specimen'),cards=document.querySelector('#cards'),orb=document.querySelector('#orb');
const region=document.querySelector('#scroll-region'),art=document.querySelector('#scroll-art');
let raf=0,nextState='a';
function draw(){raf=0;const rect=region.getBoundingClientRect();const progress=clamp01((innerHeight-rect.top)/(innerHeight+rect.height));art.style.transform=`translateY(${media.matches?0:(progress-.5)*70}px)`;}
function requestDraw(){if(!raf)raf=requestAnimationFrame(draw);}
function preference(){listeners.forEach(fn=>fn());document.querySelector('#mode').textContent=media.matches?'Pohyb obmedzený':'Animácie povolené';requestDraw();}
system.addEventListener('change',preference,options);checkbox.addEventListener('change',preference,options);
document.querySelector('#fade').addEventListener('click',()=>controller.play(specimen,[{opacity:0},{opacity:1}],{duration:450}),options);
document.querySelector('#mask').addEventListener('click',()=>controller.play(specimen,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:550}),options);
document.querySelector('#reorder').addEventListener('click',()=>flipTranslate([...cards.children],()=>cards.append(cards.firstElementChild),controller),options);
document.querySelector('#switch').addEventListener('click',()=>{
  nextState=nextState==='a'?'b':'a';const desired=nextState;
  switcher.update(()=>{orb.dataset.state=desired;document.querySelector('#view-status').textContent=`Stav ${desired.toUpperCase()}`;})
    .catch(()=>{document.querySelector('#view-status').textContent='Zmenu sa nepodarilo dokončiť.';});
},options);
addEventListener('scroll',requestDraw,{...options,passive:true});addEventListener('resize',requestDraw,options);
addEventListener('pagehide',event=>{
  // BFCache preserves this document and its listeners; restore must remain usable.
  if (!event.persisted) {abort.abort();controller.dispose();switcher.dispose();cancelAnimationFrame(raf);}
},options);
addEventListener('pageshow',requestDraw,options);
preference();
