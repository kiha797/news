import { env } from 'cloudflare:workers';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return Response.json({ error: '접근할 수 없습니다.' }, { status: 403 });
  const db = env.DB;
  const secret = env.VISITOR_ADMIN_PIN;
  if (!db || !secret) return Response.json({ error: '관리자 기능이 준비되지 않았습니다.' }, { status: 503 });

  const ip = request.headers.get('cf-connecting-ip')?.slice(0, 45) || 'unknown';
  const now = Date.now();
  const attempt = await db.prepare('SELECT window_start AS windowStart, failures FROM visitor_admin_attempts WHERE ip_address = ?')
    .bind(ip).first<{ windowStart: number; failures: number }>();
  if (attempt && now - attempt.windowStart < 3600000 && attempt.failures >= 5) {
    return Response.json({ error: '입력 횟수를 초과했습니다. 1시간 후 다시 시도해 주세요.' }, { status: 429 });
  }

  let pin: unknown;
  try { ({ pin } = await request.json() as { pin?: unknown }); }
  catch { return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 }); }
  if (typeof pin !== 'string' || pin.length > 64 || pin !== secret) {
    await db.prepare('INSERT INTO visitor_admin_attempts (ip_address, window_start, failures) VALUES (?, ?, 1) ON CONFLICT(ip_address) DO UPDATE SET window_start = ?, failures = ?')
      .bind(ip, now, now, attempt && now - attempt.windowStart < 3600000 ? attempt.failures + 1 : 1).run();
    return Response.json({ error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  await db.prepare('DELETE FROM visitor_admin_attempts WHERE ip_address = ?').bind(ip).run();
  const result = await db.prepare('SELECT day, ip_address AS ipAddress, visited_at AS visitedAt FROM daily_visitors ORDER BY day DESC, visited_at DESC LIMIT 500')
    .all<{ day: string; ipAddress: string | null; visitedAt: string | null }>();
  return Response.json({ visitors: result.results }, { headers: { 'Cache-Control': 'no-store' } });
}
