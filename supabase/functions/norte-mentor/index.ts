// NORTE AI — Supabase Edge Function (código-fonte público, SEM credenciais)
// Nome da função ao implantar no Supabase: norte-mentor
// Secrets obrigatórios: OPENAI_API_KEY e NORTE_ALLOWED_USER_ID
// Importante: verificar JWT ativado (verify_jwt = true).
import { withSupabase } from "npm:@supabase/server@1";

type ChatRole = "user" | "assistant";
type Message = { role: ChatRole; content: string };

const SYSTEM = [
  "Você é NORTE, uma assistente e mentora pessoal e profissional em português brasileiro.",
  "Seu lema é: sua direção, no seu ritmo.",
  "Ajude a pessoa a refletir sobre decisões e executar passos pequenos, realistas e gentis.",
  "Seja acolhedora, objetiva, assertiva e honesta, sem bajulação ou promessas irreais.",
  "Em situações de sobrecarga, proponha prioridades pequenas e espaço para descanso.",
  "Não diga que executou ações, enviou avisos ou consultou dados externos se não o fez.",
  "Não se apresente como profissional de saúde mental. Para riscos imediatos, oriente a procurar apoio emergencial.",
  "Não solicite nem exponha informações confidenciais de hóspedes, contratos ou terceiros.",
  "Use o contexto fornecido só quando relevante e não suponha que foi verificado externamente.",
  "Nunca afirme se lembrar de algo que não foi enviado nesta requisição.",
  "Responda preferencialmente com 2 a 5 parágrafos curtos, podendo fazer uma pergunta ao final."
].join("\n");

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") &&
    typeof v.content === "string" && v.content.trim().length > 0 &&
    v.content.length <= 4000;
}
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function extractText(response: Record<string, unknown>): string {
  if (typeof response.output_text === "string") return response.output_text.trim();
  const out = Array.isArray(response.output) ? response.output : [];
  const parts: string[] = [];
  for (const item of out) {
    if (!isPlainObject(item) || !Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if (isPlainObject(c) && c.type === "output_text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return Response.json({ error: "Método inválido." }, { status: 405 });

    // Primeiro confira se há uma lista de acesso configurada; caso contrário, bloqueie.
    const allowedUserId = Deno.env.get("NORTE_ALLOWED_USER_ID")?.trim();
    const currentUserId = ctx.userClaims?.id;
    if (!allowedUserId) return Response.json({ error: "Acesso privado não configurado." }, { status: 503 });
    if (!currentUserId || currentUserId !== allowedUserId) {
      return Response.json({ error: "Conta não autorizada." }, { status: 403 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return Response.json({ error: "Chave OpenAI ainda não configurada." }, { status: 503 });

    const rawBody = await req.text();
    if (rawBody.length > 45000) return Response.json({ error: "Mensagem muito longa." }, { status: 413 });

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!isPlainObject(parsed)) throw new Error("Invalid body");
      body = parsed;
    } catch {
      return Response.json({ error: "Dados inválidos." }, { status: 400 });
    }
    if (!Array.isArray(body.history) || body.history.length === 0 || body.history.length > 20 || !body.history.every(isMessage)) {
      return Response.json({ error: "Histórico inválido." }, { status: 400 });
    }
    const history = (body.history as Message[]).slice(-15);
    if (history.at(-1)?.role !== "user") {
      return Response.json({ error: "Última mensagem deve ser do usuário." }, { status: 400 });
    }

    const ctxData = isPlainObject(body.context) ? body.context : {};
    const energy = Number(ctxData.energy);
    const tasks = Array.isArray(ctxData.tasks) ? ctxData.tasks.slice(0, 15).map((t) => ({
      title: isPlainObject(t) ? String(t.title ?? "").slice(0, 140) : "",
      done: isPlainObject(t) ? t.done === true : false
    })) : [];
    const projects = Array.isArray(ctxData.projects) ? ctxData.projects.slice(0, 10).map((p) => ({
      title: isPlainObject(p) ? String(p.title ?? "").slice(0, 140) : "",
      next: isPlainObject(p) ? String(p.next ?? "").slice(0, 180) : ""
    })) : [];
    const context = {
      energia: energy >= 1 && energy <= 5 ? energy : null,
      tarefas: tasks,
      projetos: projects
    };

    try {
      const result = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: AbortSignal.timeout(25000),
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-6-luna",
          reasoning: { effort: "none" },
          store: false,
          max_output_tokens: 850,
          instructions: SYSTEM + "\n\nContexto atual declarado pelo aplicativo (não verificado): " + JSON.stringify(context),
          input: history.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!result.ok) {
        // Não retornar corpos ou detalhes de erro do provedor ao navegador.
        return Response.json({ error: result.status === 429 ? "Limite temporário de uso da IA." : "Falha ao consultar a IA." }, { status: result.status === 429 ? 429 : 502 });
      }
      const response = await result.json() as Record<string, unknown>;
      const reply = extractText(response);
      if (!reply) return Response.json({ error: "A IA não retornou texto." }, { status: 502 });
      return Response.json({ reply });
    } catch {
      return Response.json({ error: "Não foi possível contatar a IA." }, { status: 502 });
    }
  })
};