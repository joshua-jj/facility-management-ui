# Builder Stage
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

RUN corepack enable
RUN corepack prepare yarn@1.22.22 --activate

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE 3000

# Start the Next.js application with PM2
CMD ["yarn", "dev"]