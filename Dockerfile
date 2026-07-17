# ── Grand Horizon HMS — Node backend + static frontend ──
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the app (frontend + server)
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/server.js"]
