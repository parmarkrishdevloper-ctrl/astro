# Jyotish Pro client — Vite build → nginx static serve
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/

RUN npm install --workspace=@jyotish/client --workspace=@jyotish/shared --include-workspace-root

COPY shared ./shared
COPY client ./client

RUN npm run --workspace=@jyotish/client build

# ---- runtime ----
FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
