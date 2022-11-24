require('./models/supplierProducts');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 3005;
const routes = require('./routes/supplierProductsRoutes');


app.use(bodyParser.json());
app.use(routes);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://mongo:27017/mockProducts').then(
        () => console.log('Connected to mongo instance')
    );

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}