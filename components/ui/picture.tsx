"use client";
import { useEffect, useRef, useState } from "react";
import { colorFor, initials } from "@/lib/utils/colors";

/** Imagem do Taiga (foto/logo) com fallback para iniciais coloridas se faltar ou falhar ao carregar. */
export function Picture({ src, name, size = 40, square = false }: { src?: string | null; name: string; size?: number; square?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // A imagem pode falhar antes da hidratação (onError não dispara): confere ao montar.
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setFailed(true); }, [src]);
  const radius = square ? Math.round(size * 0.28) : "50%";
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={ref} src={src} alt={name} width={size} height={size} loading="lazy" referrerPolicy="no-referrer"
        onError={() => setFailed(true)} className="pic" style={{ width: size, height: size, borderRadius: radius }} />
    );
  }
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: colorFor(name), borderRadius: radius }}>
      {initials(name)}
    </span>
  );
}
