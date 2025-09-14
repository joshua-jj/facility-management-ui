# ----------------------
# Build Stage
# ----------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install deps
RUN yarn install --frozen-lockfile

# Copy rest of the code
COPY . .

# Build Next.js app
RUN yarn build

# ----------------------
# Runtime Stage
# ----------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Only copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["yarn", "start"]
