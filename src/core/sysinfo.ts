// Virtual hardware profile + simulated resource usage (clearly simulated data).
export interface SysProfile{ cpu:string; cores:number; gpu:string; ramGB:number; storageGB:number; }
export function genProfile(rand:()=>number=Math.random):SysProfile{
  const cpus=['WebCore W1','WebCore W1 Pro','WebCore W2','Aurora Silicon A1'];
  const gpus=['Aurora GPU G1 (集成)','Aurora GPU G2 (集成)','WebGL Render X'];
  const pick=(arr:string[])=>arr[Math.min(arr.length-1, Math.floor(rand()*arr.length))];
  return { cpu: pick(cpus), cores: [8,10,12][Math.min(2,Math.floor(rand()*3))], gpu: pick(gpus), ramGB: [8,16,16,24][Math.min(3,Math.floor(rand()*4))], storageGB: [128,256,256,512][Math.min(3,Math.floor(rand()*4))] };
}
export interface Usage{ cpuPct:number; ramUsedGB:number; ramPct:number; gpuPct:number; storageUsedGB:number; storagePct:number; }
export const SYSTEM_RESERVE_GB=3.2;
export function computeUsage(p:SysProfile, opts:{windows:number; vfsBytes:number; tick:number}):Usage{
  const wave=(Math.sin(opts.tick/3)+1)/2; // 0..1 slow wave
  const cpuPct=Math.round(Math.min(96, 6 + opts.windows*7 + wave*22));
  const ramUsedGB=Math.round((1.8 + opts.windows*0.42 + wave*0.5)*10)/10;
  const ramPct=Math.round(ramUsedGB/p.ramGB*100);
  const gpuPct=Math.round(Math.min(92, 4 + opts.windows*4 + wave*15));
  const storageUsedGB=Math.round((SYSTEM_RESERVE_GB + opts.vfsBytes/1e9)*100)/100;
  const storagePct=Math.round(storageUsedGB/p.storageGB*1000)/10;
  return { cpuPct, ramUsedGB, ramPct, gpuPct, storageUsedGB, storagePct };
}
