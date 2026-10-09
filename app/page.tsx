'use client';

import {useEffect, useMemo, useState} from 'react';
import {ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, Newspaper, ShieldCheck, Pill, Landmark, Truck, Radio, RefreshCw, Search, X} from 'lucide-react';
import snapshots from '@/lib/news-snapshot.json';
import {AdSpace} from '@/components/ad-space';

type Article = {title:string; url:string; image?:string};
type Feed = {id:string; name:string; url:string; articles:Article[]; updatedAt?:string; stale?:boolean};
type Category = '전체'|'정책·보험'|'제약·바이오'|'유통·약국';

const sources=[
  {id:'yakup',name:'약업신문',url:'https://www.yakup.com/',domain:'YAKUP.COM',letter:'약',color:'#17664b'},
  {id:'medipana',name:'메디파나뉴스',url:'https://www.medipana.com/',domain:'MEDIPANA.COM',letter:'M',color:'#2363ba'},
  {id:'kpanews',name:'약사공론',url:'https://www.kpanews.co.kr/',domain:'KPANEWS.CO.KR',letter:'약',color:'#a15128'},
  {id:'dailypharm',name:'데일리팜',url:'https://www.dailypharm.com/',domain:'DAILYPHARM.COM',letter:'D',color:'#b52f42'},
  {id:'hitnews',name:'히트뉴스',url:'https://www.hitnews.co.kr/',domain:'HITNEWS.CO.KR',letter:'H',color:'#5a48a5'},
];
const resources=[
 {name:'의약품안전나라',purpose:'제품 허가 · 회수 · 판매중지',detail:'제품명으로 허가사항과 안전 정보를 확인하세요.',url:'https://nedrug.mfds.go.kr/',icon:Pill,color:'#247a68'},
 {name:'건강보험심사평가원',purpose:'약제 급여 · 약가 관련 공지',detail:'급여기준과 약제 관련 공지를 확인하세요.',url:'https://www.hira.or.kr/main.do',icon:Landmark,color:'#3468b0'},
 {name:'식품의약품안전처',purpose:'안전 · 행정 · 정책 공지',detail:'의약품 고시와 행정 공지를 확인하세요.',url:'https://www.mfds.go.kr/',icon:ShieldCheck,color:'#a66030'},
 {name:'한국의약품유통협회',purpose:'유통업계 공지 · 교육',detail:'협회 공지와 KGSP 교육 정보를 확인하세요.',url:'https://www.kpda.kr/',icon:Truck,color:'#7252a9'},
];
const categories:Category[]=['전체','정책·보험','제약·바이오','유통·약국'];
const interestWords=['약가인하','품절','공급중단','유통','배송','반품','3PL','의약품','약국'];

function categoryOf(title:string):Exclude<Category,'전체'>{
  if(/급여|보험|복지부|식약처|국회|법안|정책|허가사항/.test(title)) return '정책·보험';
  if(/유통|배송|약국|도매|품절|공급|반품|약사/.test(title)) return '유통·약국';
  return '제약·바이오';
}
function Highlight({title}:{title:string}){
  const pattern=new RegExp(`(${interestWords.map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'gi');
  return <>{title.split(pattern).map((part,i)=>interestWords.some(w=>w.toLowerCase()===part.toLowerCase())?<mark key={i}>{part}</mark>:part)}</>;
}

function ArticleImage({article,source}:{article:Article;source:typeof sources[number]}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[article.image]);
  return <div className="article-image" style={{'--source':source.color} as React.CSSProperties}>
    {article.image&&!failed?<img src={article.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="image-placeholder"><Newspaper size={36}/><span>{categoryOf(article.title)}</span></div>}
    <span className="image-source">{source.name}</span>
  </div>;
}

export default function Home(){
  const [feeds,setFeeds]=useState<Record<string,Feed>>(()=>Object.fromEntries(Object.entries(snapshots).map(([k,v])=>[k,{...v,stale:true}])));
  const [busy,setBusy]=useState(true);
  const [date,setDate]=useState('');
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState<Category>('전체');
  const [bookmarks,setBookmarks]=useState<string[]>([]);
  const [newUrls,setNewUrls]=useState<string[]>([]);
  const [savedOnly,setSavedOnly]=useState(false);

  async function refresh(){
    setBusy(true);
    await Promise.all(sources.map(async s=>{
      try{
        const response=await fetch('/api/news?source='+s.id,{cache:'no-store'});
        if(!response.ok) throw Error();
        const data=await response.json() as Feed;
        setFeeds(v=>({...v,[s.id]:data}));
      }catch{
        setFeeds(v=>({...v,[s.id]:{...(v[s.id]??{...s,articles:[]}),stale:true}}));
      }
    }));
    setBusy(false);
  }

  useEffect(()=>{
    setDate(new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date()));
    try{setBookmarks(JSON.parse(localStorage.getItem('pharma-bookmarks')||'[]'));}catch{}
    void refresh();
  },[]);

  useEffect(()=>{
    if(busy) return;
    const urls=Object.values(feeds).flatMap(f=>f.articles.map(a=>a.url));
    let seen:string[]=[];
    try{seen=JSON.parse(localStorage.getItem('pharma-seen')||'[]');}catch{}
    setNewUrls(seen.length?urls.filter(url=>!seen.includes(url)):urls);
    localStorage.setItem('pharma-seen',JSON.stringify(urls));
  },[busy,feeds]);

  const toggleBookmark=(url:string)=>setBookmarks(current=>{
    const next=current.includes(url)?current.filter(v=>v!==url):[...current,url];
    localStorage.setItem('pharma-bookmarks',JSON.stringify(next));
    return next;
  });
  const normalized=query.trim().toLowerCase();
  const visible=useMemo(()=>Object.fromEntries(sources.map(s=>{
    const feed=feeds[s.id];
    const articles=(feed?.articles??[]).filter(a=>(!normalized||a.title.toLowerCase().includes(normalized))&&(category==='전체'||categoryOf(a.title)===category)&&(!savedOnly||bookmarks.includes(a.url)));
    return [s.id,articles];
  })),[feeds,normalized,category,savedOnly,bookmarks]);
  const total=Object.values(feeds).reduce((n,f)=>n+f.articles.length,0);
  const shown=Object.values(visible).reduce((n,items)=>n+(items as Article[]).length,0);

  return <div className="shell">
    <header className="masthead"><a href="/" className="brand"><span className="brand-icon"><Newspaper size={23}/></span><span>PHARMA<span className="brand-light"> DESK</span></span></a><span className="edition">PHARMACEUTICAL NEWS BRIEFING</span><span className="header-label">약업계 뉴스 모아보기</span></header>
    <main>
      <section className="intro"><div><div className="eyebrow"><span/> DAILY NEWSROOM</div><h1>오늘의 약업 뉴스</h1><p>약업신문 · 메디파나뉴스 · 약사공론 · 데일리팜 · 히트뉴스의 주요 기사를 모았습니다.</p></div><div className="intro-actions"><span className="date">{date}</span><button onClick={refresh} disabled={busy}><RefreshCw size={16} className={busy?'spin':''}/>{busy?'뉴스 확인 중':'새로고침'}</button></div></section>
      <section className="control-panel" aria-label="기사 검색 및 분류">
        <div className="search-box"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="회사명, 제품명, 정책을 검색하세요" aria-label="전체 기사 검색"/>{query&&<button className="clear-search" onClick={()=>setQuery('')} aria-label="검색어 지우기"><X size={17}/></button>}</div>
        <div className="filter-row"><div className="category-tabs">{categories.map(item=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div><button className={`saved-filter ${savedOnly?'active':''}`} onClick={()=>setSavedOnly(v=>!v)}><Bookmark size={16}/><span>보관함</span><b>{bookmarks.length}</b></button></div>
        <div className="keyword-guide"><span>관심 키워드</span>{interestWords.map(word=><button key={word} onClick={()=>setQuery(word)} className={query===word?'active':''}>{word}</button>)}</div>
      </section>
      <AdSpace placement="top" />
      <div className="news-toolbar"><div><Radio size={17}/><strong>5개 매체 · 메인 TOP 10</strong><span className="count">{busy?'확인 중':(shown===total?`${total}개 기사`:`${shown}개 검색됨`)}</span></div><span className="order-note">메인 노출 순서 · 조회수 순위 아님 · 원문 연결 <ArrowUpRight size={14}/></span></div>
      {shown===0&&!busy&&<div className="global-empty"><Search size={27}/><strong>조건에 맞는 기사가 없습니다.</strong><span>검색어나 분류를 바꿔보세요.</span><button onClick={()=>{setQuery('');setCategory('전체');setSavedOnly(false)}}>전체 기사 보기</button></div>}
      <div className="columns">{sources.map(s=>{
        const feed=feeds[s.id]; const articles=visible[s.id] as Article[];
        return <section id={`source-${s.id}`} className={`news-column ${shown===0?'hidden-column':''}`} key={s.id} style={{'--source':s.color} as React.CSSProperties}>
          <div className="source-heading"><div className="source-identity"><span className="source-mark">{s.letter}</span><div><h2>{s.name}</h2><span className="domain">{s.domain}</span></div></div><a href={s.url} target="_blank" rel="noopener noreferrer" className="source-link" aria-label={`${s.name} 홈페이지 열기`}><ArrowUpRight size={20}/></a></div>
          {articles[0]&&<a href={articles[0].url} target="_blank" rel="noopener noreferrer" className="column-image"><ArticleImage article={articles[0]} source={s}/></a>}
          <div className="source-status"><span>{articles.length} HEADLINES</span><span className={feed?.stale?'status-delayed':'status-current'}>{feed?.updatedAt?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(feed.updatedAt))+(feed.stale?' 마지막 확인':' 최신 확인'):busy?'확인 중':'연결 확인 필요'}</span></div>
          {feed?.stale&&<div className="stale-note">{busy?'최신 기사를 확인하고 있습니다.':'업데이트 지연 · 마지막 확인 기사를 표시합니다.'}</div>}
          {articles.length===0?<div className="column-empty">이 매체에는 조건에 맞는 기사가 없습니다.</div>:<ol>{articles.map((a,j)=>{
            const saved=bookmarks.includes(a.url); const isNew=newUrls.includes(a.url);
            return <li key={a.url} className={j===0?'lead':''}><div className="article-row"><a href={a.url} target="_blank" rel="noopener noreferrer"><span className="rank">{String(j+1).padStart(2,'0')}</span><div className="article-copy"><div className="article-meta">{j===0&&<span className="lead-label">주요 기사</span>}{isNew&&<span className="new-label">NEW</span>}<span className="category-label">{categoryOf(a.title)}</span></div><h3><Highlight title={a.title}/></h3></div><ArrowUpRight className="article-arrow" size={16}/></a><button className={`bookmark-button ${saved?'saved':''}`} onClick={()=>toggleBookmark(a.url)} aria-label={saved?'보관함에서 삭제':'기사 보관'} title={saved?'보관함에서 삭제':'기사 보관'}>{saved?<BookmarkCheck size={18}/>:<Bookmark size={18}/>}</button></div></li>
          })}</ol>}
          <a className="all-news" href={s.url} target="_blank" rel="noopener noreferrer">{s.name} 전체 뉴스 <ArrowRight size={16}/></a>
        </section>;
      })}
      <aside className="resource-card" aria-label="약업 실무 바로가기">
        <div className="resource-heading"><span className="resource-badge"><ShieldCheck size={23}/></span><div><h2>약업 실무 바로가기</h2><p>공식 정보 확인</p></div></div>
        <div className="resource-links">{resources.map(item=><a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" style={{'--resource':item.color} as React.CSSProperties}><span className="resource-icon"><item.icon size={23}/></span><div><span className="resource-purpose">{item.purpose}</span><h3>{item.name}</h3><p>{item.detail}</p></div><ArrowUpRight size={17} className="resource-external"/></a>)}</div>
        <div className="resource-note">제품·회수·급여 정보는 해당 기관의 최신 공지와 시행일을 확인하세요.</div>
      </aside>
      </div>
      <AdSpace placement="bottom" />
      <footer><span className="footer-brand">PHARMA DESK</span><p>기사 제목을 선택하면 해당 언론사의 원문이 열립니다. 기사 저작권은 각 언론사에 있습니다.</p><span>5 SOURCES. ONE DESK.</span></footer>
    </main>
  </div>;
}
