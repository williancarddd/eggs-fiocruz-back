FROM node:20-alpine
# install openssl

RUN apk add --no-cache openssl

WORKDIR /app

COPY . .

RUN yarn install

COPY . .

RUN yarn prisma generate

RUN yarn build

CMD ["yarn", "start:migrate:prod"]