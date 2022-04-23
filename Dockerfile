FROM node:10

ENV BACK_PORT 80

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn config set network-timeout 1000000 -g && \
    yarn install

COPY . .
RUN NODE_ENV=production yarn build

EXPOSE 80

CMD ["node", "/app/dist/server/index.js"]