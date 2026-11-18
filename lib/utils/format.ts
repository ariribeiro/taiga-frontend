/** "17 nov" a partir de uma data ISO (AAAA-MM-DD). */
export const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
