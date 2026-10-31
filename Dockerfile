# 易道命理 · 生产镜像（Node + Next.js + SQLite）
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期公开变量可从构建参数注入；运行期仍读 env_file
ARG NEXT_PUBLIC_SITE_URL=http://localhost:9111
ARG NEXT_PUBLIC_SITE_NAME=易道命理
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
# 小内存服务器（2G）构建防护：限制 Node 堆，防止 OOM
ENV NODE_OPTIONS=--max-old-space-size=1280
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9111
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/data
# better-sqlite3 为 serverExternalPackages，需保留完整 node_modules 与源码侧依赖
COPY --from=builder /app ./
EXPOSE 9111
CMD ["npm", "run", "start"]
