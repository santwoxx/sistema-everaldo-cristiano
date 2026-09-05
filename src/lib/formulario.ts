/**
 * Leitura segura de FormData.
 *
 * `formData.get()` devolve `null` para campos que o formulário não renderizou,
 * e `null` não passa num `z.string().optional()` do Zod. Estes helpers
 * normalizam a entrada para que um campo ausente seja simplesmente
 * `undefined` — assim um formulário pode omitir campos opcionais sem
 * derrubar a validação inteira.
 */

/** Todos os campos de texto do formulário; ausentes ficam de fora do objeto. */
export function dadosDoForm(formData: FormData): Record<string, string> {
  const dados: Record<string, string> = {};
  for (const [chave, valor] of formData.entries()) {
    if (typeof valor === "string") dados[chave] = valor;
  }
  return dados;
}

/** Texto obrigatório: ausente vira string vazia (o Zod reporta o erro certo). */
export function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Texto opcional: ausente ou vazio vira `undefined`. */
export function textoOpcional(
  formData: FormData,
  campo: string
): string | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : undefined;
}

/** Texto opcional pronto para o banco: ausente ou vazio vira `null`. */
export function textoOuNulo(formData: FormData, campo: string): string | null {
  return textoOpcional(formData, campo) ?? null;
}

/** Checkbox: só marca `true` quando o navegador enviou o campo. */
export function marcado(formData: FormData, campo: string): boolean {
  const valor = formData.get(campo);
  return valor === "on" || valor === "true" || valor === "1";
}
