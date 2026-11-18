"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type LbImage = { src: string; name: string };

function StripImg({ src }: { src: string }) {
  const [bad, setBad] = useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return bad ? <span className="lb-bad" aria-hidden="true">⚠</span> : <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
}

/** Visualizador de imagens: setas, teclado (← → Esc), deslize no celular e tira de miniaturas. */
function Viewer({ images, start, onClose }: { images: LbImage[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => { ref.current?.showModal(); }, []);
  // pré-carrega vizinhas
  useEffect(() => { [1, -1].forEach((d) => { const im = new Image(); im.src = images[(i + d + n) % n].src; }); }, [i, images, n]);

  const cur = images[i];
  return (
    <dialog
      ref={ref}
      className="lb"
      onClose={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}
    >
      <div className="lb-top">
        <span className="lb-count">{n > 1 ? `${i + 1} / ${n}` : ""}</span>
        <span className="lb-name" title={cur.name}>{cur.name}</span>
        <a className="lb-btn" href={cur.src} target="_blank" rel="noopener noreferrer" download={cur.name} title="Baixar">⬇ Baixar</a>
        <button className="lb-btn" onClick={() => ref.current?.close()} aria-label="Fechar">✕</button>
      </div>

      <div className="lb-stage" onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
        {n > 1 && <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Anterior">‹</button>}
        {failed.has(i)
          ? <p className="lb-fail">🖼 Não foi possível carregar esta imagem.<br /><a href={cur.src} target="_blank" rel="noopener noreferrer">Abrir o arquivo ↗</a></p>
          // eslint-disable-next-line @next/next/no-img-element
          : <img key={cur.src} src={cur.src} alt={cur.name} referrerPolicy="no-referrer" onError={() => setFailed((s) => new Set(s).add(i))} />}
        {n > 1 && <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Próxima">›</button>}
      </div>

      {n > 1 && (
        <div className="lb-strip">
          {images.map((im, k) => (
            <button key={k} className={`lb-th${k === i ? " on" : ""}`} onClick={() => setI(k)} aria-label={`Imagem ${k + 1}`} title={im.name}>
              <StripImg src={im.src} />
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}

export function Lightbox(props: { images: LbImage[]; start: number; onClose: () => void }) {
  return createPortal(<Viewer {...props} />, document.body);
}
