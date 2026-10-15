import {jsPDF} from 'jspdf';
// Draw the live briefing directly to Canvas; no SVG foreignObject, remote fonts,
// cross-origin images or screen-capture permissions are needed.
export function captureBriefing(element:HTMLElement){
 const width=1400,ratio=2;
 const canvas=document.createElement('canvas');canvas.width=width*ratio;canvas.height=5000*ratio;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('이미지 생성 기능을 사용할 수 없습니다.');
 ctx.scale(ratio,ratio);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,5000);
 const text=(value:string,x:number,y:number,max:number,size=16,color='#26334a',bold=false)=>{
  ctx.font=`${bold?'700':'400'} ${size}px Arial, "Malgun Gothic", sans-serif`;ctx.fillStyle=color;
  let line='';for(const char of value){if(char==='\n'||ctx.measureText(line+char).width>max){ctx.fillText(line,x,y);y+=size*1.45;line=char==='\n'?'':char}else line+=char}
  if(line){ctx.fillText(line,x,y);y+=size*1.45}return y;
 };
 const heading=(value:string,x:number,y:number,w:number)=>{ctx.fillStyle='#ffbb16';ctx.fillRect(x,y-20,6,24);return text(value,x+15,y,w-15,22,'#182c60',true)+12};
 const content=(node:Element|null)=>node?.textContent?.trim()??'';
 const left=28,right=720,leftW=640,rightW=650;
 ctx.fillStyle='#182c60';ctx.fillRect(0,0,width,5);
 let ly=heading(content(element.querySelector('.brief-news .brief-heading h2')),left,46,leftW);
 for(const item of element.querySelectorAll('.brief-news-list>a')){
  const badge=item.querySelector('.brief-source') as HTMLElement|null;
  ctx.fillStyle=badge?.style.background||'#244373';ctx.fillRect(left,ly-16,115,24);
  text(content(badge),left+6,ly+1,103,14,'#fff',true);ly+=29;
  ly=text(content(item.querySelector('strong')),left,ly,leftW,20,'#1d2b40',true);
  ly=text(content(item.querySelector('.brief-news-meta')),left,ly+3,leftW,14,'#7a879a');
  ctx.strokeStyle='#dce3ed';ctx.beginPath();ctx.moveTo(left,ly);ctx.lineTo(left+leftW,ly);ctx.stroke();ly+=22;
 }
 const policy=element.querySelector('.brief-policy');if(policy){ly=heading(content(policy.querySelector('h3')),left,ly+12,leftW);for(const item of policy.querySelectorAll('a,p'))ly=text(content(item),left+8,ly,leftW-12,16)+8;}
 let ry=heading(content(element.querySelector('.brief-market .brief-heading h2')),right,46,rightW);
 ry=text(content(element.querySelector('.brief-market-status')),right,ry,rightW,14,'#7a879a')+10;
 let rowsBottom=ry;
 Array.from(element.querySelectorAll('.brief-rank-block')).forEach((block,index)=>{
  const x=right+index*332,w=316;let y=ry;
  y=text(content(block.querySelector('h3')),x,y,w,18,'#182c60',true);
  y=text(content(block.querySelector('.brief-rank-title>span')),x,y,w,13,'#7a879a')+10;
  for(const item of block.querySelectorAll('li>a')){
   const top=y;
   text(content(item.querySelector(':scope>b')),x,y,24,16,'#182c60',true);
   const change=item.querySelector('.brief-move');const val=content(change);
   const color=change?.classList.contains('down')?'#326cde':change?.classList.contains('up')||change?.classList.contains('new')?'#e63025':'#7a879a';
   text(val,x+w-43,y,43,15,color,true);
   y=text(content(item.querySelector('strong')),x+30,y,w-80,16,'#26334a',true);
   const manufacturer=content(item.querySelector('small'));if(manufacturer)y=text(manufacturer,x+30,y,w-35,12,'#7a879a');
   y=Math.max(y,top+47)+7;ctx.strokeStyle='#d3dce9';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+w,y-5);ctx.stroke();ctx.setLineDash([]);
  }rowsBottom=Math.max(rowsBottom,y);
 });
 ry=rowsBottom+24;const analysis=element.querySelector('.brief-analysis');if(analysis){ry=heading('특이분석 · 순위 데이터 기준',right,ry,rightW);for(const p of analysis.querySelectorAll('p'))ry=text(content(p),right+8,ry,rightW-16,15)+6;}
 ry=text(content(element.querySelector('.brief-baro-origin')),right,ry+12,rightW,14,'#244373');ry=text(content(element.querySelector('.brief-disclaimer')),right,ry+4,rightW,13,'#7a879a');
 let bottom=Math.max(ly,ry)+24;const issue=element.querySelector('.brief-noteworthy');if(issue){const issueText=content(issue.querySelector('strong'));ctx.fillStyle='#fff6d8';ctx.fillRect(20,bottom-4,1360,115);bottom=text('★ 주목할 이슈',36,bottom+22,1320,18,'#182c60',true);bottom=text(issueText,36,bottom+3,1320,19,'#182c60',true);bottom=text(content(issue.querySelector('small')),36,bottom,1320,14,'#7a879a')+20;}
 bottom=text('동원약품그룹 · 약업 뉴스 데스크',28,bottom+16,1344,14,'#6c7d96')+16;
 const output=document.createElement('canvas');output.width=width*ratio;output.height=Math.ceil(bottom)*ratio;output.getContext('2d')!.drawImage(canvas,0,0);
 return {image:output.toDataURL('image/jpeg',0.95),width,height:Math.ceil(bottom)};
}
function downloadFile(base64:string,name:string,type:'pdf'|'jpg'){
 // A real HTTP attachment response avoids delayed blob-link download blocking.
 let frame=document.querySelector<HTMLIFrameElement>('#brief-download-frame');
 if(!frame){frame=document.createElement('iframe');frame.id='brief-download-frame';frame.name='brief-download-frame';frame.style.display='none';document.body.appendChild(frame)}
 const form=document.createElement('form');form.method='POST';form.action='/api/briefing-download';form.target='brief-download-frame';form.style.display='none';
 for(const [key,value] of Object.entries({content:base64,name,type})){const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.appendChild(input)}
 document.body.appendChild(form);form.submit();form.remove();
}
export function exportBriefing(element:HTMLElement,mode:'pdf'|'jpg'){
 const captured=captureBriefing(element);const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());const name=`dongwon-news-${date}`;
 if(mode==='jpg'){downloadFile(captured.image.split(',')[1],name+'.jpg','jpg');return}
 const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
 const scale=Math.min(196/captured.width,134.5/captured.height);const w=captured.width*scale,h=captured.height*scale;pdf.addImage(captured.image,'JPEG',(210-w)/2,7,w,h);downloadFile(pdf.output('datauristring').split(',')[1],name+'.pdf','pdf');
}
