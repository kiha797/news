import {fetchNews,sources} from '@/lib/news';
import snapshots from '@/lib/news-snapshot.json';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('source')??'';
 if(!sources[id])return Response.json({error:'지원하지 않는 매체입니다.'},{status:400});
 const cache=(globalThis.caches as CacheStorage & {default?:Cache}|undefined)?.default;
 const key=new Request(new URL('/news-cache/'+id,request.url));
 try{
  const feed=await fetchNews(id);
  if(cache)try{await cache.put(key,Response.json(feed,{headers:{'Cache-Control':'public, max-age=604800'}}));}catch{}
  return Response.json({...feed,stale:false},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('News source unavailable',id,e instanceof Error?e.message:'fetch failed');
  let previous:unknown=snapshots[id as keyof typeof snapshots];
  if(cache)try{const saved=await cache.match(key);if(saved)previous=await saved.json();}catch{}
  return Response.json({...previous as object,stale:true},{headers:{'Cache-Control':'no-store'}});
 }
}
