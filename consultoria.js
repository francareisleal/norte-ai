(()=>{"use strict";
const key="prumo-consultoria-v1";
const offers=[["Orientação Expressa",79,"45 min · 3 recomendações"],["Raio-X do Atendimento",149,"1 canal · checklist breve"],["Mentoria Atendimento que Converte",189,"2 encontros de 35 min · material padrão"],["Treinamento para Pequenas Equipes",290,"Remoto · até 5 participantes · 60 min"],["Diagnóstico de Reservas e Atendimento",490,"Até 2 fluxos · relatório breve · devolutiva"]];
const tasks=["Revisar proposta empresarial: R$ 490, até 2 fluxos","Preparar apresentação comercial resumida","Organizar 10 contatos potenciais no funil","Enviar abordagens personalizadas","Realizar conversas e enviar propostas","Revisar resultados e ajustar a oferta"];
const phases=[["Nov–dez/2026","Estruturação: materiais, prospecção e primeiro cliente"],["Jan–mar/2027","Validação: executar serviços, medir horas e buscar R$ 1.000 por ciclo"],["Abr–jun/2027","Consolidação: estudos de caso autorizados, e-book e revisão de preços"],["Jul–out/2027","Expansão: avaliar pacotes e capacidade operacional"]];
let done=[];try{const v=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(v))done=v.filter(x=>Number.isInteger(x)&&x>=0&&x<tasks.length)}catch{}
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
document.getElementById("consult-offers").innerHTML=offers.map(o=>'<div class="consult-line"><span><strong>'+o[0]+'</strong><small>'+o[2]+'</small></span><b>'+money(o[1])+'</b></div>').join("");
document.getElementById("consult-phases").innerHTML=phases.map(p=>'<div class="consult-line"><span><strong>'+p[0]+'</strong><small>'+p[1]+'</small></span></div>').join("");
function render(){document.getElementById("consult-progress").textContent=Math.round(done.length/tasks.length*100)+"%";document.getElementById("consult-checklist").innerHTML=tasks.map((t,i)=>'<label class="card consult-task"><input type="checkbox" data-consult-task="'+i+'" '+(done.includes(i)?"checked":"")+'><span>'+t+'</span></label>').join("");}
document.getElementById("consult-checklist").addEventListener("change",e=>{const i=Number(e.target.dataset.consultTask);if(!Number.isInteger(i)||i<0||i>=tasks.length)return;done=e.target.checked?[...new Set([...done,i])]:done.filter(n=>n!==i);try{localStorage.setItem(key,JSON.stringify(done))}catch{}render()});
render();
})();