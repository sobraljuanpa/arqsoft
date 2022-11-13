const express = require('express');
const mongoose = require('mongoose');

const Event = mongoose.model('Event');
const router = express.Router();
const auth = require('./middleware/authorization');
const { getProductsByEvent } = require('../services/productsService');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

router.get('/events', auth, async (req, res) => {
	try {
		let events = await Event.find().lean();
		res.status(200).send(events);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.post('/events', auth, async (req, res) => {
	const createdEvent = await event.save();
	res.status(201).send(createdEvent);
});

router.get('/events/:id', auth, async (req, res) => {
	const id = req.params.id;
	const event = await Event.findById(id).lean();

	if (!event) {
		throw new RestError('Recurso no encontrado', 404);
	}

	res.status(200).send(event);
});

// Put para pre aprobacion (modifico varios campos de la entidad, no se permite modificar enabled)

router.put('/events/:id', auth, async (req, res) => {
	const id = req.params.id;
	let eventToUpdate = await Event.findById(id).lean();
	let event = getModifiedEventFields(req);

	if (!eventToUpdate.enabled) {
		let updatedEvent = await Event.findOneAndUpdate(id, event, {
			new: true,
		});
		res.status(200).send(updatedEvent);
	} else {
		res.status(400).send({
			error: 'Event is enabled, can only modify start/end date using patch.',
		});
	}
});

function getModifiedEventFields(request) {
	let params = {};

	if (request.body.name) {
		params.name = request.body.name;
	}
	if (request.body.description) {
		params.description = request.body.description;
	}
	if (request.body.startDate) {
		params.startDate = request.body.startDate;
	}
	if (request.body.endDate) {
		params.endDate = request.body.endDate;
	}
	if (request.body.country) {
		params.country = request.body.country;
	}
	if (request.body.city) {
		params.city = request.body.city;
	}

	return params;
}

// Patch para aprobacion y post aprobacion (solo modifico enabled, enddate o startdate)
router.patch('/events/:id', async (req, res) => {
	const id = req.params.id;
	let paramsToUpdate = {};
	// TODO validar que el usuario actualizador y el creador de la entidad no sean el mismo si se modifica el campo enabled

	if (req.body.enabled) {
		paramsToUpdate.enabled = req.body.enabled;
	} else if (req.body.startDate) {
		paramsToUpdate.startDate = req.body.startDate;
	} else if (req.body.endDate) {
		paramsToUpdate.endDate = req.body.endDate;
	}

	let updatedEvent = await Event.findOneAndUpdate(id, paramsToUpdate, {
		new: true,
	});

	res.status(200).send(updatedEvent);
});

router.get('/eventsProducts/:eventId', async (req, res) => {
	try {
		const eventId = req.params.eventId;

		const eventProducts = await getProductsByEvent(eventId, false);
		res.status(200).send(eventProducts);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

module.exports = router;
