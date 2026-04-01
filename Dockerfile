FROM node:20-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig*.json ./

COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/oasis-app/package.json ./artifacts/oasis-app/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

COPY . .

RUN PORT=5000 BASE_PATH=/ pnpm --filter @workspace/oasis-app run build

RUN pnpm --filter @workspace/api-server run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache git

COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/oasis-app/dist/public ./public

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["./entrypoint.sh"]
