# PRUMO — Web App (PWA)

**Encontre seu caminho, no seu ritmo.**

PRUMO é um protótipo pessoal de mentoria e planejamento em português. Está hospedado no GitHub Pages e ainda não é um chatbot conectado à API da OpenAI.

## Recursos

- Tela Hoje com registro de energia e sugestão adaptativa
- Mentoria guiada por regras, com histórico local
- Tarefas e projetos
- Diário pessoal
- Exportação e importação de backups em JSON
- Estrutura PWA para acesso pelo celular

## Publicação

O repositório ainda usa o identificador técnico `norte-ai`. Para publicar, abra **Settings → Pages**, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**.

URL atual do site:
https://francareisleal.github.io/norte-ai/

## Integração opcional com IA

A interface mantém identificadores técnicos antigos (`NORTE_CONFIG` e a função `norte-mentor`) para preservar a integração existente. Eles não são o nome da marca. Consulte [GUIA_SUPABASE.md](./GUIA_SUPABASE.md) antes de configurar a conexão.

Nunca coloque chaves secretas da OpenAI, `service_role` do Supabase ou senhas no repositório público.

## Privacidade e limites

Os dados pessoais do protótipo ficam no `localStorage` do navegador, sem criptografia própria ou sincronização entre dispositivos. Backups também podem conter informações sensíveis. Não use dados sigilosos ou informações de terceiros sem autorização.

A mentoria local é guiada por regras e não substitui aconselhamento profissional. A integração online requer configuração separada e pode gerar custos de API.

## França Hospitality Consulting

A página comercial é independente e não exibe dados pessoais do PRUMO.

- [Página pública](https://francareisleal.github.io/norte-ai/franca-hospitality.html)
- [Folheto para impressão](https://francareisleal.github.io/norte-ai/franca-hospitality-apresentacao.html)
- Contato: francareisleal@gmail.com

## Cronograma da consultoria no PRUMO

A aba Consultoria inclui um calendário de oito semanas, iniciado por padrão em 16/11/2026, com duas atividades por semana e limite recomendado de duas horas. É possível alterar a data de início, marcar tarefas, adicionar anotações e exportar eventos em formato .ics. O progresso fica salvo no navegador; use os backups em Ajustes.
