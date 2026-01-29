FROM node:22-alpine AS base

FROM base AS tippecanoe-builder
RUN apk add --no-cache \
    libc6-compat sqlite sqlite-dev python3 make g++ git zlib-dev bash libgcc libstdc++
RUN git clone https://github.com/mapbox/tippecanoe.git \
    && cd tippecanoe \
    && make -j$(nproc) \
    && make install

FROM base AS dev
WORKDIR /app
RUN apk add --no-cache libc6-compat sqlite-libs libstdc++ libgcc python3 make g++
COPY --from=tippecanoe-builder /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=tippecanoe-builder /usr/local/bin/tile-join /usr/local/bin/tile-join
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p /app/uploads/mbtiles \
    && mkdir -p /app/uploads/geo \
    && mkdir -p /app/uploads/tileserver-config \
    && chown -R node:node /app/uploads
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "run", "start:dev"]

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm i

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat sqlite-libs libstdc++ libgcc

COPY --from=tippecanoe-builder /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=tippecanoe-builder /usr/local/bin/tile-join /usr/local/bin/tile-join

RUN mkdir -p /app/uploads/mbtiles \
    && mkdir -p /app/uploads/geo \
    && mkdir -p /app/uploads/tileserver-config \
    && chown -R node:node /app/uploads

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

CMD ["node", "dist/main.js"]