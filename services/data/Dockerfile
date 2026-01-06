FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "run", "start:dev"]