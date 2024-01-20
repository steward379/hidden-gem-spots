# 選擇一個 Node.js 環境作為基礎映像
FROM node:alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json 檔案
COPY package*.json ./

RUN apk add --no-cache python3
RUN apk add --no-cache make
RUN apk add --no-cache make g++
RUN npm install -g npm@10.3.0
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]

