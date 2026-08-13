# Multi-stage build. better-sqlite3 has no prebuilt binary for every node/glibc
# combo, so it compiles via node-gyp — which needs python3/make/g++. We install
# those only in the builder stage and copy the compiled node_modules into a lean
# runtime image (builder + runtime share the same base, so the .node binary is
# ABI-compatible).

# ---- builder: compile native deps (better-sqlite3) ----
FROM node:24-slim AS builder
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# Whiteglove PDF stack: pandoc + xelatex (booktabs/titlesec reports).
# Mirrors /whiteglove-pdf skill standards used across Intent Solutions.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      pandoc \
      poppler-utils \
      python3 \
      texlive-xetex \
      texlive-fonts-recommended \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-plain-generic \
      lmodern \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules

# Build-time revision stamp, passed by the VPS deploy as --build-arg GIT_SHA.
# Placed AFTER the texlive apt layer so a new sha never invalidates that ~1GB
# cache; `COPY . .` below changes on the same commit anyway. Surfaced at
# GET /healthz .gitSha, which is what makes "are both surfaces on the same
# revision?" answerable — comparing image ids only proves they are equally stale.
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
