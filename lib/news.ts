export const sources:Record<string,{name:string;url:string}>={yakup:{name:'약업신문',url:'https://www.yakup.com/'},medipana:{name:'메디파나뉴스',url:'https://www.medipana.com/'},kpanews:{name:'약사공론',url:'https://www.kpanews.co.kr/'}};
export type Article={title:string;url:string};
function clean(s:string){const entities:Record<string,string>={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',middot:'·',hellip:'…',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—'};return s.replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c<=0x10ffff?String.fromCodePoint(c):''}).replace(/&([a-z]+);/gi,(a,n)=>entities[n]??a).replace(/\s+/g,' ').trim();}
export function parseNews(html:string,id:string):Article[]{const source=sources[id];if(!source)return[];const seen=new Set<string>();const items:Article[]=[];
// Remove scripts, comments and styles so hidden template markup cannot become news.
html=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
for(const match of html.matchAll(/<a\b([^>]*?)\bhref\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)){
 const href=clean(match[2]);let url:URL;try{url=new URL(href,source.url)}catch{continue}
 if(url.hostname!==new URL(source.url).hostname||!['http:','https:'].includes(url.protocol))continue;
 const articleId=id==='yakup'?url.searchParams.get('nid'):url.searchParams.get('idxno');
 if(!articleId||!/^\d+$/.test(articleId)||seen.has(articleId))continue;
 if(id==='yakup'&&url.searchParams.get('mode')!=='view')continue;
 if(id!=='yakup'&&!url.pathname.endsWith('/articleView.html'))continue;
 const inner=match[4];let title='';
 if(id==='yakup'){const m=inner.match(/<div\b[^>]*class=["'][^"']*title_con[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);if(m)title=clean(m[1]);}
 else {const h=inner.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);title=clean(h?h[1]:inner);}
 if(title.length<8||title.length>180||/^\[(화촉|부음|인사|동정|알림)\]/.test(title))continue;
 // Image-only anchors and article descriptions are not headlines.
 if(!title||(!/<h[1-6]\b/i.test(inner)&&/class=["'][^"']*(?:summary|auto-sums|description)/i.test(match[1]+match[3]+inner)))continue;
 seen.add(articleId);items.push({title,url:url.href});if(items.length===10)break;
}return items;}
export async function fetchNews(id:string){const source=sources[id];const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);try{const response=await fetch(source.url,{signal:controller.signal,headers:{Accept:'text/html','User-Agent':'PharmaDesk/1.0 (headline reader)'},cache:'no-store'});if(!response.ok)throw Error('Source HTTP '+response.status);const bytes=await response.arrayBuffer();if(bytes.byteLength>5000000)throw Error('Oversize source');const probe=new TextDecoder().decode(bytes.slice(0,5000));const charset=response.headers.get('content-type')?.match(/charset=["']?([\w-]+)/i)?.[1]??probe.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]??'utf-8';const html=new TextDecoder(charset).decode(bytes);const articles=parseNews(html,id);if(articles.length<10)throw Error('Incomplete main headlines: '+articles.length);return {id,...source,articles,updatedAt:new Date().toISOString()};}finally{clearTimeout(timeout)}}
