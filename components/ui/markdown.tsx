"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Lightbox } from "@/components/ui/lightbox";

/** Imagem do Taiga: resolve URL relativa, abre ampliada no visualizador e, se falhar, mostra um link. */
function Img({ src, alt, base }: { src?: string; alt?: string; base: string }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  if (!src) return null;
  let url = src;
  try { url = new URL(src.startsWith("//") ? "https:" + src : src, base ? base + "/" : undefined).href; } catch { /* mantém */ }
  if (failed) {
    return <a className="img-fail" href={url} target="_blank" rel="noopener noreferrer">🖼 {alt || "imagem"} — não carregou, abrir ↗</a>;
  }
  return (
    <>
      <button type="button" className="md-imglink" onClick={() => setOpen(true)} aria-label={`Ampliar ${alt || "imagem"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt ?? ""} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      </button>
      {open && <Lightbox images={[{ src: url, name: alt || "imagem" }]} start={0} onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * Markdown do Taiga renderizado como elementos React. HTML embutido (ex.: <img>) é aceito,
 * mas passa por sanitização (sem scripts, estilos ou eventos).
 */
export function Md({ text, base = "" }: { text: string; base?: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" />,
          img: ({ node: _n, src, alt }) => <Img src={typeof src === "string" ? src : undefined} alt={alt} base={base} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
