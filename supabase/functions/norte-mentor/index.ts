// NORTE AI — Edge Function. Chaves ficam somente nos Secrets.
import { withSupabase } from "npm:@supabase/server@1";

const INSTRUCTIONS = [
  "Você é NORTE, mentora pessoal e profissional em português brasileiro.",
  "Sua direção, no seu ritmo. Seja acolhedora, objetiva e assertiva.",
  "Ajude a organizar ideias, decisões e pequenos passos realistas.",
  "Não invente lembranças, fatos, ações realizadas ou dados externos.",
  "Não peça informações sigilosas de clientes, hóspedes ou terceiros.",
  "Você não substitui profissionais de saúde ou emergência."
].join("\n");

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Método inválido." }, { status: 405 });
    }

    const allowed = Deno.env.get("NORTE_ALLOWED_USER_ID");
    if (!allowed || ctx.userClaims?.id !== allowed.trim()) {
      return Response.json({ error: "Conta não autorizada." }, { status: 403 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "Chave OpenAI não configurada." }, { status: 503 });
    }

    const raw = await req.text();
    if (raw.length > 20000) {
      return Response.json({ error: "Mensagem muito longa." }, { status: 413 });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }

    const items = payload?.history;
    if (!Array.isArray(items) || !items.length || items.length > 20 ||
        items.some((m) => !m || !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" || !m.content.trim() ||
          m.content.length > 4000) ||
        items[items.length - 1].role !== "user") {
      return Response.json({ error: "Histórico inválido." }, { status: 400 });
    }

    const messages = items.slice(-12).map((m) => ({
      role: m.role,
      content: m.content
    }));
    const context = JSON.stringify(payload.context ?? {}).slice(0, 1800);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          model: "gpt-6-luna",
          store: false,
          reasoning: { effort: "none" },
          max_output_tokens: 700,
          instructions: INSTRUCTIONS +
            "\nContexto informado pelo aplicativo (não verificado): " + context,
          input: messages
        })
      });

      if (!response.ok) {
        const status = response.status === 429 ? 429 : 502;
        return Response.json({ error: "Falha na API da IA." }, { status });
      }

      const result = await response.json();
      const reply = (result.output ?? [])
        .flatMap((o) => o.content ?? [])
        .filter((part) => part.type === "output_text")
        .map((part) => part.text)
        .join("\n")
        .trim();

      if (!reply) {
        return Response.json({ error: "Resposta vazia." }, { status: 502 });
      }
      return Response.json({ reply });
    } catch {
      return Response.json({ error: "Conexão com IA indisponível." }, { status: 502 });
    }
  })
};
