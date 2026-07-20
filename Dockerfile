FROM node:22-alpine AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

FROM dependencies AS build
WORKDIR /app
COPY . .
RUN npm run db:generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/worker ./worker

USER nextjs
EXPOSE 5000

CMD ["npm", "run", "start"]
