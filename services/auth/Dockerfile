FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx tsc --project tsconfig.build.json && cp db-schema.sql dist/

EXPOSE 3000

CMD ["node", "dist/server.js"]
