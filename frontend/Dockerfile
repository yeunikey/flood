
# 1. Base image
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Dependencies (Установка зависимостей)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Development (Этап для локальной разработки)
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV WATCHPACK_POLLING=true
CMD ["npm", "run", "dev"]

# 4. Builder (Сборка для продакшена)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 5. Production Runner (Финальный образ)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]