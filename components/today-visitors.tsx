'use client';

import { useEffect, useState } from 'react';

const storageKey = 'pharma-desk-visitor-id';

export function TodayVisitors() {
  const [count, setCount] = useState<number | null>();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visitors, setVisitors] = useState<Array<{ day: string; ipAddress: string | null; visitedAt: string | null }> | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    async function update() {
      let visitorId: string | null = null;
      try {
        visitorId = localStorage.getItem(storageKey);
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem(storageKey, visitorId);
        }
      } catch {
        visitorId = crypto.randomUUID();
      }
      try {
        const response = await fetch('/api/visitors', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId }), cache: 'no-store',
        });
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json() as { count: number };
        if (active && Number.isSafeInteger(data.count)) setCount(data.count);
      } catch {
        if (active) setCount(null);
      }
    }
    void update();
    return () => { active = false; };
  }, []);

  async function showRecords(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/visitors/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }), cache: 'no-store',
      });
      const data = await response.json() as { visitors?: typeof visitors; error?: string };
      if (!response.ok) throw new Error(data.error || '조회할 수 없습니다.');
      setVisitors(data.visitors ?? []); setPin('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '조회할 수 없습니다.'); }
    finally { setLoading(false); }
  }

  function close() { setOpen(false); setPin(''); setError(''); setVisitors(null); setQuery(''); }
  const shownVisitors = visitors?.filter(row => `${row.day} ${row.ipAddress ?? ''}`.includes(query.trim())) ?? [];

  return <>
    <div className="today-visitors" title="한국 시간 기준 · 같은 브라우저는 하루에 한 번 집계">
      <button type="button" onClick={() => setOpen(true)} aria-label="방문자 기록 관리자 조회">
        <span>오늘 방문자</span><strong aria-live="polite">{count === undefined ? '확인 중' : count === null ? '집계 지연' : `${count.toLocaleString('ko-KR')}명`}</strong>
      </button><small>한국 시간 기준</small>
    </div>
    {open && <div className="visitor-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <section className="visitor-modal" role="dialog" aria-modal="true" aria-labelledby="visitor-modal-title" onKeyDown={e => { if (e.key === 'Escape') close(); }}>
        <div className="visitor-modal-head"><div><h2 id="visitor-modal-title">방문자 접속 기록</h2><p>관리자 전용 · 최근 30일, 최대 500건</p></div><button type="button" onClick={close} aria-label="닫기">×</button></div>
        {visitors === null ? <form onSubmit={showRecords} className="visitor-admin-form">
          <label htmlFor="visitor-pin">관리자 비밀번호</label>
          <input id="visitor-pin" autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={64} value={pin} onChange={e => setPin(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? '확인 중…' : '접속 기록 보기'}</button>
          {error && <p className="visitor-admin-error" role="alert">{error}</p>}
        </form> : <div className="visitor-records">
          <p>IP 주소는 접속 회선 정보이며 방문자의 이름을 확인하는 정보는 아닙니다. 기존 기록은 IP가 없을 수 있습니다.</p>
          <input className="visitor-search" aria-label="날짜 또는 IP 검색" placeholder="날짜 또는 IP 검색" value={query} onChange={e => setQuery(e.target.value)} />
          {shownVisitors.length === 0 ? <p>일치하는 방문 기록이 없습니다.</p> : <div className="visitor-records-scroll"><table><thead><tr><th>방문 일시 (한국)</th><th>IP 주소</th></tr></thead><tbody>
            {shownVisitors.map((row, index) => <tr key={`${row.day}-${index}`}><td>{row.visitedAt ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.visitedAt)) : row.day}</td><td>{row.ipAddress || '이전 기록 · IP 없음'}</td></tr>)}
          </tbody></table></div>}
        </div>}
      </section>
    </div>}
  </>;
}
