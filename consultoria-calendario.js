/* PRUMO — calendário de implantação da França Hospitality Consulting.
   Dados locais, sem acesso a clientes nem à API. */
(()=>{
"use strict";
const KEY="prumo-consult-calendar-v1";
const DEFAULT_START="2026-11-16";
const schedule=[
 {title:"Organização da oferta",goal:"Uma oferta clara e pronta para apresentar",tasks:[
  ["Escolher o Raio-X do Atendimento (R$ 149) como serviço de entrada",50],
  ["Definir o checklist de entrega e os limites do escopo",70]]},
 {title:"Materiais comerciais",goal:"Materiais prontos para enviar",tasks:[
  ["Conferir o site do GitHub e a apresentação comercial",55],
  ["Preparar mensagem personalizada e modelo de proposta",65]]},
 {title:"Primeiros contatos",goal:"Cinco abordagens feitas",tasks:[
  ["Selecionar cinco potenciais clientes com perfil adequado",55],
  ["Fazer cinco abordagens e cadastrar os contatos no PRUMO",65]]},
 {title:"Relacionamento e prospecção",goal:"Dez abordagens acumuladas",tasks:[
  ["Selecionar mais cinco negócios e realizar as abordagens",75],
  ["Responder interessados e organizar próximas conversas",45]]},
 {title:"Conversas e propostas",goal:"Primeira proposta enviada ou primeiro cliente",tasks:[
  ["Conversar com interessados e entender suas necessidades",70],
  ["Enviar uma proposta com escopo e agendar a entrega, se contratada",50]]},
 {title:"Aplicação piloto",goal:"Serviço entregue ou teste simulado realizado",tasks:[
  ["Executar um Raio-X contratado ou um exercício simulado",85],
  ["Registrar o tempo gasto e as melhorias identificadas",35]]},
 {title:"Feedback e acompanhamento",goal:"Aprendizados e próximos contatos organizados",tasks:[
  ["Solicitar feedback do cliente, caso tenha ocorrido atendimento",50],
  ["Fazer acompanhamento dos contatos interessados",70]]},
 {title:"Revisão e próximo ciclo",goal:"Resultados analisados e novo ciclo definido",tasks:[
  ["Conferir contatos, propostas, vendas e horas trabalhadas",65],
  ["Definir próximos passos e rever escopo ou preço se necessário",55]]}
];
const $=id=>document.getElementById(id);
const root=$("consult-weeks");
if(!root)return;
const initial=()=>({start:DEFAULT_START,done:[],notes:{}});
let state=initial();
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||"null");
 if(raw&&typeof raw==="object"){
  state.start=validDate(raw.start)?raw.start:DEFAULT_START;
  state.done=Array.isArray(raw.done)?raw.done.filter(s=>typeof s==="string"&&/^[0-7]-[01]$/.test(s)):[];
  state.notes=raw.notes&&typeof raw.notes==="object"&&!Array.isArray(raw.notes)?raw.notes:{};
 }
}catch(e){}
const total=schedule.reduce((n,w)=>n+w.tasks.length,0);
const fmt=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
function validDate(s){
 if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [y,m,d]=s.split("-").map(Number);
 const date=new Date(y,m-1,d,12);
 return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;
}
function atDay(dayOffset){
 const [y,m,d]=state.start.split("-").map(Number);
 const date=new Date(y,m-1,d+dayOffset,12);
 return date;
}
function dateString(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){$("consult-calendar-msg").textContent="Não foi possível salvar no navegador. Verifique o espaço de armazenamento.";}}
function render(openWeeks){
 $("consult-start").value=state.start;
 $("consult-range").textContent=fmt.format(atDay(0))+" até "+fmt.format(atDay(55));
 const done=new Set(state.done);
 let finished=0;
 const cards=schedule.map((week,i)=>{
  const count=week.tasks.filter((task,j)=>done.has(i+"-"+j)).length;finished+=count;
  const status=count===2?"Concluída":count===1?"Em andamento":"A fazer";
  const expanded=(openWeeks||[0]).includes(i)?" open":"";
  const rows=week.tasks.map(([task,minutes],j)=>{
   const id="consult-cal-"+i+"-"+j;
   const checked=done.has(i+"-"+j)?" checked":"";
   return '<label class="consult-cal-task"><input type="checkbox" data-cal-week="'+i+'" data-cal-task="'+j+'" id="'+id+'"'+checked+'><span>'+escapeHtml(task)+'</span><small>'+minutes+' min</small></label>';
  }).join("");
  return '<details class="card consult-week" data-cal-card="'+i+'"'+expanded+'><summary class="consult-week-summary"><span class="consult-week-number">Semana '+(i+1)+'</span><span class="consult-week-info"><strong>'+escapeHtml(week.title)+'</strong><small>'+fmt.format(atDay(7*i))+' – '+fmt.format(atDay(7*i+6))+'</small></span><span class="consult-week-status">'+status+'</span></summary><div class="consult-week-body"><p class="consult-week-goal">Objetivo: '+escapeHtml(week.goal)+'</p>'+rows+'<label class="consult-week-note-label" for="consult-note-'+i+'">Anotações da semana (opcional)</label><textarea class="consult-week-note" data-cal-note="'+i+'" id="consult-note-'+i+'" maxlength="700" rows="2" placeholder="O que funcionou? O que pode esperar?">'+escapeHtml(state.notes[i]||"")+'</textarea></div></details>';
 }).join("");
 root.innerHTML=cards;
 $("consult-cal-progress").textContent=finished+" de "+total+" atividades";
 $("consult-cal-bar").style.width=(finished/total*100)+"%";
 $("consult-cal-meter").setAttribute("aria-valuenow",String(Math.round(finished/total*100)));
 const next=schedule.flatMap((w,i)=>w.tasks.map(([task],j)=>({i,j,task}))).find(item=>!done.has(item.i+"-"+item.j));
 $("consult-next-step").textContent=next?"Próximo passo: "+next.task:"Parabéns! O ciclo está concluído. Revise o que funcionou antes de planejar outro.";
}
function expandedWeeks(){return [...root.querySelectorAll("details[open]")].map(x=>Number(x.dataset.calCard));}
root.addEventListener("change",e=>{
 const target=e.target;
 if(!target.matches("[data-cal-week]"))return;
 const i=Number(target.dataset.calWeek),j=Number(target.dataset.calTask);
 if(!Number.isInteger(i)||!Number.isInteger(j)||!schedule[i]||!schedule[i].tasks[j])return;
 const id=i+"-"+j;
 state.done=target.checked?[...new Set([...state.done,id])]:state.done.filter(x=>x!==id);
 const open=expandedWeeks();save();render(open);
});
root.addEventListener("input",e=>{
 const t=e.target;if(!t.matches("[data-cal-note]"))return;
 const i=Number(t.dataset.calNote);
 if(i<0||i>=8||!Number.isInteger(i))return;
 state.notes[i]=t.value.slice(0,700);save();
});
$("consult-start").addEventListener("change",e=>{
 if(!validDate(e.target.value)){e.target.value=state.start;return;}
 state.start=e.target.value;save();render(expandedWeeks());
 $("consult-calendar-msg").textContent="As semanas foram remarcadas. As atividades concluídas foram preservadas.";
});
function download(filename,text,kind){
 const blob=new Blob([text],{type:kind}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const icsEscape=s=>String(s).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
$("consult-export-ics").addEventListener("click",()=>{
 const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 const events=schedule.map((week,i)=>{
  const date=dateString(atDay(7*i)).replace(/-/g,"");
  const nextDate=dateString(atDay(7*i+1)).replace(/-/g,"");
  const desc=week.tasks.map(([t,n])=>t+" ("+n+" min)").join("\n")+"\nTempo sugerido na semana: 2 horas. Ajuste o dia e o horário como preferir.";
  return ["BEGIN:VEVENT","UID:prumo-consultoria-"+i+"-"+state.start+"@github-pages","DTSTAMP:"+stamp,"DTSTART;VALUE=DATE:"+date,"DTEND;VALUE=DATE:"+nextDate,"SUMMARY:"+icsEscape("PRUMO | Semana "+(i+1)+" — "+week.title),"DESCRIPTION:"+icsEscape(desc),"END:VEVENT"].join("\r\n");
 });
 const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//PRUMO//Consultoria 8 semanas//PT-BR","CALSCALE:GREGORIAN",...events,"END:VCALENDAR"].join("\r\n");
 download("prumo-consultoria-8-semanas.ics",ics,"text/calendar;charset=utf-8");
 $("consult-calendar-msg").textContent="Calendário .ics gerado: importe no seu aplicativo de calendário. Não há sincronização automática.";
});
window.addEventListener("prumo:calendar-restored",()=>{
 state=initial();
 try{
  const data=JSON.parse(localStorage.getItem(KEY)||"null");
  if(data&&validDate(data.start))state.start=data.start;
  if(data&&Array.isArray(data.done))state.done=data.done.filter(s=>typeof s==="string"&&/^[0-7]-[01]$/.test(s));
  if(data&&data.notes&&typeof data.notes==="object"&&!Array.isArray(data.notes))state.notes=data.notes;
 }catch(e){}
 render([0]);
});
render([0]);
})();