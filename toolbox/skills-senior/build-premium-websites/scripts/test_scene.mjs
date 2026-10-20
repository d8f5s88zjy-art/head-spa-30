import test from 'node:test';
import assert from 'node:assert/strict';
import {createChapterSampler} from '../assets/recipes/scene-timeline.mjs';
import {createLatestResource} from '../assets/recipes/latest-resource.mjs';
import {createOwnedSelection} from '../assets/recipes/owned-selection.mjs';

const chapters=()=>[
  {id:'first',anchor:'#first',start:0,end:.5,enterUntil:.2,exitFrom:.8},
  {id:'last',anchor:'#last',start:.5,end:1,enterUntil:.2,exitFrom:.8}
];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('chapter ownership is unambiguous at boundaries and clamped endpoints',()=>{
  const sample=createChapterSampler(chapters());
  assert.equal(sample(-1).chapterId,'first');assert.equal(sample(.5).chapterId,'last');
  assert.equal(sample(2).localProgress,1);assert.equal(sample(0).phase,'enter');
  assert.equal(sample(.25).phase,'hold');assert.equal(sample(.45).phase,'exit');
});
test('reverse sampling and reduced motion preserve logical state',()=>{
  const sample=createChapterSampler(chapters());const before=sample(.25);
  sample(.9);assert.deepEqual(sample(.25),before);
  assert.equal(sample(.25,{reduced:true}).chapterId,before.chapterId);
  assert.equal(sample(.25,{reduced:true}).presentation,'static');
});
test('invalid partitions and nonfinite input are rejected',()=>{
  const gap=chapters();gap[1].start=.6;assert.throws(()=>createChapterSampler(gap));
  const duplicate=chapters();duplicate[1].id='first';assert.throws(()=>createChapterSampler(duplicate));
  const missing=chapters();missing[1].end=.9;assert.throws(()=>createChapterSampler(missing));
  const noHold=chapters();noHold[0].exitFrom=.2;assert.throws(()=>createChapterSampler(noHold));
  assert.throws(()=>createChapterSampler(chapters())(NaN));
});
test('caller mutation does not change a compiled scene',()=>{
  const input=chapters(),sample=createChapterSampler(input);input[0].id='changed';input[0].end=.9;
  assert.equal(sample(.2).chapterId,'first');assert.equal(sample(.6).chapterId,'last');
});
test('out-of-order resolution never overwrites the latest selection',async()=>{
  const a=deferred(),b=deferred(),commits=[],signals=[];
  const loader=createLatestResource((value,{signal})=>{signals.push(signal);return value==='a'?a.promise:b.promise;},v=>{commits.push(v);});
  const ra=loader.run('a'),rb=loader.run('b');assert.equal(signals[0].aborted,true);
  b.resolve('B');assert.equal((await rb).status,'committed');a.resolve('A');
  assert.equal((await ra).status,'stale');assert.deepEqual(commits,['B']);
});
test('cancel and dispose suppress late commits even when prepare ignores abort',async()=>{
  for(const method of ['cancel','dispose']){
    const pending=deferred();let count=0;
    const loader=createLatestResource(()=>pending.promise,()=>{count++;});
    const run=loader.run();loader[method]();pending.resolve('late');
    assert.equal((await run).status,'stale');assert.equal(count,0);
    if(method==='dispose')await assert.rejects(loader.run(),/disposed/);
  }
});
test('current failures surface and stale failures do not replace a newer result',async()=>{
  const old=deferred();const loader=createLatestResource(x=>x==='old'?old.promise:Promise.resolve('new'),()=>{});
  const run=loader.run('old');await loader.run('new');old.reject(new Error('late'));
  assert.equal((await run).status,'stale');
  await assert.rejects(createLatestResource(()=>Promise.reject(new Error('current')),()=>{}).run(),/current/);
});
test('a failed commit is not retried and async commit contract violations are reported',async()=>{
  let count=0;const loader=createLatestResource(async()=>1,()=>{count++;throw new Error('commit');});
  await assert.rejects(loader.run(),/commit/);assert.equal(count,1);
  await assert.rejects(createLatestResource(async()=>1,async()=>{throw new Error('async');}).run(),/synchronous/);
});
test('owned selection discards stale loaded assets but keeps the adopted model',async()=>{
  const old=deferred(),released=[];let current;
  const loader=createOwnedSelection(x=>x==='old'?old.promise:Promise.resolve('new'),
    (value,claim)=>{current=value;claim();},value=>{released.push(value);});
  const first=loader.run('old');await loader.run('new');old.resolve('old');
  assert.equal((await first).status,'stale');assert.equal(current,'new');assert.deepEqual(released,['old']);
});
test('unmount still releases an eventual unclaimed asset when abort is ignored',async()=>{
  const pending=deferred(),released=[];
  const loader=createOwnedSelection(()=>pending.promise,()=>{assert.fail('late adoption');},v=>{released.push(v);});
  const run=loader.run();loader.dispose();pending.resolve('late');await run;
  assert.deepEqual(released,['late']);await assert.rejects(loader.run(),/disposed/);
});
test('failed partial attachment is discarded once before ownership transfer',async()=>{
  const value={attached:false},released=[];
  const loader=createOwnedSelection(async()=>value,v=>{v.attached=true;throw new Error('attach');},
    v=>{v.attached=false;released.push(v);});
  await assert.rejects(loader.run(),/attach/);assert.equal(value.attached,false);assert.equal(released.length,1);
});
test('a cleanup error after ownership transfer must not dispose the adopted model',async()=>{
  const released=[];let current;
  const loader=createOwnedSelection(async()=>({id:'next'}),(value,claim)=>{
    current=value;claim();throw new Error('previous cleanup failed');
  },v=>{released.push(v);});
  await assert.rejects(loader.run(),/previous cleanup failed/);
  assert.equal(current.id,'next');assert.deepEqual(released,[]);
});
test('missing or late ownership claim is rejected and unclaimed value is discarded',async()=>{
  let lateClaim;const released=[];
  const loader=createOwnedSelection(async()=>'model',(_,claim)=>{lateClaim=claim;},v=>{released.push(v);});
  await assert.rejects(loader.run(),/explicitly claim/);assert.deepEqual(released,['model']);
  assert.throws(()=>lateClaim(),/synchronous adopt/);
});
