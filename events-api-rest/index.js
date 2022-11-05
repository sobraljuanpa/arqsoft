require('./models/eventModel');
require('./models/userModel');
const redis = require('redis');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const eventsRoutes = require('./routes/eventsRouter');

const app = express();
// habria que levantar esto de un dotenv
const port = 3000;
// habria que levantar esto de un dotenv tambien probablemente 
const publisher = redis.createClient({
    socket: {
        host: 'redis',
        port: 6379
    }
});
publisher.connect();

// esto habria que buscar la forma de dejarlo reutilizable, no logre aislarlo en un modulo que desp se copien pq 
// dockerfile no te deja hacer COPY ../algo, ampliaremos
async function logRequest (req, res, next) {
    let inboundTimeStamp = new Date();
    res.on('finish', async function() {
        let outboundTimeStamp = new Date();
        let diff = outboundTimeStamp.getMilliseconds() - inboundTimeStamp.getMilliseconds();
        await publisher.publish('request', JSON.stringify({
            'method': req.method,
            'url': req.originalUrl,
            'body': req.body,
            'status': this.statusCode,
            'timetaken (ms)': diff
        }));
    });
    next();
}

// ------------------------ REFERENCES ---------------------------------------------
//measuring RT
//https://ipirozhenko.com/blog/measuring-requests-duration-nodejs-express/
//acting on response event and accessing data
//https://stackoverflow.com/questions/51058621/get-response-status-code-in-a-middleware
//writing middleware in express
//https://expressjs.com/en/guide/writing-middleware.html
//pubsub with redis
//https://blog.logrocket.com/using-redis-pub-sub-node-js/
//using req object in express
//https://www.digitalocean.com/community/tutorials/nodejs-req-object-in-expressjs
//https://expressjs.com/en/api.html#req

// configuro middleware
app.use(bodyParser.json());
app.use(logRequest);//importante configurar middleware antes de las rutas si no se lo saltea
app.use(eventsRoutes);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://mongo:27017/test').then(
        () => console.log('Connected to mongo instance')
    );

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}