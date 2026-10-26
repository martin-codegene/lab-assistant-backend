# API image — build from the repo root so the workspace lockfile is available:
#   docker build -f apps/api/Dockerfile -t lab-assistant-api .
#
# Runs pending Prisma migrations on start, then the Bun server (WebSockets
# included). Configure with env vars: DATABASE_URL, JWT_SECRET, MODEL_API_KEY,
# ELEVENLABS_API_KEY, STORAGE_DRIVER, … (see apps/api/.env.example).

FROM oven/bun:1.4.4-slim

# ffmpeg converts voice recordings to the WAV format Meta speech-to-text needs
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only the API workspace (skips the Expo app's dependencies)
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
RUN bun install --frozen-lockfile --filter @lab-assistant/api

COPY apps/api apps/api

WORKDIR /app/apps/api
# prisma.config.ts requires DATABASE_URL even though generate never connects
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build bunx prisma generate

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/local.ts"]
