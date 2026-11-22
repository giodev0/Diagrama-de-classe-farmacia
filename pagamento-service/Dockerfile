FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

RUN npm rebuild sqlite3 --build-from-source

COPY . .

EXPOSE 3005

CMD ["node", "server.js"]