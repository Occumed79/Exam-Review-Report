import { useEffect, useMemo, useRef } from 'react';

type RegionKey = 'head'|'neck'|'shoulder'|'chest'|'lowBack'|'upperExtremity'|'hand'|'hip'|'knee'|'lowerExtremity'|'foot'|'wholeBody';
type Point = { x:number; y:number; z:number; region:RegionKey; intensity:number; seed:number };
type Node = { x:number; y:number; z:number; rx:number; rz:number; region:RegionKey };
type Props = { view:'front'|'back'; tiltX:number; tiltY:number; activeRegion:RegionKey|null; regionScores:Partial<Record<RegionKey,number>> };

const TAU = Math.PI * 2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(t:number)=>t*t*(3-2*t);
const rnd=(n:number)=>{ const x=Math.sin(n*12.9898+78.233)*43758.5453; return x-Math.floor(x); };

function ring(out:Point[], y:number, cx:number, cz:number, rx:number, rz:number, region:RegionKey, steps:number, seed:number, phase=0, intensity=1){
  for(let j=0;j<steps;j++){
    const a=j/steps*TAU+phase, s=rnd(seed+j);
    out.push({x:cx+rx*Math.cos(a),y,z:cz+rz*Math.sin(a),region,intensity:intensity*(.94+s*.12),seed:s});
    if(j%4===0){
      const q=.76;
      out.push({x:cx+rx*q*Math.cos(a),y,z:cz+rz*q*Math.sin(a),region,intensity:.42+s*.14,seed:rnd(seed+j+7000)});
    }
  }
}

function interp(nodes:Node[], t:number):Node{
  const p=t*(nodes.length-1), i=Math.min(nodes.length-2,Math.floor(p)), u=smooth(p-i), a=nodes[i], b=nodes[i+1];
  return {x:lerp(a.x,b.x,u),y:lerp(a.y,b.y,u),z:lerp(a.z,b.z,u),rx:lerp(a.rx,b.rx,u),rz:lerp(a.rz,b.rz,u),region:u<.5?a.region:b.region};
}

function sweep(out:Point[], nodes:Node[], slices:number, steps:number, seed:number){
  for(let i=0;i<=slices;i++){
    const t=i/slices, p=interp(nodes,t), a=interp(nodes,clamp(t-1/slices,0,1)), b=interp(nodes,clamp(t+1/slices,0,1));
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy)||1, nx=-dy/d, ny=dx/d, phase=i%2?.065:0;
    for(let j=0;j<steps;j++){
      const ang=j/steps*TAU+phase, c=Math.cos(ang), s=Math.sin(ang), r=rnd(seed+i*steps+j);
      out.push({x:p.x+nx*p.rx*c,y:p.y+ny*p.rx*c,z:p.z+p.rz*s,region:p.region,intensity:.94+r*.13,seed:r});
      if((i+j)%11===0) out.push({x:p.x+nx*p.rx*c*.73,y:p.y+ny*p.rx*c*.73,z:p.z+p.rz*s*.73,region:p.region,intensity:.44,seed:rnd(seed+90000+i*steps+j)});
    }
  }
}

function buildHuman():Point[]{
  const out:Point[]=[];

  // Human-scaled head: narrower jaw, modest cranium, no spherical mannequin look.
  for(let i=0;i<=30;i++){
    const t=i/30, y=lerp(1.31,1.82,t), n=(t-.53)/.53, skull=Math.sqrt(Math.max(0,1-n*n));
    const jaw=t<.38?lerp(.68,1,smooth(t/.38)):1, crown=t>.8?lerp(1,.84,smooth((t-.8)/.2)):1;
    ring(out,y,0,t<.42?.014:-.004,.198*skull*jaw*crown+.017,.21*skull+.015,'head',38,1000+i*50,i%2?.06:0,1.07);
  }
  // Subtle facial landmarks only.
  [[-.067,1.59,.202],[.067,1.59,.202],[0,1.52,.22],[-.05,1.415,.188],[0,1.4,.195],[.05,1.415,.188]].forEach((v,i)=>out.push({x:v[0],y:v[1],z:v[2],region:'head',intensity:1.6,seed:rnd(8000+i)}));

  // Neck flares smoothly into clavicles.
  for(let i=0;i<=13;i++){
    const t=i/13, f=smooth(t);
    ring(out,lerp(1.31,1.06,t),0,-.004,lerp(.125,.185,f),lerp(.14,.185,f),'neck',30,10000+i*40,i%2?.07:0,.98);
  }

  // Single torso surface: clavicle -> chest -> ribcage -> waist -> iliac flare.
  for(let i=0;i<=44;i++){
    const t=i/44, y=lerp(1.08,-.37,t);
    let w:number,d:number;
    if(t<.15) w=lerp(.35,.52,smooth(t/.15)); else if(t<.43) w=lerp(.52,.445,smooth((t-.15)/.28)); else if(t<.72) w=lerp(.445,.33,smooth((t-.43)/.29)); else w=lerp(.33,.39,smooth((t-.72)/.28));
    if(t<.34) d=lerp(.20,.248,smooth(t/.34)); else if(t<.68) d=lerp(.248,.188,smooth((t-.34)/.34)); else d=lerp(.188,.215,smooth((t-.68)/.32));
    const region:RegionKey=t<.68?'chest':'lowBack';
    ring(out,y,0,0,w,d,region,54,20000+i*70,i%2?.052:0,1);
  }

  // Pelvis bridges the torso and both thighs instead of reading as a separate orb.
  for(let i=0;i<=18;i++){
    const t=i/18, y=lerp(-.28,-.61,t), bell=Math.sin(t*Math.PI);
    ring(out,y,0,0,.325+bell*.085-t*.012,.19+bell*.04,'hip',44,30000+i*60,i%2?.055:0,.98);
  }

  for(const side of [-1,1] as const){
    const s=side;
    // One continuous arm surface; shoulder/biceps/elbow/forearm/wrist never break apart.
    sweep(out,[
      {x:s*.38,y:.97,z:0,rx:.175,rz:.185,region:'shoulder'},
      {x:s*.52,y:.87,z:0,rx:.155,rz:.16,region:'shoulder'},
      {x:s*.62,y:.60,z:.003,rx:.132,rz:.142,region:'upperExtremity'},
      {x:s*.69,y:.28,z:.006,rx:.108,rz:.114,region:'upperExtremity'},
      {x:s*.72,y:.06,z:.006,rx:.094,rz:.10,region:'upperExtremity'},
      {x:s*.76,y:-.18,z:.01,rx:.103,rz:.098,region:'upperExtremity'},
      {x:s*.81,y:-.43,z:.016,rx:.083,rz:.078,region:'upperExtremity'},
      {x:s*.835,y:-.60,z:.024,rx:.064,rz:.06,region:'hand'},
      {x:s*.845,y:-.74,z:.038,rx:.075,rz:.054,region:'hand'},
      {x:s*.852,y:-.86,z:.05,rx:.048,rz:.038,region:'hand'},
    ],58,26,side<0?40000:60000);

    // One continuous leg surface; knee is only a region label, not a geometric ball.
    sweep(out,[
      {x:s*.175,y:-.48,z:0,rx:.188,rz:.20,region:'hip'},
      {x:s*.195,y:-.68,z:.002,rx:.178,rz:.187,region:'lowerExtremity'},
      {x:s*.207,y:-.95,z:.007,rx:.157,rz:.164,region:'lowerExtremity'},
      {x:s*.212,y:-1.17,z:.01,rx:.127,rz:.131,region:'knee'},
      {x:s*.21,y:-1.31,z:.014,rx:.116,rz:.12,region:'lowerExtremity'},
      {x:s*.202,y:-1.50,z:.02,rx:.13,rz:.12,region:'lowerExtremity'},
      {x:s*.195,y:-1.69,z:.027,rx:.096,rz:.086,region:'lowerExtremity'},
      {x:s*.19,y:-1.84,z:.035,rx:.071,rz:.066,region:'foot'},
    ],66,28,side<0?80000:105000);

    // Flattened forward foot continuation.
    sweep(out,[
      {x:s*.19,y:-1.83,z:.05,rx:.073,rz:.068,region:'foot'},
      {x:s*.19,y:-1.89,z:.14,rx:.094,rz:.08,region:'foot'},
      {x:s*.19,y:-1.91,z:.28,rx:.105,rz:.06,region:'foot'},
      {x:s*.19,y:-1.91,z:.39,rx:.066,rz:.036,region:'foot'},
    ],20,22,side<0?130000:145000);
  }
  return out;
}

function rotate(p:Point,yaw:number,pitch:number):Point{
  const cy=Math.cos(yaw),sy=Math.sin(yaw),x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,cp=Math.cos(pitch),sp=Math.sin(pitch);
  return {...p,x,y:p.y*cp-z*sp,z:p.y*sp+z*cp};
}

function color(score:number,active:boolean){
  if(!active)return{r:103,g:231,b:255};
  if(score>=.8)return{r:255,g:92,b:126};
  if(score>=.6)return{r:255,g:181,b:93};
  if(score>=.4)return{r:114,g:240,b:220};
  return{r:90,g:214,b:255};
}

export default function HologramPointCloud({view,tiltX,tiltY,activeRegion,regionScores}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const points=useMemo(()=>buildHuman(),[]);
  const rotated=useMemo(()=>{
    const yaw=(view==='back'?Math.PI:0)+tiltX*.14, pitch=-tiltY*.075;
    return points.map(p=>rotate(p,yaw,pitch)).sort((a,b)=>a.z-b.z);
  },[points,view,tiltX,tiltY]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let raf=0,last=0;const start=performance.now();

    const draw=(now:number)=>{
      if(now-last<30){raf=requestAnimationFrame(draw);return;} last=now;
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,rect.width),h=Math.max(1,rect.height),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const elapsed=(now-start)/1000,camera=5.8,scale=Math.min(w/2.4,h/4.16),cx=w/2,cy=h*.515;
      ctx.save();ctx.globalCompositeOperation='lighter';

      for(let i=0;i<rotated.length;i+=2){
        const p=rotated[i],pers=camera/(camera-p.z),x=cx+p.x*scale*pers,y=cy-p.y*scale*pers,depth=clamp((p.z+.32)/.64,0,1),score=regionScores[p.region]??0,active=activeRegion===p.region,c=color(score,active),sh=.86+Math.sin(elapsed*2+p.seed*9)*.14,alpha=(.018+depth*.032)*p.intensity*sh*(active?1.5:1),radius=(1.8+depth*1.6)*pers*(active?1.12:1);
        ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.fillStyle=`rgba(${c.r},${c.g},${c.b},${alpha})`;ctx.fill();
      }
      for(const p of rotated){
        const pers=camera/(camera-p.z),x=cx+p.x*scale*pers,y=cy-p.y*scale*pers,depth=clamp((p.z+.32)/.64,0,1),score=regionScores[p.region]??0,active=activeRegion===p.region,c=color(score,active),pulse=.92+.08*Math.sin(elapsed*3.1+p.y*12+p.seed*4),alpha=clamp((.38+depth*.6)*p.intensity*pulse*(active?1.16:1),.15,1),radius=(.44+depth*.6)*pers*(active?1.18:1);
        ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.fillStyle=`rgba(${c.r},${c.g},${c.b},${alpha})`;ctx.fill();
      }
      const sy=((elapsed*.16)%1)*h,g=ctx.createLinearGradient(0,sy-22,0,sy+22);g.addColorStop(0,'rgba(120,245,255,0)');g.addColorStop(.5,'rgba(185,255,255,.05)');g.addColorStop(1,'rgba(120,245,255,0)');ctx.fillStyle=g;ctx.fillRect(cx-w*.3,sy-22,w*.6,44);
      ctx.restore();raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[rotated,activeRegion,regionScores]);

  return <canvas ref={canvasRef} className="hologram-point-cloud-canvas" aria-label={`${view==='front'?'Anterior':'Posterior'} continuous human point-cloud hologram`}/>;
}
