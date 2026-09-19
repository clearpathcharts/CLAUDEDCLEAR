# SOCIAL ONLY — ClearPath Automation Console + Publisher
FROM node:22-slim
WORKDIR /app

COPY clearpath-publisher/package.json clearpath-publisher/package-lock.json ./clearpath-publisher/
RUN cd clearpath-publisher && npm ci --omit=dev

COPY clearpath-publisher ./clearpath-publisher
COPY dashboard-glassmorphism ./dashboard-glassmorphism

# Ensure image deps win over any accidental host copy
RUN rm -rf clearpath-publisher/node_modules \
  && cd clearpath-publisher && npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["node", "clearpath-publisher/server.js"]
