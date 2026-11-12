# PRUMO — Web App (PWA)

Encontre seu caminho, no seu ritmo.

Protótipo pessoal de mentoria e planejamento em português. Esta implementação está hospedada no GitHub Pages e **não é ainda um chatbot conectado à API OpenAI**.

## Recursos
- Tela Hoje: energia e sugestão adaptativa
- Mentoria guiada por regras, com histórico local
- Tarefas e projetos
- Diário pessoal
- Exportação/importação de backups em JSON
- Estrutura PWA para acesso pelo celular

## Publicação
Abra **Settings → Pages** neste repositório, configure **Deploy from a branch**, branch **main** e pasta **/(root)** e clique em **Save**.

URL esperada após a publicação:
https://francareisleal.github.io/norte-ai/

## Ativar IA generativa futuramente
1. Crie seu projeto no Supabase.
2. Configure autenticação de usuários e uma Edge Function `norte-mentor` com verificação de identidade, limites de uso e segredo OPENAI_API_KEY.
3. Em `config.js`, preencha **somente** a URL do projeto Supabase e a chave publicável.
4. Na aba Ajustes, entre na conta autorizada. A interface envia as chaves `history` e `context` e espera uma resposta com `reply`.

**Nunca coloque** chaves secretas da OpenAI, `service_role` do Supabase ou senhas no repositório público.

## Privacidade
Os dados pessoais do protótipo são armazenados no `localStorage` do navegador e não possuem criptografia própria nem sincronização entre dispositivos. Não utilize dados sigilosos ou informações de terceiros sem autorização. Os arquivos de backup também podem conter informações sensíveis.

## Limitações
A mentoria local é guiada por regras e não substitui aconselhamento profissional. A integração online requer configuração separada, com possíveis custos de API.

## Site comercial — França Hospitality Consulting

- Página pública: https://francareisleal.github.io/norte-ai/franca-hospitality.html
- Folheto para impressão e PDF: https://francareisleal.github.io/norte-ai/franca-hospitality-apresentacao.html
- Contato: francareisleal@gmail.com

A página comercial não exibe dados pessoais do PRUMO. O PRUMO continua disponível na raiz do projeto.
