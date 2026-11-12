/* PRUMO — versão web. Sem chaves privadas no navegador. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="norte-ai-local-v1";
const greet="Olá! Sou a PRUMO, sua mentora de apoio. Podemos pensar juntas sobre uma decisão, definir uma prioridade ou simplesmente organizar o que está acontecendo. Por onde gostaria de começar?";
const defaults=()=>({energy:0,tasks:[],projects:[],journal:[],chat:[{role:"assistant",content:greet}],opportunities:[],incomeSettings:{goal:1000,weeklyMinutes:120}});
let state=defaults();
try{const stored=JSON.parse(localStorage.getItem(KEY)||"null");if(stored&&typeof stored==="object")state=Object.assign(defaults(),stored);}catch(e){}
for(const key of ["tasks","projects","journal","chat","opportunities"]){if(!Array.isArray(state[key]))state[key]=[];}
if(!state.incomeSettings||typeof state.incomeSettings!=="object")state.incomeSettings={goal:1000,weeklyMinutes:120};
let client=null,session=null;
const cfg=window.NORTE_CONFIG||{};
const ready=/^https:\/\/[^/]+\.supabase\.co\/?$/.test(String(cfg.supabaseUrl||""))&&/^(sb_publishable_|eyJ)/.test(String(cfg.supabasePublishableKey||""));
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stamp=v=>new Date(v).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
const newId=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){toast("O armazenamento local está indisponível.");}}
let toastTimer;function toast(msg){const el=$("toast");el.textContent=msg;el.style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display="none",3200);}
function go(tab){for(const section of document.querySelectorAll(".page"))section.hidden=section.id!=="page-"+tab;for(const btn of document.querySelectorAll("[data-tab]")){const active=btn.dataset.tab===tab;btn.classList.toggle("active",active);if(active)btn.setAttribute("aria-current","page");else btn.removeAttribute("aria-current");}window.scrollTo({top:0,behavior:"instant"});}
for(const btn of document.querySelectorAll("[data-tab]"))btn.addEventListener("click",()=>go(btn.dataset.tab));
for(const btn of document.querySelectorAll("[data-go]"))btn.addEventListener("click",()=>go(btn.dataset.go));
function renderHome(){
 for(const b of $("energy-buttons").querySelectorAll("button"))b.classList.toggle("selected",Number(b.dataset.energy)===state.energy);
 const suggestions=[
 ["Um passo de cada vez.","Selecione sua energia para adaptar o planejamento à sua realidade."],
 ["Descansar também é avançar.","Hoje, escolha apenas uma tarefa essencial de até cinco minutos — ou faça uma pausa consciente."],
 ["Mantenha o plano leve.","Defina uma prioridade pequena e deixe o restante para outro momento."],
 ["Busque constância, não perfeição.","Uma tarefa importante e uma pausa podem ser suficientes."],
 ["Aproveite o ritmo com equilíbrio.","Dedique 25 minutos a uma prioridade e revise seu progresso."],
 ["Há espaço para construir.","Avance em um objetivo de maior impacto, mas preserve pausas."]
 ];
 const s=suggestions[Math.max(0,Math.min(5,state.energy))];$("daily-title").textContent=s[0];$("daily-text").textContent=s[1];
 const done=state.tasks.filter(t=>t.done).length;$("done-count").textContent=done;$("project-count").textContent=state.projects.length;
 const t=state.tasks.find(x=>!x.done);
 $("today-priority").className=t?"card item":"empty";
 $("today-priority").innerHTML=t?'<button class="check" data-toggle="'+escape(t.id)+'" aria-label="Concluir tarefa">✓</button><div class="body"><strong>'+escape(t.title)+'</strong><small>'+escape(t.category)+'</small></div>':"Nenhuma tarefa pendente. Que tal definir um passo simples?";
}
for(const btn of document.querySelectorAll("[data-energy]"))btn.addEventListener("click",()=>{state.energy=Number(btn.dataset.energy);persist();renderHome();toast("Ritmo atualizado.");});
function renderTasks(){
 $("task-list").innerHTML=state.tasks.length?state.tasks.map(t=>'<div class="card item '+(t.done?"done":"")+'"><button class="check" data-toggle="'+escape(t.id)+'" aria-label="'+(t.done?"Reabrir":"Concluir")+' tarefa">'+(t.done?"✓":"")+'</button><div class="body"><strong>'+escape(t.title)+'</strong><small>'+escape(t.category)+'</small></div><button class="delete" data-del-task="'+escape(t.id)+'" aria-label="Excluir tarefa">×</button></div>').join(""):'<div class="empty">Suas tarefas aparecerão aqui.</div>';
 $("project-list").innerHTML=state.projects.length?state.projects.map(p=>'<div class="card item"><span aria-hidden="true" style="font-size:20px;color:#c4ed8b">✳</span><div class="body"><strong>'+escape(p.title)+'</strong><small>'+(p.next?"Próximo passo: "+escape(p.next):"Escolha um próximo passo quando estiver pronta.")+'</small></div><button class="delete" data-del-project="'+escape(p.id)+'" aria-label="Excluir projeto">×</button></div>').join(""):'<div class="empty">Seus projetos e objetivos aparecerão aqui.</div>';
}
$("task-form").addEventListener("submit",e=>{e.preventDefault();const input=$("task-name");const v=input.value.trim();if(!v)return;state.tasks.unshift({id:newId(),title:v,category:$("task-category").value,done:false});input.value="";persist();renderAll();toast("Tarefa adicionada.");});
$("project-form").addEventListener("submit",e=>{e.preventDefault();const input=$("project-name");const v=input.value.trim();if(!v)return;state.projects.unshift({id:newId(),title:v,next:$("project-next").value.trim()});input.value="";$("project-next").value="";persist();renderAll();toast("Projeto criado.");});

/* Renda Extra — registros locais, sem IA paga e sem transmissão de dados de clientes. */
const INCOME_STAGES=[["Mapeado","Mapeado — ainda sem contato"],["Contato","Primeiro contato"],["Proposta","Proposta enviada"],["Fechado","Serviço fechado"],["Entregue","Serviço entregue"],["Recebido","Pagamento recebido"],["Perdido","Não avançou"]];
const INCOME_SERVICES=["Consultoria em atendimento","Escrita freelancer","Viagens esportivas","Outro serviço"];

const INCOME_PROSPECTS=[
 {key:"edy-oliveira",name:"Edy Oliveira Salon Studio",sector:"Beleza e estética",location:"Vila Progresso · Guarulhos",phone:"(11) 98816-9944",website:"https://studioedyoliveira.com.br/",focus:"Recepção, agendamentos e pós-atendimento",next:"Verificar canal profissional e apresentar diagnóstico de experiência do cliente"},
 {key:"espaco-nilda",name:"Espaço Nilda Ribeiro",sector:"Beleza e estética",location:"Santana · São Paulo",phone:"(11) 2950-4707",website:"",focus:"Experiência no agendamento e acolhimento",next:"Identificar responsável e sondar interesse em diagnóstico de atendimento"},
 {key:"morelle-concept",name:"Morelle Concept",sector:"Lojas e comércio",location:"Centro · Guarulhos",phone:"(11) 91303-8344",website:"",focus:"Atendimento consultivo e acompanhamento pós-venda",next:"Identificar canal de contato comercial e apresentar proposta para atendimento no varejo"},
 {key:"tres-chic",name:"Très Chic Accessoires",sector:"Lojas e comércio",location:"Santana · São Paulo",phone:"(11) 4305-8600",website:"https://www.treschicc.com.br/contato",focus:"Experiência integrada na loja e canais digitais",next:"Pesquisar contato comercial e enviar abordagem sobre atendimento omnicanal"},
 {key:"guaru-inn",name:"Guaru Inn Hostel",sector:"Hospedagens",location:"Vila Barros · Guarulhos",phone:"(11) 93724-8960",website:"https://guaruinn.com.br/",focus:"Mensagens de pré-chegada e reservas diretas",next:"Identificar responsável e apresentar diagnóstico de comunicação da jornada do hóspede"},
 {key:"casa-dos-gattos",name:"Pousada Casa dos Gattos",sector:"Hospedagens",location:"Jardim Barbosa · Guarulhos",phone:"(11) 95651-5586",website:"",focus:"Informações pré-estadia e acolhimento de hóspedes",next:"Pesquisar contato de gestão e apresentar diagnóstico de experiência da hospedagem"}
];
function incomeImportSelected(keys){
 let added=0;
 const existing=new Set(state.opportunities.map(o=>String(o.prospectKey||"").trim()).filter(Boolean));
 const existingNames=new Set(state.opportunities.map(o=>String(o.client||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()));
 for(const p of INCOME_PROSPECTS){
   if(!keys.includes(p.key)||existing.has(p.key)||existingNames.has(p.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()))continue;
   state.opportunities.push({id:newId(),prospectKey:p.key,createdAt:Date.now(),service:"Consultoria em atendimento",
     client:p.name,title:"Diagnóstico Express de Atendimento",value:0,stage:"Mapeado",
     next:p.next,date:"",minutes:10,sourceUrl:p.website,updatedAt:Date.now()});
   added++;
 }
 if(added){persist();renderIncome();}
 $("income-prospect-status").textContent=added?added+" oportunidade(s) adicionada(s) como Mapeado, sem valores em negociação.": "Os negócios selecionados já estão cadastrados. Nenhum duplicado foi criado.";
 toast(added?added+" contato(s) mapeado(s).":"Contatos já mapeados.");
}
function renderIncomeProspects(){
 const present=new Set(state.opportunities.map(o=>String(o.prospectKey||"")));
 const existingNames=new Set(state.opportunities.map(o=>String(o.client||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()));
 const exists=p=>present.has(p.key)||existingNames.has(p.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase());
 const groups=["Beleza e estética","Lojas e comércio","Hospedagens"];
 $("income-prospect-list").innerHTML=groups.map(g=>{
  const items=INCOME_PROSPECTS.filter(p=>p.sector===g);
  return '<div class="income-prospect-group"><h3>'+escape(g)+'</h3>'+
    items.map(p=>{
      const isAdded=exists(p);
      return '<div class="income-prospect"><div class="income-prospect-copy"><strong>'+escape(p.name)+'</strong>'+
        '<small>'+escape(p.location)+' · '+escape(p.phone)+'</small><p>'+escape(p.focus)+'</p>'+
        (p.website?'<a href="'+escape(p.website)+'" rel="noopener noreferrer" target="_blank">Canal público</a>':'')+
        '</div><button type="button" class="secondary" data-income-prospect="'+escape(p.key)+'" '+(isAdded?'disabled':'')+'>'+ (isAdded?"No funil":"Adicionar")+'</button></div>';
    }).join("")+
  '</div>';
 }).join("");
 $("income-import-prospects").disabled=INCOME_PROSPECTS.every(exists);
}
$("income-import-prospects").addEventListener("click",()=>incomeImportSelected(INCOME_PROSPECTS.map(p=>p.key)));
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-income-prospect]");
 if(!b)return;
 incomeImportSelected([b.dataset.incomeProspect]);
});

const INCOME_TEMPLATES={
 consultoria:"Olá! Tudo bem? Trabalho com atendimento ao cliente e hotelaria e estou oferecendo um diagnóstico prático de atendimento para pequenos negócios. A ideia é identificar oportunidades de melhoria na experiência do cliente e sugerir ações simples para a equipe. Você teria interesse em conhecer a proposta? Posso enviar um resumo sem compromisso.",
 escrita:"Olá! Tudo bem? Trabalho com produção e revisão de textos profissionais, como apresentações, descrições de serviços e conteúdos institucionais. Posso ajudar seu negócio a comunicar suas ideias com clareza. Se fizer sentido, posso enviar uma proposta com escopo e prazo.",
 viagem:"Olá! Tudo bem? Estou estruturando experiências e roteiros de viagens esportivas, especialmente para quem deseja acompanhar eventos e competições. Gostaria de ouvir suas preferências para validar a proposta. Posso fazer duas perguntas rápidas?"
};
const incomeMoney=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number.isFinite(Number(v))?Number(v):0);
const incomeValue=v=>Math.max(0,Math.min(1000000,Number(v)||0));
const incomeStage=v=>INCOME_STAGES.some(x=>x[0]===v)?v:"Contato";
const incomeStageLabel=v=>INCOME_STAGES.find(x=>x[0]===v)?.[1]||"Primeiro contato";
const incomeDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""))?String(v).split("-").reverse().join("/"):"";
let editingIncomeId=null;
function incomeResetForm(){
 editingIncomeId=null;
 $("income-form").reset();
 $("income-minutes").value="25";
 $("income-form-title").textContent="Nova oportunidade";
 $("income-save").textContent="Salvar oportunidade";
 $("income-cancel").hidden=true;
}
function renderIncomeMessage(){
 $("income-message").value=INCOME_TEMPLATES[$("income-template").value]||INCOME_TEMPLATES.consultoria;
}
function renderIncome(){
 const os=state.opportunities;
 const received=os.filter(o=>o.stage==="Recebido").reduce((sum,o)=>sum+incomeValue(o.value),0);
 const pending=os.filter(o=>["Fechado","Entregue"].includes(o.stage)).reduce((sum,o)=>sum+incomeValue(o.value),0);
 const potential=os.filter(o=>["Contato","Proposta"].includes(incomeStage(o.stage))).reduce((sum,o)=>sum+incomeValue(o.value),0);
 $("income-received").textContent=incomeMoney(received);
 $("income-pending").textContent=incomeMoney(pending);
 $("income-potential").textContent=incomeMoney(potential);
 const goal=incomeValue(state.incomeSettings.goal);
 const minutes=Math.max(30,Math.min(2400,Number(state.incomeSettings.weeklyMinutes)||120));
 const percentage=goal>0?Math.min(100,Math.round(received/goal*100)):0;
 $("income-goal").value=goal;
 $("income-hours").value=minutes/60;
 $("income-progress-fill").style.width=percentage+"%";
 $("income-progress").setAttribute("aria-valuenow",String(percentage));
 $("income-progress-label").textContent=incomeMoney(received)+" recebidos de "+incomeMoney(goal)+" da meta ("+percentage+"%).";
 const active=os.filter(o=>!["Recebido","Perdido"].includes(o.stage));
 const planned=active.reduce((sum,o)=>sum+Math.max(0,Math.min(1200,Number(o.minutes)||0)),0);
 const hrs=(minutes/60).toLocaleString("pt-BR",{maximumFractionDigits:1});
 $("income-time-info").textContent="Disponível: "+hrs+" h/semana · "+planned+" min estimados nas ações abertas (não são horas trabalhadas).";
 const priority=active.slice().sort((a,b)=>{
   if(a.stage==="Mapeado" && b.stage!=="Mapeado")return 1;
   if(b.stage==="Mapeado" && a.stage!=="Mapeado")return -1;
   const da=/^\d{4}-\d{2}-\d{2}$/.test(a.date||"")?a.date:"9999-12-31";
   const db=/^\d{4}-\d{2}-\d{2}$/.test(b.date||"")?b.date:"9999-12-31";
   return da.localeCompare(db);
 })[0];
 if(!priority){
   $("income-action-title").textContent="Comece com uma oportunidade.";
   $("income-action-text").textContent="Cadastre um possível cliente de consultoria, escrita ou viagens esportivas. Seu primeiro passo pode ser preparar uma mensagem de apresentação de 10 minutos.";
 }else{
   $("income-action-title").textContent="Próximo contato: "+String(priority.client||"cliente");
   const step=String(priority.next||"definir uma ação simples para avançar");
   const due=incomeDate(priority.date)?" · até "+incomeDate(priority.date):"";
   const scaled=state.energy>0&&state.energy<=2?"Se sua energia está baixa, faça só 5–10 minutos. ":"";
   $("income-action-text").textContent=scaled+step+due+". Tempo estimado: "+Math.max(5,Number(priority.minutes)||25)+" min. Você pode ajustar a prioridade editando a oportunidade.";
 }
 const filter=$("income-filter").value;
 const visible=os.filter(o=>filter==="Todas"||incomeStage(o.stage)===filter);
 $("income-list").innerHTML=visible.length?visible.map(o=>{
   const stage=incomeStage(o.stage);
   const service=INCOME_SERVICES.includes(o.service)?o.service:"Outro serviço";
   const optionHtml=INCOME_STAGES.map(([value,label])=>'<option value="'+value+'"'+(stage===value?' selected':'')+'>'+label+'</option>').join("");
   return '<article class="card income-item">'+
      '<div class="income-item-head"><div><strong>'+escape(o.client||"Contato")+'</strong><small>'+escape(service)+'</small></div><strong class="income-item-value">'+incomeMoney(incomeValue(o.value))+'</strong></div>'+
      '<p class="income-offer">'+escape(o.title||"Serviço")+'</p>'+
      '<label class="income-stage-label">Etapa<select data-income-stage="'+escape(o.id)+'" aria-label="Etapa de '+escape(o.client||"contato")+'">'+optionHtml+'</select></label>'+
      '<p class="income-next"><b>Próximo passo:</b> '+escape(o.next||"A definir")+(incomeDate(o.date)?" · "+incomeDate(o.date):"")+' · '+Math.max(5,Number(o.minutes)||25)+' min</p>'+
      '<div class="income-actions"><button type="button" class="secondary" data-income-edit="'+escape(o.id)+'">Editar</button><button type="button" class="secondary" data-income-delete="'+escape(o.id)+'">Excluir</button></div>'+
      '</article>';
 }).join(""):'<div class="empty">Nenhuma oportunidade neste filtro. Cadastre seu primeiro contato acima para começar.</div>';
 renderIncomeMessage();
 renderIncomeProspects();
}
$("income-settings-form").addEventListener("submit",e=>{
 e.preventDefault();
 const goal=Number($("income-goal").value),hours=Number($("income-hours").value);
 if(!Number.isFinite(goal)||goal<0||goal>1000000||!Number.isFinite(hours)||hours<.5||hours>40){toast("Confira a meta e o tempo semanal.");return;}
 state.incomeSettings={goal:Math.round(goal*100)/100,weeklyMinutes:Math.round(hours*60)};
 persist();renderIncome();toast("Meta e tempo atualizados.");
});
$("income-form").addEventListener("submit",e=>{
 e.preventDefault();
 const client=$("income-client").value.trim(),title=$("income-title").value.trim();
 const value=Number($("income-value").value),minutes=Number($("income-minutes").value);
 if(!client||!title||!Number.isFinite(value)||value<0||value>1000000||!Number.isFinite(minutes)||minutes<5||minutes>1200){toast("Preencha cliente, serviço, valor e tempo corretamente.");return;}
 const values={
   service:INCOME_SERVICES.includes($("income-service").value)?$("income-service").value:"Outro serviço",
   client,title,value:Math.round(value*100)/100,stage:incomeStage($("income-stage").value),
   next:$("income-next").value.trim(),date:$("income-date").value,
   minutes:Math.round(minutes),updatedAt:Date.now()
 };
 const existing=state.opportunities.find(o=>o.id===editingIncomeId);
 if(existing)Object.assign(existing,values);
 else state.opportunities.unshift({id:newId(),createdAt:Date.now(),...values});
 incomeResetForm();persist();renderIncome();toast(existing?"Oportunidade atualizada.":"Oportunidade cadastrada.");
});
$("income-cancel").addEventListener("click",()=>{incomeResetForm();toast("Edição cancelada.");});
$("income-filter").addEventListener("change",renderIncome);
$("income-template").addEventListener("change",renderIncomeMessage);
$("income-copy").addEventListener("click",async()=>{
 const el=$("income-message");
 try{
   if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(el.value);toast("Mensagem copiada. Personalize antes de enviar.");return;}
 }catch(e){}
 el.focus();el.select();toast("Mensagem selecionada. Use Copiar no menu do celular.");
});
document.addEventListener("change",e=>{
 const select=e.target.closest("[data-income-stage]");
 if(!select)return;
 const o=state.opportunities.find(x=>x.id===select.dataset.incomeStage);
 if(!o)return;
 o.stage=incomeStage(select.value);o.updatedAt=Date.now();
 persist();renderIncome();toast("Etapa atualizada.");
});
document.addEventListener("click",e=>{
 const button=e.target.closest("[data-income-edit],[data-income-delete]");
 if(!button)return;
 const id=button.dataset.incomeEdit||button.dataset.incomeDelete;
 const o=state.opportunities.find(x=>x.id===id);
 if(!o)return;
 if(button.dataset.incomeDelete){
   if(!confirm("Excluir esta oportunidade? Isso não pode ser desfeito."))return;
   state.opportunities=state.opportunities.filter(x=>x.id!==id);
   if(editingIncomeId===id)incomeResetForm();
   persist();renderIncome();toast("Oportunidade excluída.");
   return;
 }
 editingIncomeId=id;
 $("income-service").value=INCOME_SERVICES.includes(o.service)?o.service:"Outro serviço";
 $("income-client").value=o.client||"";
 $("income-title").value=o.title||"";
 $("income-value").value=incomeValue(o.value);
 $("income-stage").value=incomeStage(o.stage);
 $("income-next").value=o.next||"";
 $("income-date").value=o.date||"";
 $("income-minutes").value=Math.max(5,Math.min(1200,Number(o.minutes)||25));
 $("income-form-title").textContent="Editar oportunidade";
 $("income-save").textContent="Salvar alterações";
 $("income-cancel").hidden=false;
 $("income-form").scrollIntoView({behavior:"smooth",block:"start"});
 $("income-client").focus({preventScroll:true});
});

function renderJournal(){
 $("journal-list").innerHTML=state.journal.length?state.journal.map(j=>'<div class="card item"><div class="body"><small>'+stamp(j.date)+'</small><p class="journal-text">'+escape(j.text)+'</p></div><button class="delete" data-del-journal="'+escape(j.id)+'" aria-label="Excluir reflexão">×</button></div>').join(""):'<div class="empty">Seu diário começa com uma reflexão.</div>';
}
$("journal-form").addEventListener("submit",e=>{e.preventDefault();const input=$("journal-text");const v=input.value.trim();if(!v)return;state.journal.unshift({id:newId(),date:Date.now(),text:v});input.value="";persist();renderJournal();toast("Reflexão registrada.");});
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-toggle],[data-del-task],[data-del-project],[data-del-journal]");if(!b)return;
 if(b.dataset.toggle){const t=state.tasks.find(x=>x.id===b.dataset.toggle);if(t)t.done=!t.done;}
 if(b.dataset.delTask&&confirm("Excluir esta tarefa?"))state.tasks=state.tasks.filter(x=>x.id!==b.dataset.delTask);
 if(b.dataset.delProject&&confirm("Excluir este projeto?"))state.projects=state.projects.filter(x=>x.id!==b.dataset.delProject);
 if(b.dataset.delJournal&&confirm("Excluir esta reflexão?"))state.journal=state.journal.filter(x=>x.id!==b.dataset.delJournal);
 persist();renderAll();
});
function renderChat(){
 const el=$("chat-list");
 el.innerHTML=state.chat.map(m=>'<div class="message '+(m.role==="user"?"user":"assistant")+'"><small>'+(m.role==="user"?"Você":"PRUMO")+'</small>'+escape(m.content)+'</div>').join("");
 el.scrollTop=el.scrollHeight;
}
function guided(text){
 const q=text.toLowerCase();
 if(/sobrecarreg|cansad|esgotad|sem energia|exaust/.test(q))return "Entendi. Quando tudo parece urgente, podemos reduzir o tamanho do plano.\n\nEscolha apenas uma tarefa essencial que caiba em cinco ou dez minutos. Se hoje não houver energia, descansar também pode ser uma decisão legítima.\n\nO que está consumindo mais sua energia agora?";
 if(/atrasad|autocobran|compar|fracass/.test(q))return "Essa sensação pode tornar cada meta uma cobrança. Em vez de medir sua vida por um calendário ideal, vamos observar o que está ao seu alcance agora.\n\nQual expectativa você está exigindo de si mesma — e ela é realista para sua rotina atual?";
 if(/trabalho|carreira|lider|hotel|profiss/.test(q))return "Podemos trabalhar sua evolução profissional de forma prática.\n\nPense em três pontos: a função que deseja alcançar, uma competência que precisa desenvolver e uma ação pequena nesta semana.\n\nQue mudança profissional faria mais diferença para você?";
 if(/projet|ideia|consultoria|negócio|renda|freelanc/.test(q))return "Vamos dar direção aos seus projetos sem criar novas cobranças.\n\nEscolha um projeto para receber atenção nesta semana, defina uma entrega simples e reserve um período curto para ela.\n\nQual projeto tem mais impacto ou urgência hoje?";
 if(/planej|rotina|prioridade|tempo|organiza|tarefa/.test(q))return "Podemos começar com uma estrutura leve: uma prioridade essencial, uma tarefa opcional e um espaço de descanso.\n\nAbra a aba Planos e registre o próximo passo mais simples. O que você precisa resolver primeiro?";
 return "Obrigada por compartilhar. Quero te ajudar a olhar para isso com cuidado, sem impor uma resposta pronta.\n\nO que você mais gostaria de compreender ou decidir sobre essa situação? Podemos transformar essa reflexão em um passo concreto.";
}
async function explainAIError(error){
 const status=Number(error?.context?.status||0);
 let code="";
 try{
   const body=await error?.context?.clone?.().json?.();
   const safe=String(body?.error||body?.code||"");
   if(["Conta não autorizada.","Chave OpenAI não configurada.","Chave OpenAI ainda não configurada.","Histórico inválido.","Falha na API da IA.","Falha ao consultar a IA.","Resposta vazia.","Acesso privado não configurado."].includes(safe))code=safe;
 }catch(e){}
 if(status===401)return "Erro 401: o token de login foi rejeitado. Saia e entre novamente em Ajustes. Se continuar, confira a configuração de autenticação da função no Supabase.";
 if(status===403)return "Erro 403: a conta conectada não corresponde ao identificador permitido. Confira NORTE_ALLOWED_USER_ID no Supabase (deve ser o UID do usuário de Authentication → Users).";
 if(status===404)return "Erro 404: a função norte-mentor não foi encontrada no projeto Supabase. Verifique o nome e a implantação.";
 if(status===429)return "Erro 429: limite temporário de uso. Verifique os limites do Supabase e da OpenAI.";
 if(status===500)return "Erro 500: erro interno da função. Abra Supabase → Edge Functions → norte-mentor → Logs.";
 if(status===502)return "Erro 502: o servidor não conseguiu obter resposta da OpenAI. Verifique crédito da API, modelo, segredo OPENAI_API_KEY e Logs da função.";
 if(status===503)return "Erro 503: falta alguma configuração no servidor. "+(code||"Confira os Secrets da função no Supabase.");
 if(status===400)return "Erro 400: requisição de mentoria inválida. Confira a versão da função implantada.";
 if(status)return "Erro HTTP "+status+". Confira Supabase → Edge Functions → norte-mentor → Invocations e Logs.";
 return "A chamada não chegou corretamente ao Supabase (possível rede, CORS ou falha de conexão). Verifique a internet e os registros da função.";
}
async function send(text){
 if(!text.trim())return;
 state.chat.push({role:"user",content:text.trim()});persist();renderChat();
 const input=$("chat-input");const submit=$("chat-form").querySelector('button[type="submit"]');submit.disabled=true;
 let response;
 try{
   if(client&&session){
     const history=state.chat.slice(-15).map(m=>({role:m.role,content:m.content}));
     const context={energy:state.energy,tasks:state.tasks.slice(0,15).map(t=>({title:t.title,done:t.done,category:t.category})),projects:state.projects.slice(0,10).map(p=>({title:p.title,next:p.next}))};
     const {data,error}=await client.functions.invoke("norte-mentor",{body:{history,context}});
     if(error)throw new Error(await explainAIError(error));
     if(typeof data?.reply!=="string"||!data.reply.trim())throw new Error("O servidor respondeu, mas não enviou texto. Confira os Logs.");
     response=data.reply;
   }else if(ready&&!session)response="Ainda não está conectada à IA. Abra Ajustes, entre com o e-mail e a senha do usuário do Supabase e tente novamente.";
   else response=guided(text);
 }catch(e){response="Não foi possível conectar à IA generativa.\n\n"+String(e?.message||"Erro desconhecido.")+"\n\nSe preferir, pode continuar usando o planejamento e o diário.";toast("Verifique o diagnóstico na conversa.");}
 state.chat.push({role:"assistant",content:response});persist();renderChat();submit.disabled=false;input.focus();
}
$("chat-form").addEventListener("submit",e=>{e.preventDefault();const field=$("chat-input");const v=field.value.trim();if(!v)return;field.value="";send(v);});
for(const button of document.querySelectorAll("[data-prompt]"))button.addEventListener("click",()=>send(button.dataset.prompt));
$("chat-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chat-form").requestSubmit();}});
$("export-btn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),data:state,consultChecklist:(()=>{try{return JSON.parse(localStorage.getItem("prumo-consultoria-v1")||"[]")}catch(e){return []}})(),consultCalendar:(()=>{try{return JSON.parse(localStorage.getItem("prumo-consult-calendar-v1")||"null")}catch(e){return null}})()},null,2)],{type:"application/json"});const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download="prumo-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast("Backup exportado.");});
$("import-btn").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const raw=JSON.parse(await file.text());const d=raw.data||raw;if(!Array.isArray(d.tasks)||!Array.isArray(d.projects)||!Array.isArray(d.journal)||!Array.isArray(d.chat))throw Error();if(!confirm("Substituir seus dados locais pelo backup?"))return;state={energy:Number(d.energy)||0,tasks:d.tasks,projects:d.projects,journal:d.journal,chat:d.chat,opportunities:Array.isArray(d.opportunities)?d.opportunities:[],incomeSettings:d.incomeSettings&&typeof d.incomeSettings==="object"?d.incomeSettings:{goal:1000,weeklyMinutes:120}};incomeResetForm();persist();if(Array.isArray(raw.consultChecklist))localStorage.setItem("prumo-consultoria-v1",JSON.stringify(raw.consultChecklist));if(raw.consultCalendar&&typeof raw.consultCalendar==="object"&&typeof raw.consultCalendar.start==="string")localStorage.setItem("prumo-consult-calendar-v1",JSON.stringify(raw.consultCalendar));window.dispatchEvent(new Event("prumo:calendar-restored"));renderAll();toast("Dados restaurados.");}catch(e){toast("Backup inválido.");}finally{e.target.value="";}});
$("clear-chat").addEventListener("click",()=>{if(!confirm("Apagar o histórico de conversa deste navegador?"))return;state.chat=[{role:"assistant",content:greet}];persist();renderChat();toast("Conversa apagada.");});
$("clear-data").addEventListener("click",()=>{if(!confirm("Apagar permanentemente todos os dados locais do PRUMO neste navegador?"))return;state=defaults();persist();localStorage.removeItem("prumo-consultoria-v1");localStorage.removeItem("prumo-consult-calendar-v1");window.dispatchEvent(new Event("prumo:calendar-restored"));renderAll();toast("Dados locais apagados.");});
function setAuthText(text){$("login-message").textContent=text;}
let recoveringPassword=false;
// O link pode abrir uma PWA na página inicial; detectamos a intenção sem registrar tokens.
const recoveryFromLink = new URLSearchParams(location.hash.slice(1)).get("type")==="recovery" || new URLSearchParams(location.search).get("type")==="recovery";
function updateAuthUI(){
 if(!ready){$("api-status").textContent="Modo guiado. Para ativar IA, configure o Supabase em config.js e publique uma função norte-mentor segura.";return;}
 $("login-panel").hidden=false;
 $("login-controls").hidden=recoveringPassword;
 $("set-password-btn").hidden=!session;
 $("login-password-field").hidden=recoveringPassword;
 $("password-reset-panel").hidden=!recoveringPassword;
 $("api-status").textContent=recoveringPassword?"Recuperação de senha: defina sua nova senha.":session?"Conta conectada ao PRUMO. Faça um teste na aba Mentoria.":"Supabase configurado. Entre com sua conta autorizada para ativar IA.";
 $("ai-mode").textContent=session&&!recoveringPassword?"● Conta conectada — teste a mentoria para verificar a IA generativa.":"● Modo guiado — entre em Ajustes para conectar sua conta.";
}
async function initCloud(){
 if(!ready){updateAuthUI();return;}
 try{
   const m=await import("https://esm.sh/@supabase/supabase-js@2.95.0?bundle");
   client=m.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   client.auth.onAuthStateChange((event,s)=>{
     session=s;
     if(event==="PASSWORD_RECOVERY"){
       recoveringPassword=true;
       go("ajustes");
       setAuthText("Link confirmado. Defina sua nova senha abaixo.");
     }
     updateAuthUI();
   });
   const r=await client.auth.getSession();
   session=r.data.session;
   if(recoveryFromLink && session){
     recoveringPassword=true;
     go("ajustes");
     setAuthText("Link recebido. Defina uma senha nova para sua conta.");
   }
   updateAuthUI();
 }catch(e){
   $("api-status").textContent="Não foi possível carregar o Supabase. Verifique a configuração e a internet.";
   setAuthText("O modo guiado permanece disponível.");
 }
}
$("login-btn").addEventListener("click",async()=>{
 if(!client)return setAuthText("Configure o Supabase primeiro.");
 const email=$("user-email").value.trim(),password=$("user-password").value;
 if(!email||!password)return setAuthText("Preencha e-mail e senha.");
 setAuthText("Conectando...");
 const {error}=await client.auth.signInWithPassword({email,password});
 $("user-password").value="";
 setAuthText(error?"Não foi possível entrar. Confira suas credenciais.":"Login concluído. Abra Mentoria para testar.");
});
$("forgot-password-btn").addEventListener("click",async()=>{
 if(!client)return setAuthText("O Supabase ainda não está configurado.");
 const email=$("user-email").value.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setAuthText("Digite seu e-mail cadastrado no campo E-mail de acesso.");
 $("forgot-password-btn").disabled=true;
 setAuthText("Solicitando e-mail de recuperação...");
 try{
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:"https://francareisleal.github.io/norte-ai/recovery.html"});
   if(error)throw error;
   setAuthText("Se este e-mail estiver cadastrado e permitido no Supabase, você receberá um link para redefinir a senha. Confira também a pasta Spam.");
 }catch(e){
   const code=String(e?.code||"");
   const status=Number(e?.status||0);
   if(status===429||/rate_limit|too_many_requests/i.test(code)){
     setAuthText("O Supabase atingiu um limite temporário de e-mails. Aguarde cerca de uma hora desde o último envio e tente uma única vez.");
   }else if(code==="email_address_not_authorized"){
     setAuthText("O serviço de e-mail do Supabase não está autorizado a enviar para este endereço. Confira as configurações de envio no Supabase.");
   }else{
     setAuthText("Não foi possível solicitar a recuperação (código: "+(code||String(status||"desconhecido"))+"). Confira o Supabase e tente novamente mais tarde.");
   }
 }finally{
   $("forgot-password-btn").disabled=false;
 }
});
$("set-password-btn").addEventListener("click",()=>{
 if(!session)return setAuthText("Você precisa abrir o link de recuperação novamente para entrar.");
 recoveringPassword=true;
 go("ajustes");
 updateAuthUI();
 setAuthText("Defina uma senha nova com pelo menos 12 caracteres.");
});
$("change-password-btn").addEventListener("click",async()=>{
 if(!client||!session)return setAuthText("Link expirado. Solicite um novo e-mail de recuperação.");
 const password=$("new-password").value,confirm=$("confirm-password").value;
 if(password.length<12)return setAuthText("Use uma senha de pelo menos 12 caracteres.");
 if(password!==confirm)return setAuthText("As senhas não coincidem.");
 $("change-password-btn").disabled=true;
 setAuthText("Salvando nova senha...");
 try{
   const {error}=await client.auth.updateUser({password});
   if(error)throw error;
   $("new-password").value="";
   $("confirm-password").value="";
   recoveringPassword=false;
   updateAuthUI();
   setAuthText("Senha atualizada! Sua conta está conectada. Você pode acessar a Mentoria.");
 }catch(e){setAuthText("Não foi possível alterar a senha. Tente solicitar um novo link.");}
 finally{$("change-password-btn").disabled=false;}
});
$("cancel-password-btn").addEventListener("click",()=>{
 recoveringPassword=false;
 $("new-password").value="";
 $("confirm-password").value="";
 updateAuthUI();
 setAuthText("Recuperação cancelada.");
});
$("logout-btn").addEventListener("click",async()=>{
 if(client)await client.auth.signOut();
 session=null;
 recoveringPassword=false;
 setAuthText("Você saiu da conta.");
 updateAuthUI();
});
function renderAll(){renderHome();renderTasks();renderJournal();renderChat();renderIncome();}
renderAll();initCloud();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
})();