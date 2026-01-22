# services/tiles/Dockerfile
FROM node:22-alpine AS base

# Добавил sqlite-dev в список ниже
RUN apk add --no-cache \
    libc6-compat \
    sqlite \
    sqlite-dev \
    python3 \
    make \
    g++ \
    git \
    zlib-dev \
    bash \
    libgcc \
    libstdc++

RUN git clone https://github.com/mapbox/tippecanoe.git \
    && cd tippecanoe \
    && make -j$(nproc) \
    && make install \
    && cd .. \
    && rm -rf tippecanoe

WORKDIR /app

FROM base AS dev

COPY package*.json ./
RUN npm install

COPY . .

# Создаем структуру папок
RUN mkdir -p /app/uploads/mbtiles \
    && mkdir -p /app/uploads/geo \
    && mkdir -p /app/uploads/tileserver-config \
    && chown -R node:node /app/uploads

ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "start:dev"]