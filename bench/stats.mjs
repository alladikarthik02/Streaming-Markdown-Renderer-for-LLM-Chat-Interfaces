export function percentile(values,p=.95){
  if(!values.length||values.some(v=>!Number.isFinite(v)||v<0))throw new Error('Nonempty finite nonnegative samples required');
  const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}
export function median(values){return percentile(values,.5);}
export function checkRegression(baseline,current){
  if(!baseline||baseline.calibrated!==true)throw new Error('Missing calibrated baseline; regression status unknown');
  if(JSON.stringify(baseline.environment)!==JSON.stringify(current.environment))throw new Error('Incomparable benchmark environments');
  const failures=[];
  for(const [id,previous] of Object.entries(baseline.summary)){
    const now=current.summary[id];if(!now)throw new Error(`Missing stream ${id}`);
    for(const metric of ['renderP95Ms','workP95Ms']){
      const before=previous[metric],after=now[metric];
      if(!Number.isFinite(before)||!Number.isFinite(after)||before<0||after<0)throw new Error('Invalid summary values');
      if(after>Math.max(before*1.5,before+1))failures.push(`${id} ${metric}: ${before} -> ${after}`);
    }
  }
  if(!Object.keys(baseline.summary).length)throw new Error('Empty baseline');
  return failures;
}
