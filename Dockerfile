FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
RUN npm install --include=dev --no-audit --no-fund

FROM deps AS build
# Déclare l'ARG pour que Docker accepte la variable au build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN npx prisma db push --accept-data-loss
RUN npm --workspace @atable/web run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/package.json ./package.json

CMD ["npm", "--workspace", "@atable/web", "run", "start"]
