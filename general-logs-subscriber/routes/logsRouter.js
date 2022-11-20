const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const EventUpdateLog = mongoose.model('EventUpdateLog');
const EventPublishingLog = mongoose.model('EventPublishingLog');
const RequestLog = mongoose.model('RequestLog');

require('../middleware/models/userModel');
const authMiddleware = require('../middleware/auth/authorization');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

// REQ 5
router.get('/events/approvals', authMiddleware.verifyProviderToken,  async (req, res) => {
	try {
		let events = await EventPublishingLog.find().lean();
		res.status(200).send(events);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.get('/events/updates', authMiddleware.verifyProviderToken, async (req, res) => {
	try {
		let events = await EventUpdateLog.find().lean();
		res.status(200).send(events);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
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

// REQ 12
// endpoint actividad
router.get('/activity', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find().lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
// endpoint actividad por mail de usuario
router.get('/activity/:actorId', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		const id = req.params.actorId;
		let requests = await RequestLog.find({ actor: id }).lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
// REQ 15
// endpoint registro
router.get('/audit/register', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find({ url: '/register' }).lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
// endpoint logines
router.get('/audit/login', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find({ url: '/login' }).lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
// endpoint accesos no autorizados
//401 Unauthorized
router.get('/audit/unauthorized', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find({ statusCode: 401 }).lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});
//403 Forbidden
router.get('/audit/forbidden', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find({ statusCode: 403 }).lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});


module.exports = router;