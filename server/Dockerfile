# Jyotish Pro server — Node 20 + swisseph (native) + puppeteer (Chromium)
FROM node:20-bookworm-slim AS build

# swisseph is a native binding compiled via node-gyp → needs python + g++
# puppeteer downloads its own Chromium during install
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates \
    # Chromium runtime deps for puppeteer
    fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Workspace install: copy manifests first for layer caching
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install only the server workspace and its deps (skip client to keep image lean)
RUN npm install --workspace=@jyotish/server --workspace=@jyotish/shared --include-workspace-root

# Copy source and build
COPY shared ./shared
COPY server ./server
RUN npm run --workspace=@jyotish/server build

ENV NODE_ENV=production \
    PORT=4000 \
    PUPPETEER_SKIP_DOWNLOAD=false

EXPOSE 4000

# Ephemeris files are mounted (or baked) at /app/server/ephe
WORKDIR /app/server
CMD ["node", "dist/index.js"]
