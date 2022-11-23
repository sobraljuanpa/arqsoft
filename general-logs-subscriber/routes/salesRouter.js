const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const Transaction = mongoose.model('Transaction');

const router = express.Router();
// falta endpoint para venta de productos por evento, solo disponible para el proveedor q vendio

// REQ 10
// endpoint consulta de ventas por evento con esta info 
// 1. Cantidad de ventas iniciadas
// 2. Porcentaje de ventas concretadas
// 3. Tiempo promedio de venta
// 4. Mejor proveedor (aquel que acumuló la mayor cantidad de productos vendidos)
// 5. Principal país de venta (aquel que acumuló la mayor cantidad de productos vendidos)

// REQ 11
// endpoint comportamiento de evento por paises
// 1. Cantidad de ventas iniciadas
// 2. Porcentaje de ventas concretadas
// 3. Tiempo promedio de venta
// 4. Mejor proveedor (aquel que acumuló la mayor cantidad de productos vendidos)

// REQ 5.3
// Ventas de productos para eventos (solo visible para el proveedor que publicó el producto vendido)

//middleware valida el producto es de la persona que mando la req
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

router.get('/sales/:productId', async (req, res) => {
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