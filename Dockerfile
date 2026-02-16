# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm install
COPY . .
RUN npm run build:frontend
RUN npm run build:backend

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/backend/package.json packages/backend/
COPY --from=builder /app/packages/backend/dist packages/backend/dist/
COPY --from=builder /app/packages/frontend/dist packages/frontend/dist/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/packages/backend/node_modules packages/backend/node_modules/ 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

VOLUME ["/app/data"]

CMD ["node", "packages/backend/dist/index.js"]
