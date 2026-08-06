// Every API route in this codebase returns `{ error, issues: parsed.error.flatten() }`
// on a Zod validation failure (400) -- `issues.fieldErrors` carries the specific
// per-field message the schema already computed. Client fetch wrappers used to
// discard that and only show the generic top-level `error` string; this pulls the
// real detail back out so the person filling the form sees exactly what's wrong.
export function describeApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const { error, issues } = payload as { error?: string; issues?: { fieldErrors?: Record<string, string[] | undefined> } };
  const fieldErrors = issues?.fieldErrors ?? {};
  const firstField = Object.entries(fieldErrors).find(([, messages]) => messages && messages.length > 0);
  if (firstField) {
    const [field, messages] = firstField;
    return `${field}: ${messages![0]}`;
  }
  return error || fallback;
}
