FROM node:20-alpine

WORKDIR /app

# install openssl and libc6-compat for prisma
RUN apk add --no-cache openssl libc6-compat

# Copy Prisma schema - Railway builds from repo root, so we can access api/prisma
# This works when Railway root directory is set to /worker but build context is still repo root
COPY api/prisma ./prisma/

# Copy worker package.json and install dependencies
COPY worker/package*.json ./
RUN npm install

# Install Prisma CLI
RUN npm install prisma --save-dev || npm install -g prisma

# Generate Prisma client
RUN npx prisma generate

# Copy worker source
COPY worker/src ./src

CMD ["node", "src/worker.js"]
