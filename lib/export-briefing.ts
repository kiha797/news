export async function captureBriefing(element:HTMLElement){
 const {toJpeg}=await import('html-to-image');
 await document.fonts.ready;
 const holder=document.createElement('div');holder.style.cssText='position:fixed;left:-20000px;top:0;width:1400px;background:white;pointer-events:none;';
 const copy=element.cloneNode(true) as HTMLElement;copy.style.cssText+=';width:1400px;max-width:none;grid-template-columns:minmax(0,1fr) minmax(0,1fr);box-sizing:border-box;';
 copy.querySelectorAll('button').forEach(b=>b.remove());
 holder.appendChild(copy);document.body.appendChild(holder);
 try{const height=copy.getBoundingClientRect().height;const image=await toJpeg(copy,{quality:0.96,pixelRatio:2,backgroundColor:'#ffffff',width:1400,height,cacheBust:false,skipFonts:true});return {image,width:1400,height}}finally{holder.remove()}
}
export async function exportBriefing(element:HTMLElement,mode:'pdf'|'jpg'|'print'){
 const captured=await captureBriefing(element);const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());const name=`pharma-news-${date}`;
 if(mode==='jpg'){const a=document.createElement('a');a.href=captured.image;a.download=name+'.jpg';a.click();return}
 // Portrait A4, top half (210 x 148.5 mm), with 7 mm margins.
 const scale=Math.min(196/captured.width,134.5/captured.height);const width=captured.width*scale,height=captured.height*scale;const x=(210-width)/2;
 if(mode==='pdf'){const {jsPDF}=await import('jspdf');const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});pdf.addImage(captured.image,'JPEG',x,7,width,height);pdf.save(name+'.pdf');return}
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;bottom:0;right:0;border:0;';document.body.appendChild(frame);
 const doc=frame.contentDocument;if(!doc){frame.remove();throw Error('Print unavailable')}
 doc.open();doc.write(`<!doctype html><html><head><title>${name}</title><style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:white}img{display:block;width:${width}mm;height:${height}mm;margin:7mm 0 0 ${x}mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body><img alt="약업 뉴스 요약" src="${captured.image}"></body></html>`);doc.close();
 const img=doc.querySelector('img')!;if(!img.complete)await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('Print image unavailable'))});
 frame.contentWindow?.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),120000);
}
