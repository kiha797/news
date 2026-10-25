import {jsPDF} from 'jspdf';

// One fixed A4 landscape image is shared by the PDF and JPG downloads.
// Draw from the live board so the export contains the currently shown news.
export function captureBriefing(element:HTMLElement){
 const width=1500,pageWidth=2806,pageHeight=1984;
 const draft=document.createElement('canvas');draft.width=width;draft.height=2000;
 const ctx=draft.getContext('2d');if(!ctx)throw Error('이미지 생성 기능을 사용할 수 없습니다.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,draft.width,draft.height);
 const content=(node:Element|null)=>node?.textContent?.trim()??'';
 const text=(value:string,x:number,y:number,max:number,size=16,color='#26334a',bold=false)=>{
  ctx.font=`${bold?'700':'400'} ${size}px Arial, "Malgun Gothic", sans-serif`;ctx.fillStyle=color;
  let line='';const leading=size*1.35;
  for(const char of value){
   if(char==='\n'||(line&&ctx.measureText(line+char).width>max)){
    ctx.fillText(line,x,y);y+=leading;line=char==='\n'?'':char;
   }else line+=char;
  }
  if(line){ctx.fillText(line,x,y);y+=leading}
  return y;
 };
 const heading=(value:string,x:number,y:number,w:number,size=22)=>{
  ctx.fillStyle='#ffbd16';ctx.fillRect(x,y-19,6,23);
  return text(value,x+15,y,w-15,size,'#182c60',true)+11;
 };
 const left=32,leftW=490,right=552,rightW=916,gap=12,cardW=(rightW-gap*3)/4;
 ctx.fillStyle='#182c60';ctx.fillRect(0,0,width,6);
 const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}).format(new Date());
 text('동원약품그룹  |  약업 뉴스 데스크',left,49,1000,26,'#182c60',true);
 text(date,width-235,47,205,17,'#6b7891');
 ctx.strokeStyle='#dce3ed';ctx.beginPath();ctx.moveTo(left,68);ctx.lineTo(width-left,68);ctx.stroke();

 let ly=heading(content(element.querySelector('.brief-news .brief-heading h2')),left,105,leftW);
 for(const item of element.querySelectorAll('.brief-news-list .brief-story')){
  const badge=item.querySelector('.brief-source') as HTMLElement|null;
  ctx.fillStyle=badge?.style.background||'#244373';ctx.fillRect(left,ly-15,112,23);
  text(content(badge),left+6,ly+1,100,13,'#fff',true);ly+=27;
  ly=text(content(item.querySelector('.brief-primary strong')),left,ly,leftW,17,'#1d2b40',true);
  for(const related of item.querySelectorAll('.brief-news-meta a')){
   ly=text('• '+content(related),left+3,ly+1,leftW-3,12,'#718096');
  }
  ctx.strokeStyle='#e0e5ef';ctx.beginPath();ctx.moveTo(left,ly+2);ctx.lineTo(left+leftW,ly+2);ctx.stroke();ly+=16;
 }
 const policy=element.querySelector('.brief-policy');
 if(policy){ly=heading(content(policy.querySelector('h3')),left,ly+16,leftW,18);for(const item of policy.querySelectorAll('a,p'))ly=text(content(item),left+8,ly,leftW-12,14)+7;}

 let top=heading(content(element.querySelector('.brief-market .brief-heading h2')),right,105,rightW);
 top=text(content(element.querySelector('.brief-market-status')),right,top,rightW,13,'#718096')+16;
 let rankBottom=top;
 Array.from(element.querySelectorAll('.brief-rank-block')).forEach((block,blockIndex)=>{
  const items=Array.from(block.querySelectorAll('li>a'));
  for(let half=0;half<2;half++){
   const x=right+(blockIndex*2+half)*(cardW+gap);let y=top;
   ctx.fillStyle='#e8eef8';ctx.fillRect(x,y-19,cardW,52);
   y=text(content(block.querySelector('h3'))+(half?' (11–20)':' (1–10)'),x+7,y,cardW-14,15,'#182c60',true);
   y=text(content(block.querySelector('.brief-rank-title>span')),x+7,y,cardW-14,11,'#6b7891')+17;
   for(const item of items.slice(half*10,half*10+10)){
    const row=y;
    text(content(item.querySelector(':scope>b')),x+5,y,23,14,'#182c60',true);
    const change=item.querySelector('.brief-move');
    const color=change?.classList.contains('down')?'#326cde':change?.classList.contains('up')||change?.classList.contains('new')?'#e63025':'#7a879a';
    text(content(change),x+cardW-40,y,36,12,color,true);
    y=text(content(item.querySelector('strong')),x+30,y,cardW-77,13,'#26334a',true);
    const manufacturer=content(item.querySelector('small'));
    if(manufacturer)y=text(manufacturer,x+30,y,cardW-35,11,'#7a879a');
    y=Math.max(y,row+45)+8;
    ctx.strokeStyle='#d3dce9';ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+cardW,y-5);ctx.stroke();
   }
   rankBottom=Math.max(rankBottom,y);
  }
 });
 let ry=rankBottom+25;const analysis=element.querySelector('.brief-analysis');
 if(analysis){ry=heading('특이분석 · 순위 데이터 기준',right,ry,rightW,18);for(const p of analysis.querySelectorAll('p'))ry=text(content(p),right+7,ry,rightW-14,14)+5;}
 const issue=element.querySelector('.brief-noteworthy');
 let bottom=Math.max(ly,ry)+19;
 if(issue){
  ctx.fillStyle='#fff6d8';ctx.fillRect(left,bottom-7,width-left*2,86);
  bottom=text('★ 주목할 이슈',left+12,bottom+15,width-left*2-24,16,'#182c60',true);
  bottom=text(content(issue.querySelector('strong')),left+12,bottom+2,width-left*2-24,17,'#182c60',true);
  bottom=text(content(issue.querySelector('small')),left+12,bottom,width-left*2-24,12,'#7a879a')+10;
 }
 bottom=Math.max(bottom,ly,ry)+12;
 text('기사 제목을 선택하면 원문이 열립니다.  ·  동원약품그룹',left,bottom,width-64,12,'#6c7d96');
 bottom+=24;
 if(bottom>draft.height)throw Error('출력 영역이 너무 큽니다.');
 const output=document.createElement('canvas');output.width=pageWidth;output.height=pageHeight;
 const out=output.getContext('2d');if(!out)throw Error('이미지 생성 기능을 사용할 수 없습니다.');
 out.fillStyle='#fff';out.fillRect(0,0,pageWidth,pageHeight);
 // Fill the entire A4 sheet while keeping all rows, headlines and footer.
 out.drawImage(draft,0,0,width,Math.ceil(bottom),0,0,pageWidth,pageHeight);
 return output.toDataURL('image/jpeg',0.92);
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
 const image=captureBriefing(element);const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());const name=`dongwon-news-${date}`;
 if(mode==='jpg'){downloadFile(image.split(',')[1],name+'.jpg','jpg');return}
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 pdf.addImage(image,'JPEG',0,0,297,210);
 downloadFile(pdf.output('datauristring').split(',')[1],name+'.pdf','pdf');
}
