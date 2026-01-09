FROM node:20-alpine

RUN apk add --no-cache tzdata

ENV TZ=Asia/Jakarta

RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/ 

RUN pnpm install

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]