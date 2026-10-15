'use client';

import { useEffect, useState } from 'react';

const storageKey = 'pharma-desk-visitor-id';

export function TodayVisitors() {
  const [count, setCount] = useState<number | null>();

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

  return <div className="today-visitors" title="한국 시간 기준 · 같은 브라우저는 하루에 한 번 집계">
    <span>오늘 방문자</span><strong aria-live="polite">{count === undefined ? '확인 중' : count === null ? '집계 지연' : `${count.toLocaleString('ko-KR')}명`}</strong>
    <small>한국 시간 기준</small>
  </div>;
}
