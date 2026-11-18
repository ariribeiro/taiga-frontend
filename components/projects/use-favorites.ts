"use client";
import { useCallback, useEffect, useState } from "react";

// Favoritos ficam só neste navegador (localStorage), separados por usuário do Taiga.
const keyFor = (userId: number) => `tdv:favorites:${userId}`;
const EVT = "tdv:favorites-changed"; // sincroniza lista da página e seletor do topo na mesma aba
const read = (userId: number): number[] => {
  try { const v = JSON.parse(localStorage.getItem(keyFor(userId)) ?? "[]"); return Array.isArray(v) ? v.filter((x) => Number.isInteger(x)) : []; }
  catch { return []; }
};

/** Favoritos do usuário; `ready` indica que já foram lidos do navegador. */
export function useFavorites(userId: number) {
  const [favs, setFavs] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavs(read(userId)); setReady(true);
    const sync = () => setFavs(read(userId));
    const onStorage = (e: StorageEvent) => { if (e.key === keyFor(userId)) sync(); }; // outras abas
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, sync);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(EVT, sync); };
  }, [userId]);

  const toggle = useCallback((id: number) => {
    const cur = read(userId);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch { /* armazenamento indisponível: vale só nesta sessão */ }
    setFavs(next);
    window.dispatchEvent(new Event(EVT));
  }, [userId]);

  return { favs, ready, toggle };
}
