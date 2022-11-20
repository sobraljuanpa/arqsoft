FROM node:latest

WORKDIR /app

COPY . .

RUN npm cache clean --force
RUN npm install

EXPOSE 3005

CMD [ "npm", "run", "dev" ]