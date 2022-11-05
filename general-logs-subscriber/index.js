const express = require("express");
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

subscriber.subscribe('request', (message) => {
    console.log(message); 
});

app.get("/", (req, res) => {
  res.send("Subscriber One");
})

app.listen(3001, () => {
  console.log("server is listening to port 3001");
})


//Aca faltaria todavia bajar los logs a bd y hacer una api pa consultarlos, pero por ahora zafa