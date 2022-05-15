# Common build stage
FROM node:16.3-alpine3.12

COPY . ./app

WORKDIR /app

RUN npm install

EXPOSE 3000

ENV NODE_ENV production

CMD [ "npm", "start" ]
