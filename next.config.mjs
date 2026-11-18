const isProd = process.env.NODE_ENV === "production";

// Política de conteúdo. Next injeta scripts inline na hidratação, então 'unsafe-inline' é necessário
// (o ideal futuro é CSP com nonce). Imagens do Taiga (fotos, logos, anexos) vêm de outro endereço,
// por isso img-src aceita http(s); veja docs/MELHORIAS-PENDENTES.md para restringir.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

export default {
  // Gera .next/standalone (servidor mínimo, sem node_modules completo): base da imagem de contêiner.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Não usamos next/image: desliga o otimizador de imagens (superfície de ataque desnecessária).
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
