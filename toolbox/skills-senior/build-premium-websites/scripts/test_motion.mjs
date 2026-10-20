import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clamp01,mapProgress,smoothstep,damp,createShotSampler} from '../assets/recipes/motion-core.mjs';
import {createMotionController,flipTranslate,createViewSwitcher} from '../assets/recipes/native-motion.mjs';
import {mountScrollScene} from '../assets/recipes/gsap-scroll.mjs';

function mediaMock(initial=false) {
  const listeners = new Set();
  return {matches:initial, addEventListener:(_,fn)=>listeners.add(fn), removeEventListener:(_,fn)=>listeners.delete(fn),
    set(value){this.matches=value;listeners.forEach(fn=>fn());}, get listeners(){return listeners.size;}};
}
function elementMock() {
  return {isConnected:true,left:0,animations:[],getBoundingClientRect(){return {left:this.left,top:0,width:50,height:50};},
    animate(frames,options){let resolve,reject; const finished=new Promise((a,b)=>{resolve=a;reject=b;});
      const a={frames,options,finished,cancelled:false,cancel(){this.cancelled=true;reject(new Error('cancel'));},finish:resolve};this.animations.push(a);return a;}};
}
function transitionMock() {
  const pending=[];
  return {pending,startViewTransition(callback){
    let resolve,reject; const updateCallbackDone=new Promise((a,b)=>{resolve=a;reject=b;});
    const t={ready:Promise.resolve(),updateCallbackDone,finished:updateCallbackDone,skipped:false,
      skipTransition(){this.skipped=true;},flush(){try{callback();resolve();}catch(e){reject(e);}}};pending.push(t);return t;
  }};
}
test('progress clamps and rejects invalid geometry',()=>{
  assert.equal(mapProgress(-50,0,100),0);assert.equal(mapProgress(200,0,100),1);assert.equal(mapProgress(25,0,100),.25);
  assert.throws(()=>mapProgress(1,1,1),RangeError);assert.throws(()=>clamp01(NaN),TypeError);
  assert.equal(smoothstep(0),0);assert.equal(smoothstep(1),1);assert.equal(smoothstep(.5),.5);
});
test('exponential damping is refresh-rate independent for a fixed target',()=>{
  const simulate=hz=>{let x=0;for(let i=0;i<hz;i++)x=damp(x,1,5,1/hz);return x;};
  assert.ok(Math.abs(simulate(30)-simulate(144))<1e-12);assert.equal(damp(2,8,5,0),2);
  assert.throws(()=>damp(0,1,2,-.1),RangeError);
});
test('camera state is identical after reverse, skip and mid-page initialization',()=>{
  const plan=JSON.parse(readFileSync(new URL('../assets/templates/shot-plan.json',import.meta.url)));
  const sample=createShotSampler(plan.keyframes), middle=sample(.53);
  [1,.2,0,.9,.53].forEach(sample);assert.deepEqual(sample(.53),middle);
  assert.deepEqual(sample(0).position,plan.keyframes[0].position);
  assert.deepEqual(sample(1).position,plan.keyframes.at(-1).position);
  const original=sample(0);plan.keyframes[0].position[0]=99;assert.deepEqual(sample(0),original);
});
test('camera contract rejects unordered or incomplete keys',()=>{
  const k=p=>({progress:p,position:[0,0,4],target:[0,0,0],fov:40});
  assert.throws(()=>createShotSampler([k(0),k(0)]));assert.throws(()=>createShotSampler([k(.1),k(1)]));
});
test('owned animation cancels older work and reacts to live preference',async()=>{
  const media=mediaMock(),c=createMotionController(media),el=elementMock();
  const first=c.play(el,[{opacity:0},{opacity:1}]);c.play(el,[{opacity:0},{opacity:1}]);
  assert.equal(first.cancelled,true);assert.equal(c.activeCount,1);media.set(true);await Promise.resolve();
  assert.equal(c.activeCount,0);assert.equal(c.play(el,[]),null);c.dispose();assert.equal(media.listeners,0);
});
test('FLIP commits layout once and skips detached nodes',()=>{
  const c=createMotionController(mediaMock()),a=elementMock(),b=elementMock();let commits=0;
  flipTranslate([a,b],()=>{commits++;a.left=100;b.isConnected=false;},c,()=>true);
  assert.equal(commits,1);assert.equal(a.animations[0].frames[0].transform,'translate(-100px, 0px)');
  assert.equal(b.animations.length,0);c.dispose();
});
test('FLIP uses an immediate fallback under transformed ancestors',()=>{
  const c=createMotionController(mediaMock()),el=elementMock();let commits=0;
  const parent={parentElement:null,style:{transform:'matrix(2,0,0,2,0,0)'}};
  el.parentElement=parent;el.style={transform:'none'};
  el.ownerDocument={defaultView:{getComputedStyle:node=>node.style}};
  flipTranslate([el],()=>{commits++;el.left=200;},c);
  assert.equal(commits,1);assert.equal(el.animations.length,0);c.dispose();
});
test('FLIP avoids double compensation for nested targets',()=>{
  const c=createMotionController(mediaMock()),parent=elementMock(),child=elementMock();
  parent.contains=node=>node===child;
  flipTranslate([parent,child],()=>{parent.left=100;child.left=100;},c,()=>true);
  assert.equal(parent.animations.length,0);assert.equal(child.animations.length,0);c.dispose();
});
test('view switcher fallback commits once and cleanup rejects later use',async()=>{
  const m=mediaMock(),s=createViewSwitcher({},m);let n=0;await s.update(()=>{n++;});assert.equal(n,1);
  s.dispose();assert.equal(m.listeners,0);await assert.rejects(s.update(()=>{}));
});
test('latest visual request wins even if earlier callback runs late',async()=>{
  const doc=transitionMock(),s=createViewSwitcher(doc,mediaMock());const states=[];
  const a=s.update(()=>{states.push('a');}),b=s.update(()=>{states.push('b');});
  doc.pending[1].flush();doc.pending[0].flush();await Promise.all([a,b]);
  assert.deepEqual(states,['b']);assert.equal(doc.pending[0].skipped,true);s.dispose();
});
test('failed DOM callback is surfaced and never replayed',async()=>{
  const doc=transitionMock(),s=createViewSwitcher(doc,mediaMock());let n=0;
  const p=s.update(()=>{n++;throw new Error('update failed');});doc.pending[0].flush();
  await assert.rejects(p,/update failed/);assert.equal(n,1);s.dispose();
});
test('preference change skips visual transition but retains desired commit',async()=>{
  const doc=transitionMock(),m=mediaMock(),s=createViewSwitcher(doc,m);let n=0;
  const p=s.update(()=>{n++;});m.set(true);doc.pending[0].flush();await p;
  assert.equal(n,1);assert.equal(doc.pending[0].skipped,true);s.dispose();
});
test('GSAP adapter scope and cleanup contract with a test double',()=>{
  let reverted=0,selector,scope;const visual={},root={querySelector:()=>visual};
  const gsap={registerPlugin(){},matchMedia(value){scope=value;return {add(q,fn){selector=q;fn();},revert(){reverted++;}};},
    timeline(opts){assert.equal(opts.scrollTrigger.scrub,true);return {fromTo(el){assert.equal(el,visual);}};}};
  const stop=mountScrollScene({root,gsap,ScrollTrigger:{}});stop();assert.equal(reverted,1);assert.equal(scope,root);
  assert.match(selector,/no-preference/);
});
