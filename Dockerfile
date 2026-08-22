# ==========================================
# 1. Base image with Node.js
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ==========================================
# 2. Dependencies stage
# ==========================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# 3. Builder stage
# ==========================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Vite + Node Bundle
RUN npx prisma generate
RUN npm run build

# ==========================================
# 4. Runner stage (Production/Staging image)
# ==========================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

# Copy necessary files for runtime
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 5000

# Start script: deploy migrations, optionally seed, and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
