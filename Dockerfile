ARG NODE_VERSION=21.6
ARG PNPM_VERSION=8.15

### Base image
FROM node:${NODE_VERSION}-alpine as base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}

### Builder stage
FROM base as builder
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
ADD . .
RUN pnpm install --offline && pnpm build

### Runner stage
FROM base as runner
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch --prod
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod --prefer-offline
CMD ["node", "dist/main.js"]
