/** Períodos (em dias) do seletor da visão Kanban: múltiplos de 7 para fechar semanas inteiras. */
export const PERIODS = [14, 28, 56, 84] as const;
export const DEFAULT_PERIOD = 28;
export const parsePeriod = (v: string | undefined): number => {
  const n = Number(v);
  return (PERIODS as readonly number[]).includes(n) ? n : DEFAULT_PERIOD;
};
