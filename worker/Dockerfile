FROM node:20-alpine

WORKDIR /app

# install openssl and libc6-compat for prisma
RUN apk add --no-cache openssl libc6-compat

# Copy shared Prisma schema from api
COPY api/prisma ./prisma/

# Copy worker package.json and install dependencies
COPY worker/package*.json ./
RUN npm install

# Install Prisma CLI
RUN npm install prisma --save-dev || npm install -g prisma

# Generate Prisma client (from parent directory to access prisma folder)
RUN npx prisma generate

# Copy worker source
COPY worker/src ./src

CMD ["node", "src/worker.js"]
