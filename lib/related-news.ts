export type RelatedNews={title:string;url:string;source:string;stale?:boolean;updatedAt?:string};
export function relatedScore(title:string){return (/약가|도매|유통|반품|수급|품절|공급중단|공급재개|직배송/.test(title)?10:0)+(/공급|급여|보험|약배송|약국|원료|제약.*정책|정책.*제약/.test(title)?3:0)}
export function selectRelatedNews(current:RelatedNews[],fallback:RelatedNews[]){
 const seen=new Set<string>();const pick=(items:RelatedNews[])=>items.filter(a=>relatedScore(a.title)>0).sort((a,b)=>relatedScore(b.title)-relatedScore(a.title)).filter(a=>{const key=a.title.replace(/[\s“”"'‘’·…]/g,'');if(seen.has(key)||seen.has(a.url))return false;seen.add(key);seen.add(a.url);return true});
 const fresh=pick(current);return [...fresh,...(fresh.length<3?pick(fallback):[])].slice(0,3);
}
