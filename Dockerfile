FROM node:20-alpine3.20 AS frontend-builder

WORKDIR /app

COPY web/package*.json ./

RUN npm install

COPY web/ ./

RUN npm run build

# 生产环境
FROM node:20-alpine3.20 AS production

RUN apk add --no-cache \
    sqlite \
    && rm -rf /var/cache/apk/*

WORKDIR /app

RUN mkdir -p uploads database web/dist config

COPY package*.json ./

RUN npm install

COPY app.js config.js db.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY utils/ ./utils/
COPY config/ ./config/

COPY --from=frontend-builder /app/dist ./web/dist

ENV NODE_ENV=production

EXPOSE 3000/tcp

CMD ["npm", "start"] 