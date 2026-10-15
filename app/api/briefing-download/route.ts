export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 const length=Number(request.headers.get('content-length')||0);if(length>16000000)return new Response('File too large',{status:413});
 try{const form=await request.formData();const content=form.get('content'),type=form.get('type'),name=form.get('name');
 if(typeof content!=='string'||content.length>14000000||!['pdf','jpg'].includes(String(type))||typeof name!=='string'||!/^dongwon-news-\d{4}-\d{2}-\d{2}\.(pdf|jpg)$/.test(name))return new Response('Invalid file',{status:400});
 const bytes=Uint8Array.from(atob(content),c=>c.charCodeAt(0));
 const pdf=type==='pdf';if(pdf?String.fromCharCode(...bytes.slice(0,5))!=='%PDF-':bytes[0]!==255||bytes[1]!==216)return new Response('Invalid format',{status:400});
 return new Response(bytes,{headers:{'Content-Type':pdf?'application/pdf':'image/jpeg','Content-Disposition':`attachment; filename="${name}"`,'Content-Length':String(bytes.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Unable to create download',{status:400})}
}
