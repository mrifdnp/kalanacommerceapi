FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copy file konfigurasi dulu agar install lebih cepat (cache)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/ 

RUN pnpm install

# Copy semua file lainnya
COPY . .
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/kalanacommerce?schema=public"
# Generate prisma client dan build project
RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]