# Configurar a integração do PRUMO com Supabase e OpenAI

Este guia configura o login e a integração opcional com IA do PRUMO. O repositório ainda se chama `norte-ai`, por isso os endereços do site e do GitHub abaixo mantêm esse caminho.

O código preserva identificadores técnicos antigos — `NORTE_CONFIG`, `norte-mentor` e `NORTE_ALLOWED_USER_ID` — para não quebrar a configuração atual. Esses identificadores não alteram a marca exibida, que é PRUMO.

- Site: https://francareisleal.github.io/norte-ai/
- Código da função: https://github.com/francareisleal/norte-ai/blob/main/supabase/functions/norte-mentor/index.ts

A integração com IA só ficará ativa depois de concluir os passos abaixo.

## 1. Criar o acesso privado

No painel do Supabase, abra **Authentication → Users** e crie ou convide a conta que terá acesso. Não compartilhe senhas no GitHub ou no ChatGPT.

Copie o User ID (UUID) dessa conta. Use o UUID no segredo de autorização; não use nome ou e-mail.

## 2. Configurar os secrets

No Supabase, abra **Edge Functions → Secrets** e configure:

- `OPENAI_API_KEY`: chave da API criada em https://platform.openai.com/api-keys
- `NORTE_ALLOWED_USER_ID`: UUID da conta em **Authentication → Users**

Esses valores devem ficar somente no Supabase. Nunca os coloque em `config.js` ou no repositório. Confirme a cobrança da API e configure limites e alertas antes de começar os testes.

## 3. Implantar a Edge Function

No Supabase, abra **Edge Functions → Deploy a new function → Via Editor**.

- Nome da função: `norte-mentor`
- Código-fonte: copie o arquivo indicado no início deste guia.
- Mantenha a validação JWT habilitada (`verify_jwt = true`).

A função exige uma sessão autenticada, confere o UUID autorizado e recusa pedidos sem credenciais. Ela limita o histórico enviado ao modelo, mas ainda não tem limite persistente de quantidade de requisições; é um protótipo para uso individual.

## 4. Copiar os dados públicos do projeto

No Supabase, use **Connect** ou **Settings → API Keys** para localizar:

- **Project URL**, no formato `https://exemplo.supabase.co`
- **Publishable key**, iniciada por `sb_publishable_`

Não copie chaves `secret`, `service_role` ou senhas.

## 5. Configurar o PRUMO

Na branch `main`, edite `config.js` e preencha os valores públicos:

```js
window.NORTE_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublishableKey: "sb_publishable_..."
};
```

Salve as alterações. Depois, abra o PRUMO, vá a **Ajustes**, entre com a conta autorizada e teste a aba **Mentoria**.

## 6. Erros comuns

- **Modo guiado:** falta preencher `config.js` ou entrar na conta.
- **Conta não autorizada:** o UUID de `NORTE_ALLOWED_USER_ID` não corresponde à conta conectada.
- **Chave OpenAI ainda não configurada:** falta adicionar `OPENAI_API_KEY` no Supabase.
- **401:** confira login, token e `verify_jwt`.
- **404:** confirme que a Edge Function foi implantada com o nome `norte-mentor`.
- **CORS:** confira se o código da função foi copiado por completo.
- **429:** confira os limites e a cobrança da API.

## Dados pessoais e limites

Tarefas, diário e conversas ficam no navegador e podem ser perdidos quando os dados locais forem apagados. Quando a integração estiver ativa, o conteúdo da conversa e o contexto enviado à aba Mentoria são encaminhados à OpenAI. A função define `store: false` na chamada à Responses API.

Não registre informações sigilosas de hóspedes ou de terceiros. Teste a instalação e o uso antes de confiar no aplicativo.
