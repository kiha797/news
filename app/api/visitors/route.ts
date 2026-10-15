import { env } from 'cloudflare:workers';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }

  let visitorId: unknown;
  try {
    ({ visitorId } = await request.json() as { visitorId?: unknown });
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
  if (typeof visitorId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
    return Response.json({ error: '잘못된 방문 식별자입니다.' }, { status: 400 });
  }

  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const db = env.DB;
  if (!db) return Response.json({ error: '방문자 수를 확인할 수 없습니다.' }, { status: 503 });
  try {
    await db.prepare('INSERT OR IGNORE INTO daily_visitors (day, visitor_id) VALUES (?, ?)').bind(day, visitorId).run();
    const result = await db.prepare('SELECT COUNT(*) AS count FROM daily_visitors WHERE day = ?').bind(day).first<{ count: number }>();
    return Response.json({ day, count: result?.count ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '방문자 수를 확인할 수 없습니다.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
