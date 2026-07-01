# Multi-stage build. better-sqlite3 has no prebuilt binary for every node/glibc
# combo, so it compiles via node-gyp — which needs python3/make/g++. We install
# those only in the builder stage and copy the compiled node_modules into a lean
# runtime image (builder + runtime share the same base, so the .node binary is
# ABI-compatible).

# ---- builder: compile native deps (better-sqlite3) ----
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
