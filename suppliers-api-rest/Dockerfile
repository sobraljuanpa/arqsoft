FROM node:latest

WORKDIR /app

COPY . .

RUN npm cache clean --force
RUN npm install

EXPOSE 3001

CMD [ "npm", "run", "dev" ]