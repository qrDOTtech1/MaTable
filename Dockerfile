FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install --include=dev --no-audit --no-fund

FROM deps AS build
COPY . .
RUN npx --workspace @atable/db prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/package.json ./package.json

# Default: API. Override CMD per Railway service for web.
CMD ["node", "apps/api/dist/server.js"]
