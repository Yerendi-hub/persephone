// One-stroke shape comparison: resample to 64 points, centre, scale to a unit box, average point distance.
// Drawing direction does not matter; start point, shape and stroke order do.
const N=64;
const len=p=>{let d=0;for(let i=1;i<p.length;i++)d+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return d;};
export function resample(points,n=N){const I=len(points)/(n-1);if(!I)return Array(n).fill(points[0]);const src=points.map(p=>[...p]),out=[src[0]];let D=0;
  for(let i=1;i<src.length;i++){const d=Math.hypot(src[i][0]-src[i-1][0],src[i][1]-src[i-1][1]);if(D+d>=I&&d>0){const t=(I-D)/d,q=[src[i-1][0]+t*(src[i][0]-src[i-1][0]),src[i-1][1]+t*(src[i][1]-src[i-1][1])];out.push(q);src.splice(i,0,q);D=0;}else D+=d;}
  while(out.length<n)out.push(src[src.length-1]);return out.slice(0,n);}
export function normalize(points){const r=resample(points);const xs=r.map(p=>p[0]),ys=r.map(p=>p[1]);const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),s=Math.max(w,h)||1;
  const cx=xs.reduce((a,b)=>a+b)/r.length,cy=ys.reduce((a,b)=>a+b)/r.length;return r.map(([x,y])=>[+((x-cx)/s).toFixed(4),+((y-cy)/s).toFixed(4)]);}
const avg=(a,b)=>a.reduce((s,p,i)=>s+Math.hypot(p[0]-b[i][0],p[1]-b[i][1]),0)/a.length;
// 1.0 = identical. An average deviation of 6% of the shape size scores 90%.
export function similarity(template,attempt){const a=normalize(attempt);return Math.max(0,Math.min(1,1-Math.min(avg(template,a),avg(template,[...a].reverse()))/0.6));}
export function validStroke(points){return Array.isArray(points)&&points.length>=8&&points.length<=400&&points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<=10));}
// Points arrive in a 0..1 canvas space; a tiny scribble or a dot is rejected.
export const bigEnough=points=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))>=0.25&&len(points)>=0.6;};
