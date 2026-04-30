FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN sed -i 's/\r$//' scripts/start.sh
RUN npx prisma generate
RUN mkdir -p uploads/leases uploads/reports uploads/passports logs

EXPOSE 5000

CMD ["sh", "scripts/start.sh"]
