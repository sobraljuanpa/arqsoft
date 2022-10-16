require('./models/eventModel');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const eventsRoutes = require('./routes/eventsRouter');
const app = express();
const port = 3000;

app.use(bodyParser.json());
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