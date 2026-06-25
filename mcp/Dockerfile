FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Container listen port — override at runtime via -e PORT=… or Portainer stack env.
ARG SPARKMON_MCP_PORT=8096
ENV PORT=${SPARKMON_MCP_PORT}
ENV HOST=0.0.0.0

COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE ${SPARKMON_MCP_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1'

CMD ["node", "dist/index.js"]
