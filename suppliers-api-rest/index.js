require('./models/Supplier');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./suppliers-swagger.json');
const supplierRoutes = require('./routes/suppliersRoutes');

const app = express();
const port =  3001;

app.use(bodyParser.json());
app.use(supplierRoutes);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://mongo:27017/test').then( //se modifica la url de conexion para usar el nombre del contenedor por compose y que resuelva internamente por dns.
        () => console.log("Connected to mongo instance")
    );

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}