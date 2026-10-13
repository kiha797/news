import snapshot from '@/lib/baropharm-snapshot.json';
const endpoints=['search_rankings','soldout_rankings','trend_stats'] as const;
export async function GET(request:Request){
 const cache=(globalThis.caches as CacheStorage & {default?:Cache}|undefined)?.default;
 const key=new Request(new URL('/baropharm-cache/v1',request.url));
 let previous:unknown=snapshot;
 if(cache)try{const saved=await cache.match(key);if(saved){const data=await saved.json() as typeof snapshot;previous=data;if(Date.now()-Date.parse(data.fetchedAt)<600000)return Response.json({...data,stale:false},{headers:{'Cache-Control':'no-store'}})}}catch{}
 try{
  const results=await Promise.all(endpoints.map(async endpoint=>{const response=await fetch('https://api-v2.baropharm.com/'+endpoint,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw Error('Source unavailable');return response.json()}));
  const [search,soldout,stats]=results as [typeof snapshot.search,typeof snapshot.soldout,typeof snapshot.stats];
  const normalize=(data:typeof snapshot.search | typeof snapshot.soldout)=>{if(!Array.isArray(data.rankings)||!data.rankings.length||typeof data.updated_at!=='string')throw Error('Invalid rankings');return {updated_at:data.updated_at,rankings:data.rankings.slice(0,20).map(item=>{const link=new URL(item.link);if(link.hostname!=='www.baropharm.com'||link.protocol!=='https:'||typeof item.word!=='string'||!Number.isFinite(item.ranking))throw Error('Invalid item');return {word:item.word,ranking:item.ranking,fluctuation:item.fluctuation===null?null:Number(item.fluctuation)||0,manufacturer:('manufacturer' in item?item.manufacturer:'') as string,link:link.href}})}};
  if(!Number.isFinite(stats.soldout_total_count)||!Number.isFinite(stats.soldout_notified_count))throw Error('Invalid totals');
  const data={search:normalize(search),soldout:normalize(soldout),stats:{soldout_total_count:stats.soldout_total_count,soldout_notified_count:stats.soldout_notified_count},fetchedAt:new Date().toISOString()};
  if(cache)try{await cache.put(key,Response.json(data,{headers:{'Cache-Control':'public, max-age=604800'}}))}catch{}
  return Response.json({...data,stale:false},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({...previous as object,stale:true},{headers:{'Cache-Control':'no-store'}})}
}
