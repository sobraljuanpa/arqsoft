FROM node:latest

WORKDIR /app

COPY ./package.json .

RUN npm cache clean --force
RUN npm install
COPY . .

EXPOSE 3001

CMD [ "node", "index.js" ]