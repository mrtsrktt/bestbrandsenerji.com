import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlightSampler} from './flight-sampler.js';
import {FLIGHT_KEYS,FILM_END} from './choreography.js';

test('camera velocity is continuous through the sun descent and all shot keys',()=>{
  const sample=createFlightSampler(FLIGHT_KEYS),epsilon=.0001;
  for(const key of FLIGHT_KEYS.slice(1,-1)){
    const p=sample(key.t).p;
    const before=p.clone().sub(sample(key.t-epsilon).p).divideScalar(epsilon);
    const after=sample(key.t+epsilon).p.sub(p).divideScalar(epsilon);
    assert.ok(before.distanceTo(after)<.025,'velocity discontinuity at '+key.t);
  }
});

test('sun-to-panel descent has no stationary section or invalid look direction',()=>{
  const sample=createFlightSampler(FLIGHT_KEYS);
  for(let t=.3;t<3;t+=.01){
    const pose=sample(t),speed=sample(t+.001).p.distanceTo(pose.p)/.001;
    assert.ok(speed>1,'camera stopped near '+t);
    assert.ok(pose.q.distanceTo(pose.p)>1);
    assert.ok([...pose.p,...pose.q].every(Number.isFinite));
  }
});

test('engine close-up remains finite and matches the next-scene endpoints',()=>{
  const sample=createFlightSampler(FLIGHT_KEYS);
  for(let t=0;t<=FILM_END;t+=.01){const pose=sample(t);assert.ok([...pose.p,...pose.q,pose.fov].every(Number.isFinite));}
  for(const t of [12,23,39]){const key=FLIGHT_KEYS.find(k=>k.t===t),pose=sample(t);assert.ok(pose.p.toArray().every((v,i)=>Math.abs(v-key.p[i])<1e-9));}
});
