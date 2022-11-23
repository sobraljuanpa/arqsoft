const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');

require('../middleware/models/userModel');
const authMiddleware = require('../middleware/auth/authorization');
const Transaction = mongoose.model('Transaction');

const router = express.Router();
// falta endpoint para venta de productos por evento, solo disponible para el proveedor q vendio

//https://dev.to/petrussola/mongoose-and-how-to-group-by-count-5gcm
//para consultas agrupadas/ordenadas en mongo
//https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/#group-documents-by-author

// REQ 10
// endpoint consulta de ventas por evento con esta info 
// 1. Cantidad de ventas iniciadas
// 2. Porcentaje de ventas concretadas
// 3. Tiempo promedio de venta
// 4. Mejor proveedor (aquel que acumuló la mayor cantidad de productos vendidos)
// 5. Principal país de venta (aquel que acumuló la mayor cantidad de productos vendidos)
const getAverageTransactionTime = (transactions) => {
    let times = [];
    
    transactions.forEach(transaction => {
        let startDate = new Date(transaction.startDate);
        let paymentDate = new Date(transaction.paymentInfo.paymentDate);
        let msDiff = paymentDate - startDate;
        times.push(msDiff / 1000);
    });

    let sum = times.reduce((partial, aux) => partial + aux, 0);

    return sum / times.length;
};

router.get('/sales/test', async (req, res) => {
    const grouped = await Transaction.aggregate([{ $group: {_id: '$country', transactions: { $push: "$$ROOT" }} }]);// es con esta
    res.status(200).send(grouped);
});

// REQ 11
// endpoint comportamiento de evento por paises
// 1. Cantidad de ventas iniciadas
// 2. Porcentaje de ventas concretadas
// 3. Tiempo promedio de venta
// 4. Mejor proveedor (aquel que acumuló la mayor cantidad de productos vendidos)

router.get('/sales/event/:eventId', authMiddleware.verifyAdminToken, async (req, res) => {
    const eventId = req.params.eventId;
    const transactions = await Transaction.find({ eventId: eventId });
    const completedTransactions = transactions.filter(t => t.status == 'Completada');
    const completedPercentage = (completedTransactions.length * 100) / transactions.length;
    const avgTime = getAverageTransactionTime(completedTransactions);
    res.status(200).send({
        'Ventas iniciadas': transactions.length,
        'Porcentaje de ventas completadas': completedPercentage,
        'Tiempo promedio de venta (segundos)': avgTime
    });
});

// REQ 5.3
const getProviderFromToken = async (token, req) => {
    const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(
		token,
		PUBLIC_KEY,
		{ algorithm: 'RS256' },
		async function (err, user) {
			if (err) {
				throw new Error(err.message);
			} else {
                req.user = user;
			}
		}
    )
};

router.get('/sales/product/:productId', async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
        res.status(401).send('Se necesita un token para verificar que es el dueño del producto');
    } else {
        const productId = req.params.productId;
        let transactions = await Transaction.find({ productId: productId, status: 'Completada' }).lean();
        await getProviderFromToken(token, req);
        try {   
            if (transactions.length == 0) {
                res.status(404).send(`No hay ventas para el producto con id ${productId}`);
            } else if (req.user.email != transactions[0].supplierEmail) {
                res.status(403).send(`El usuario autenticado no es el dueño del producto con id ${productId}`);
            } else {
                res.status(200).send(transactions);
            }
        } catch(err) {
            res.status(500).send(err.message);
        }
    }
});

module.exports = router;