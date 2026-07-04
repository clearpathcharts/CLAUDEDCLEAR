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
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public

# Cloud Run sets PORT automatically -- the server now reads it correctly
EXPOSE 8080
CMD ["node", "dist/server.cjs"]
