import { describe, expect, it } from "vitest";
import { taigaWebLink } from "@/lib/utils/links";
import { DEFAULT_PERIOD, PERIODS, parsePeriod } from "@/lib/utils/periods";

describe("taigaWebLink", () => {
  it("monta o link de story e de task", () => {
    expect(taigaWebLink("https://taiga.exemplo.com", "meu-projeto", "us", 12)).toBe("https://taiga.exemplo.com/project/meu-projeto/us/12");
    expect(taigaWebLink("https://taiga.exemplo.com", "meu-projeto", "task", 7)).toBe("https://taiga.exemplo.com/project/meu-projeto/task/7");
  });
  it("sem o endereço do Taiga (ou sem slug) não há link", () => {
    expect(taigaWebLink("", "p", "us", 1)).toBeNull();
    expect(taigaWebLink(undefined, "p", "us", 1)).toBeNull();
    expect(taigaWebLink("https://t.com", undefined, "us", 1)).toBeNull();
  });
  it("codifica o slug", () => {
    expect(taigaWebLink("https://t.com", "a b/c", "us", 1)).toBe("https://t.com/project/a%20b%2Fc/us/1");
  });
});

describe("parsePeriod", () => {
  it("aceita só os períodos conhecidos", () => {
    for (const p of PERIODS) expect(parsePeriod(String(p))).toBe(p);
  });
  it("valores inválidos voltam ao padrão", () => {
    for (const v of [undefined, "", "abc", "15", "-14", "28.5"]) expect(parsePeriod(v), String(v)).toBe(DEFAULT_PERIOD);
  });
});
