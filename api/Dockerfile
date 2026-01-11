FROM node:20-alpine

WORKDIR /app

# install openssl and libc6-compat for prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 3001

# Run migrations and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
