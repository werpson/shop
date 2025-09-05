FROM oven/bun:latest
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install
COPY . .
RUN bun run build
RUN bun install
EXPOSE 3000
CMD ["bun", "run", "start"]