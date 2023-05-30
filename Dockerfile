ARG NODE_VERSION=18.16
ARG PNPM_VERSION=8.6.0

### Builder stage
FROM node:${NODE_VERSION}-alpine AS builder
ARG PNPM_VERSION

# Create app directory
WORKDIR /app

# Copy dependency lock files
COPY pnpm-lock.yaml package.json ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}

# Forbid playwright from downloading all browsers by itself
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Fetch dependencies
RUN pnpm fetch

# Copy source code
ADD . .

# Install dev dependencies
RUN pnpm install --offline

# Build app
RUN pnpm build

### Runner stage
FROM node:${NODE_VERSION}-slim as runner
ARG PNPM_VERSION

# Create app directory
WORKDIR /app

# Copy dependency lock files
COPY pnpm-lock.yaml package.json ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION}

# Forbid playwright from downloading all browsers by itself
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Fetch dependencies
RUN pnpm fetch --prod

# Install production dependencies
RUN pnpm install --prod --prefer-offline && pnpm playwright install-deps && pnpm playwright install chromium

# Copy built app
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]
