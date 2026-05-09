# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/
RUN npm install --workspace=@jyotish/client --include-workspace-root
COPY shared ./shared
COPY client ./client
RUN npm run --workspace=@jyotish/client build

# --- Stage 2: Build & Run Server ---
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates wget \
    fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN npm install --workspace=@jyotish/server --include-workspace-root

COPY shared ./shared
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist

# Download missing Ephemeris files if not present
RUN mkdir -p server/ephe && \
    cd server/ephe && \
    wget -nc https://github.com/aloistr/swisseph/raw/master/ephe/sepl_18.se1 && \
    wget -nc https://github.com/aloistr/swisseph/raw/master/ephe/semo_18.se1 && \
    wget -nc https://github.com/aloistr/swisseph/raw/master/ephe/seas_18.se1

ENV NODE_ENV=production \
    PORT=4000 \
    JYOTISH_CLIENT_DIST=/app/client/dist

EXPOSE 4000
WORKDIR /app/server
CMD ["node", "dist/index.js"]
