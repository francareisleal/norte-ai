# Conectar a NORTE AI ao Supabase e à OpenAI

O site está em https://francareisleal.github.io/norte-ai/. A interface já suporta login no Supabase e invoca uma função denominada norte-mentor. **Ainda não há IA online até a conclusão dos passos abaixo.**

## 1. Criar o acesso privado
Abra o projeto no Supabase Dashboard > Authentication > Users e crie/convide o seu usuário de acesso (e-mail e senha). Não compartilhe senhas no GitHub ou no ChatGPT.

Copie o User ID (UUID) dessa conta. **Não use seu nome, seu e-mail ou o nome do projeto para o segredo de autorização.**

## 2. Criar os Secrets
No painel Supabase, abra Edge Functions > Secrets.
- OPENAI_API_KEY = chave de API criada em https://platform.openai.com/api-keys
- NORTE_ALLOWED_USER_ID = UUID do seu usuário de Authentication > Users.

Esses valores ficam **somente no Supabase**, nunca no arquivo config.js nem no repositório GitHub.

Confirme cobrança da API OpenAI e configure limites/alertas no projeto antes de começar os testes.

## 3. Implantar a Edge Function
Abra Edge Functions > Deploy a new function > Via Editor.
Nome: norte-mentor

Copie o código-fonte do repositório:
https://github.com/francareisleal/norte-ai/blob/main/supabase/functions/norte-mentor/index.ts

Cole no editor e faça Deploy. Mantenha a validação de JWT habilitada (verify_jwt = true).

A função exige usuário autenticado, confere o ID autorizado e recusa pedidos sem credenciais. Ela limita o histórico enviado ao modelo, mas **não possui ainda limitação persistente de quantidade de requisições**. É um protótipo de uso individual.

## 4. Encontrar os dados públicos
No Supabase Dashboard, use o botão Connect ou Settings > API Keys:
- Project URL: exemplo https://exemplo.supabase.co
- Publishable key: começa com sb_publishable_.

Os dois são valores de configuração para o navegador. Não copie as chaves "secret", "service_role" ou senhas.

## 5. Configurar a NORTE no GitHub
Edite o arquivo config.js na branch main:
window.NORTE_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_..."
};

Salve/Commit changes. Depois, abra o site, abra Ajustes, entre com usuário e senha e teste na aba Mentoria.

## 6. Erros comuns
- "Modo guiado": faltou preencher config.js ou ainda não fez login.
- "Conta não autorizada": o UUID salvo em NORTE_ALLOWED_USER_ID não corresponde ao usuário conectado.
- "Chave OpenAI ainda não configurada": faltou OPENAI_API_KEY no Supabase.
- 401: verifique login, token e verify_jwt.
- 404: a função norte-mentor não está implantada com o nome correto.
- Erro de CORS: verifique se o código da função foi copiado por completo.
- 429: limite de requisições da API de IA, verifique uso/faturamento.

## Limites e dados pessoais
Os diálogos, tarefas e diário ficam armazenados no navegador e podem ser perdidos ao limpar dados do dispositivo. Mensagens e contexto de tarefas/projetos são enviados à OpenAI apenas quando conectado e o usuário envia mensagens na aba Mentoria. A função define store:false na chamada Responses API. Não use informações sigilosas de hóspedes ou terceiros. Evite escrever dados extremamente sensíveis no protótipo.

A instalação e o uso em produção devem ser testados antes de confiar na aplicação.