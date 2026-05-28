FROM node:22-alpine AS base
WORKDIR /app

# --- Development Stage ---
FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "run", "start:dev"]

# --- Production Dependencies ---
FROM base AS deps
COPY package*.json ./
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm i

# --- Builder Stage ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production Runner ---
FROM base AS runner
ENV NODE_ENV=production
USER node

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

CMD ["node", "dist/main.js"]