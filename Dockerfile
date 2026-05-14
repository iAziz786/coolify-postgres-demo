FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY server.js ./

EXPOSE 3000

CMD ["bun", "server.js"]
