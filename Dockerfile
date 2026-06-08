# -------- Stage 1: Dependencies --------
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

RUN npm ci


# -------- Stage 2: Builder --------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build


# -------- Stage 3: Runner --------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && \
    adduser -S nextjs -u 1001

# Standalone app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Static/public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# FULL node_modules for prisma CLI
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000',(r)=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "./entrypoint.sh"]