# syntax=docker/dockerfile:1
# Imagem do front (Next.js em modo "standalone"). Troque a base se o cluster exigir um registro interno ou imagens UBI
# (ex.: --build-arg NODE_IMAGE=registry.access.redhat.com/ubi9/nodejs-22-minimal).
ARG NODE_IMAGE=docker.io/library/node:22-alpine

# ---- build ----
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- runtime: servidor mínimo gerado pelo Next (.next/standalone) + arquivos estáticos ----
FROM ${NODE_IMAGE}
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# OpenShift (SCC "restricted") roda o contêiner com um UID aleatório e GID 0: o grupo 0 precisa ter o mesmo acesso do dono.
RUN mkdir -p .next/cache && chgrp -R 0 /app && chmod -R g=u /app
USER 1001
EXPOSE 8080
CMD ["node", "server.js"]
