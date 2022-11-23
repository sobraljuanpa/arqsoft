require('dotenv').config()
require('./models/Supplier');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const supplierRoutes = require('./routes/suppliersRoutes');
const app = express();

const port =  process.env.DEPLOY_PORT;

app.use(bodyParser.json());
app.use(supplierRoutes);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGO_URL).then(
        () => console.log("Connected to mongo instance")
    );

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}