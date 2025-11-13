FROM node:20-alpine3.20 AS frontend-builder

WORKDIR /app

COPY web/package*.json ./

RUN npm install

COPY web/ ./

# 确保清空旧的构建产物
RUN rm -rf dist

RUN npm run build

# 生产环境
FROM node:20-alpine3.20 AS production

RUN apk add --no-cache \
    sqlite \
    openssl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# 创建必需的目录
RUN mkdir -p database backups config certs web/dist

COPY package*.json ./

RUN npm install

COPY app.js config.js db.js start-with-https.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY utils/ ./utils/
COPY config/ ./config/

COPY --from=frontend-builder /app/dist ./web/dist

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000/tcp
EXPOSE 3443/tcp

# 使用 ENTRYPOINT 确保启动脚本总是执行
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "start-with-https.js"]
