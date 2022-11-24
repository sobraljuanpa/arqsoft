const express = require('express');
const mongoose = require('mongoose');
const Event = mongoose.model('Event');
const router = express.Router();
require('../utils/models/userModel');
const authMiddleware = require('../utils/auth/authorization');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

router.get('/events', async (req, res) => {
	try {
		const date = new Date();
		const todayDate = date.getTime();
		let events = await Event.find({
			endDate: { $gte: todayDate },
		}).lean();
		res.status(200).send(events);
	} catch (error) {
		return res.status(500).send({ status: 500, message: error.message });
	}
});

router.post('/events', authMiddleware.verifyAdminToken, async (req, res) => {
	let event = new Event(
		({ name, description, startDate, endDate, country, city } = req.body)
	);
	event.creator = req.user.email;
	event.enabled = false;

	const createdEvent = await event.save();
	res.status(201).send(createdEvent);
});

router.get('/events/:id', async (req, res) => {
	const id = req.params.id;
	const event = await Event.findById(id).lean();

	if (!event) {
		throw new RestError('El evento solicitado no existe', 404);
	}

	res.status(200).send(event);
});

function validPUTRequestBody(request) {
	if (
		request.body.name ||
		request.body.description ||
		request.body.country ||
		request.body.city
	)
		return false;
	return true;
}

function getDisabledModifiedEventFields(request) {
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

function getEnabledModifiedEventFields(request) {
	let params = {};
	if (request.body.startDate) {
		params.startDate = request.body.startDate;
	}
	if (request.body.endDate) {
		params.endDate = request.body.endDate;
	}
	return params;
}

router.put('/events/:id', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		if (req.body.enabled) {
			res.status(400).send({
				status: 400,
				message: 'Para aprovar el evento utilice el otro mecanismo.',
			});
		} else if (req.body.creator) {
			res.status(400).send({
				status: 400,
				message: 'El evento no puede ser aprovado por el creador.',
			});
		} else {
			const id = req.params.id;
			const event = await Event.findById(id).lean();
			if (event.enabled) {
				if (validPUTRequestBody(req)) {
					let eventFields = getEnabledModifiedEventFields(req);
					let updatedEvent = await Event.findOneAndUpdate(id, eventFields, {
						new: true,
					});
					res.status(200).send(updatedEvent);
				} else {
					res.status(400).send({
						status: 400,
						message:
							'El evento ya se encuentra aprovado, solamente se pueden moficar las fechas de inicio y fin.',
					});
				}
			} else {
				let eventFields = getDisabledModifiedEventFields(req);
				let updatedEvent = await Event.findOneAndUpdate(id, eventFields, {
					new: true,
				});
				res.status(200).send(updatedEvent);
			}
		}
	} catch (error) {
		console.log(
			'An error occurred updating the transaction state: ',
			error.message
		);
		res.status(400).send({
			status: 400,
			message:
				'Ocurrio un error al modificar el evento, intente mas tarde por favor.',
		});
	}
});

async function approvingUserIsNotCreator(eventId, approver) {
	const eventToUpdate = await Event.findById(eventId).lean();
	const creator = eventToUpdate.creator;
	return creator != approver;
}

router.patch(
	'/events/:id',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			const id = req.params.id;
			let paramsToUpdate = {};
			if (await approvingUserIsNotCreator(id, req.user.email)) {
				paramsToUpdate.enabled = req.body.enabled;
				let updatedEvent = await Event.findOneAndUpdate(id, paramsToUpdate, {
					new: true,
				});
				res.status(200).send(updatedEvent);
			} else {
				res.status(400).send({
					status: 400,
					message: 'El evento no puede ser aprovado por el creador.',
				});
			}
		} catch (error) {
			res.status(400).send({
				status: 400,
				message:
					'Ocurrio un error al aprovar el evento, intente mas tarde por favor.',
			});
		}
	}
);

module.exports = router;
