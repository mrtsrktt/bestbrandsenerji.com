import test from 'node:test';
import assert from 'node:assert/strict';
import {createScenePlayback,SCENES} from './scene-playback.js';

test('autoplay finishes scene one and waits indefinitely for user input',()=>{
  const film=createScenePlayback();
  assert.equal(film.state.waiting,false);
  assert.equal(film.advance(),false);
  film.tick(100);
  for(let i=0;i<120;i++)film.tick(1);
  assert.equal(film.state.index,0);
  assert.equal(film.state.time,12);
  assert.equal(film.state.waiting,true);
});

test('each click advances exactly one scene without jumping the camera clock',()=>{
  const film=createScenePlayback();
  for(let i=0;i<2;i++){
    film.tick(100);
    const before=film.state.time;
    assert.equal(film.advance(),true);
    assert.equal(film.state.index,i+1);
    assert.equal(film.state.time,before);
    assert.equal(film.advance(),false);
  }
  film.tick(100);
  assert.equal(film.state.index,2);
  assert.equal(film.state.waiting,true);
  film.tick(100);
  assert.equal(film.state.time,39);
});

test('scene clocks are finite and monotonic with smooth start and finish',()=>{
  const film=createScenePlayback();
  for(const [index,scene] of SCENES.entries()){
    let last=film.state.time;
    while(!film.state.waiting){const s=film.tick(1/60);assert.ok(Number.isFinite(s.time));assert.ok(s.time>=last);assert.ok(s.time<=scene.end);last=s.time;}
    assert.equal(film.state.index,index);
    assert.equal(film.state.time,scene.end);
    if(index<2)film.advance();
  }
});

test('restart is explicit and completes the return flight before first-scene autoplay',()=>{
  const film=createScenePlayback(39);
  film.tick(20);assert.equal(film.state.waiting,true);
  film.advance();assert.equal(film.state.restarting,true);
  film.tick(4);assert.equal(film.state.index,2);assert.equal(film.state.time,39);
  assert.equal(film.advance(),false);
  film.tick(.7);assert.equal(film.state.index,0);assert.equal(film.state.restarting,false);assert.equal(film.state.waiting,false);assert.equal(film.state.time,0);
});

test('all scenes last at least ten seconds and the first reserves a long PV flight',()=>{
  assert.ok(SCENES.every(scene=>scene.duration>=10));
  assert.equal(SCENES[0].duration,12);
  assert.equal(SCENES[1].next,'Araç muayene istasyonlarına ilerle');
});

test('a stale next-scene request cannot restart or skip the film',()=>{
  const film=createScenePlayback();film.tick(100);
  assert.equal(film.advance(0),false);assert.equal(film.state.index,0);
  assert.equal(film.advance(1),true);assert.equal(film.state.time,12);
  for(let i=0;i<20;i++)assert.equal(film.advance(1),false);
  film.tick(100);assert.equal(film.state.index,1);
  assert.equal(film.advance(0),false);assert.equal(film.advance(1),false);
  assert.equal(film.state.time,23);assert.equal(film.advance(2),true);
  assert.equal(film.state.index,2);assert.equal(film.state.time,23);
});
