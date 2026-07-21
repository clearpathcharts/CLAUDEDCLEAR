# Build stage -- installs everything and runs the real build process
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage -- only what's needed to actually run the server
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

# Non-root runtime user (Aikido / Docker CIS)
RUN groupadd --system --gid 10001 clearpath \
  && useradd --system --uid 10001 --gid clearpath --home-dir /app --shell /usr/sbin/nologin clearpath

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public

RUN chown -R clearpath:clearpath /app

USER clearpath

# Cloud Run sets PORT automatically -- the server now reads it correctly
EXPOSE 8080
CMD ["npm", "start"]
