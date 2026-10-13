'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,RefreshCw,TrendingUp,Bell} from 'lucide-react';
import snapshot from '@/lib/baropharm-snapshot.json';
type Data=typeof snapshot & {stale?:boolean};
export function BaropharmTrend(){
 const [data,setData]=useState<Data>({...snapshot,stale:true});const [busy,setBusy]=useState(true);const [expanded,setExpanded]=useState(true);
 async function refresh(){setBusy(true);try{const r=await fetch('/api/baropharm',{cache:'no-store'});if(!r.ok)throw Error();setData(await r.json())}catch{setData(v=>({...v,stale:true}))}finally{setBusy(false)}}
 useEffect(()=>{void refresh()},[]);
 const time=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(data.fetchedAt));
 return <section className="baro-section" aria-label="바로팜 의약품 동향">
  <div className="baro-title"><div><span className="baro-label">바로팜 데이터 연구소</span><h2>의약품 순위</h2></div><button onClick={refresh} disabled={busy} aria-label="순위 새로고침"><RefreshCw size={17} className={busy?'spin':''}/></button></div>
  <div className="baro-compact-status">{busy?'최신 순위 확인 중':data.stale?'연결 지연 · 마지막 확인 자료':`확인 ${time}`}</div>
  <div className="baro-rankings">{([{key:'search',title:'의약품 검색순위',icon:TrendingUp},{key:'soldout',title:'품절입고알림 신청순위',icon:Bell}] as const).map(section=><div className="baro-ranking" key={section.key}><div className="baro-ranking-head"><section.icon size={21}/><h3>{section.title}</h3><span>{data[section.key].updated_at} 기준</span></div><ol>{data[section.key].rankings.slice(0,expanded?20:10).map(item=><li key={item.ranking}><a href={item.link} target="_blank" rel="noopener noreferrer"><span className={`baro-number ${item.ranking<=3?'top':''}`}>{item.ranking}</span><div><strong>{item.word}</strong>{item.manufacturer&&<span>{item.manufacturer}</span>}</div><span className={`baro-change ${item.fluctuation===null?'new':(item.fluctuation??0)>0?'up':(item.fluctuation??0)<0?'down':''}`} aria-label={`순위 ${item.fluctuation===null?'신규 진입':(item.fluctuation??0)>0?'상승':(item.fluctuation??0)<0?'하락':'변동 없음'} ${Math.abs(item.fluctuation??0)}`}>{item.fluctuation===null?'NEW':(item.fluctuation??0)>0?'▲':(item.fluctuation??0)<0?'▼':'-'}{item.fluctuation!==null&&item.fluctuation!==0&&Math.abs(item.fluctuation??0)}</span><ArrowUpRight size={14}/></a></li>)}</ol></div>)}</div>
  <div className="baro-footer"><button onClick={()=>setExpanded(v=>!v)}>{expanded?'10위까지 보기':'20위까지 펼치기'}</button><a href="https://www.baropharm.com/trend" target="_blank" rel="noopener noreferrer">바로팜 원문 보기 <ArrowUpRight size={15}/></a></div>
  <p className="baro-note">입고 알림 신청 기준이며, 현재 재고·입고 완료를 뜻하지 않습니다.</p>
 </section>;
}
