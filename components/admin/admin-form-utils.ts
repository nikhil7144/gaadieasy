export const adminFieldClass =
  "min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

export function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseFaqLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.includes("|") ? "|" : "::";
      const [question, ...answerParts] = item.split(separator);
      return {
        question: question?.trim() ?? "",
        answer: answerParts.join(separator).trim(),
      };
    })
    .filter((item) => item.question && item.answer);
}

export function parseOptionalJson(value: string) {
  if (!value.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
}

export async function postAdminJson(url: string, body: unknown) {
  return sendAdminJson(url, "POST", body);
}

export async function patchAdminJson(url: string, body: unknown) {
  return sendAdminJson(url, "PATCH", body);
}

export async function deleteAdminJson(url: string, body: unknown) {
  return sendAdminJson(url, "DELETE", body);
}

async function sendAdminJson(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}
