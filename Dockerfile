FROM node:20-alpine

WORKDIR /app

COPY . .

RUN yarn install

COPY . .

RUN yarn prisma generate

RUN yarn build

CMD ["yarn", "start:migrate:prod"]