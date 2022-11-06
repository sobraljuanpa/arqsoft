const express = require("express");
const mongoose = require('mongoose');

require('./models/requestLog');
const RequestLog = mongoose.model('RequestLog');
const redis = require("redis");
const client = redis.createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});
const subscriber = client.duplicate();
subscriber.connect();

const app = express();

subscriber.subscribe('request', async (message) => {
  let messageObject = JSON.parse(message);
  let request = new RequestLog(({method, url, body, statusCode, timetaken} = messageObject));
  await request.save();
});

// Todavia falta los endpoints para consultar logs
app.get("/", (req, res) => {
  res.send("Subscriber One");
})

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://mongo:27017/test').then(
        () => console.log('Connected to mongo instance')
    );

    app.listen(3001, () => {
      console.log("server is listening to port 3001");
    })
}