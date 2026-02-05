# ----------------------
# Build Stage
# ----------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
RUN corepack enable
RUN corepack prepare yarn@1.22.22 --activate

# Declare build-time arguments
ARG NEXT_PUBLIC_BASE_URL

# Set env so Next.js sees it during build
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Copy package.json and yarn.lock
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

RUN corepack enable
RUN corepack prepare yarn@1.22.22 --activate

ENV NODE_ENV=production
ENV PORT=3000

# Only copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["yarn", "start"]
