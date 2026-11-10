/* NORTE AI — versão web. Sem chaves privadas no navegador. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="norte-ai-local-v1";
const greet="Olá! Sou a NORTE, sua mentora de apoio. Podemos pensar juntas sobre uma decisão, definir uma prioridade ou simplesmente organizar o que está acontecendo. Por onde gostaria de começar?";
const defaults=()=>({energy:0,tasks:[],projects:[],journal:[],chat:[{role:"assistant",content:greet}]});
let state=defaults();
try{const stored=JSON.parse(localStorage.getItem(KEY)||"null");if(stored&&typeof stored==="object")state=Object.assign(defaults(),stored);}catch(e){}
for(const key of ["tasks","projects","journal","chat"]){if(!Array.isArray(state[key]))state[key]=[];}
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
 el.innerHTML=state.chat.map(m=>'<div class="message '+(m.role==="user"?"user":"assistant")+'"><small>'+(m.role==="user"?"Você":"NORTE")+'</small>'+escape(m.content)+'</div>').join("");
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
     if(error){let msg="Falha ao consultar a IA.";try{const body=await error.context?.json?.();if(body?.error)msg=String(body.error);}catch(e){}throw new Error(msg);}
     if(typeof data?.reply!=="string"||!data.reply.trim())throw new Error("A IA não retornou uma resposta.");
     response=data.reply;
   }else response=guided(text);
 }catch(e){response="Não foi possível conectar à IA generativa. Verifique login, função do servidor e sua conexão. Você ainda pode usar a mentoria guiada.";toast("IA online indisponível.");}
 state.chat.push({role:"assistant",content:response});persist();renderChat();submit.disabled=false;input.focus();
}
$("chat-form").addEventListener("submit",e=>{e.preventDefault();const field=$("chat-input");const v=field.value.trim();if(!v)return;field.value="";send(v);});
for(const button of document.querySelectorAll("[data-prompt]"))button.addEventListener("click",()=>send(button.dataset.prompt));
$("chat-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chat-form").requestSubmit();}});
$("export-btn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:state},null,2)],{type:"application/json"});const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download="norte-ai-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast("Backup exportado.");});
$("import-btn").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const raw=JSON.parse(await file.text());const d=raw.data||raw;if(!Array.isArray(d.tasks)||!Array.isArray(d.projects)||!Array.isArray(d.journal)||!Array.isArray(d.chat))throw Error();if(!confirm("Substituir seus dados locais pelo backup?"))return;state={energy:Number(d.energy)||0,tasks:d.tasks,projects:d.projects,journal:d.journal,chat:d.chat};persist();renderAll();toast("Dados restaurados.");}catch(e){toast("Backup inválido.");}finally{e.target.value="";}});
$("clear-chat").addEventListener("click",()=>{if(!confirm("Apagar o histórico de conversa deste navegador?"))return;state.chat=[{role:"assistant",content:greet}];persist();renderChat();toast("Conversa apagada.");});
$("clear-data").addEventListener("click",()=>{if(!confirm("Apagar permanentemente todos os dados locais da NORTE neste navegador?"))return;state=defaults();persist();renderAll();toast("Dados locais apagados.");});
function setAuthText(text){$("login-message").textContent=text;}
let recoveringPassword=false;
function updateAuthUI(){
 if(!ready){$("api-status").textContent="Modo guiado. Para ativar IA, configure o Supabase em config.js e publique uma função norte-mentor segura.";return;}
 $("login-panel").hidden=false;
 $("login-controls").hidden=recoveringPassword;
 $("password-reset-panel").hidden=!recoveringPassword;
 $("api-status").textContent=recoveringPassword?"Recuperação de senha: defina sua nova senha.":session?"Conta conectada à NORTE. Faça um teste na aba Mentoria.":"Supabase configurado. Entre com sua conta autorizada para ativar IA.";
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
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:"https://francareisleal.github.io/norte-ai/"});
   if(error)throw error;
   setAuthText("Se este e-mail estiver cadastrado e permitido no Supabase, você receberá um link para redefinir a senha. Confira também a pasta Spam.");
 }catch(e){
   setAuthText("Não foi possível enviar o e-mail. Confira Authentication → URL Configuration e as configurações de e-mail do Supabase.");
 }finally{
   $("forgot-password-btn").disabled=false;
 }
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
function renderAll(){renderHome();renderTasks();renderJournal();renderChat();}
renderAll();initCloud();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
})();