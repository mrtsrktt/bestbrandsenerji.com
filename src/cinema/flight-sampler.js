import {Vector3,MathUtils} from 'three';

// Non-uniform key times need derivatives in seconds. Interpolating a uniform
// Catmull curve with unequal time segments introduced speed changes at keys.
// Look directions are normalized before interpolation, so the distant sun
// target cannot pull the next panel shot far below the ground.
export function createFlightSampler(keys){
  const points=keys.map(k=>new Vector3(...k.p));
  const directions=keys.map((k,i)=>new Vector3(...k.q).sub(points[i]).normalize());
  const focus=keys.map((k,i)=>new Vector3(...k.q).distanceTo(points[i]));
  const derivatives=values=>values.map((value,i)=>{
    const a=Math.max(0,i-1),b=Math.min(values.length-1,i+1);
    return values[b].clone().sub(values[a]).divideScalar(keys[b].t-keys[a].t);
  });
  const positionVelocity=derivatives(points),directionVelocity=derivatives(directions);
  function interpolate(values,velocity,i,u,dt){
    const u2=u*u,u3=u2*u;
    return values[i].clone().multiplyScalar(2*u3-3*u2+1)
      .addScaledVector(velocity[i],(u3-2*u2+u)*dt)
      .addScaledVector(values[i+1],-2*u3+3*u2)
      .addScaledVector(velocity[i+1],(u3-u2)*dt);
  }
  return t=>{
    let i=0;while(i<keys.length-2&&t>=keys[i+1].t)i++;
    const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=MathUtils.clamp((t-a.t)/dt,0,1);
    const p=interpolate(points,positionVelocity,i,u,dt);
    const direction=interpolate(directions,directionVelocity,i,u,dt).normalize();
    const q=p.clone().addScaledVector(direction,MathUtils.lerp(focus[i],focus[i+1],u));
    const lens=MathUtils.smoothstep(u,0,1);
    return {p,q,fov:MathUtils.lerp(a.fov,b.fov,lens),roll:MathUtils.lerp(a.roll||0,b.roll||0,lens)};
  };
}
