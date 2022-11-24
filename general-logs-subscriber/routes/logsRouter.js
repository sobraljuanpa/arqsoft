const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const EventUpdateLog = mongoose.model('EventUpdateLog');
const EventPublishingLog = mongoose.model('EventPublishingLog');
const RequestLog = mongoose.model('RequestLog');

require('../utils/models/userModel');
const authMiddleware = require('../utils/auth/authorization');

const getEventsByDateRange = async (document, requestBody) => {
	if (requestBody?.since) {
		if (requestBody.until) {
			console.log(requestBody.since);
			console.log(requestBody.until);
			return await document
				.find({
					timestamp: { $gte: requestBody.since, $lte: requestBody.until },
				})
				.lean();
		} else {
			console.log(requestBody.since);
			return await document
				.find({ timestamp: { $gte: requestBody.since } })
				.lean();
		}
	} else if (requestBody?.until) {
		return await document
			.find({ timestamp: { $lte: requestBody.until } })
			.lean();
	} else {
		return await document.find().lean();
	}
};

router.get(
	'/events/approvals',
	authMiddleware.verifyProviderToken,
	async (req, res) => {
		try {
			let events = await getEventsByDateRange(EventPublishingLog, req.query);
			res.status(200).send(events);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get(
	'/events/updates',
	authMiddleware.verifyProviderToken,
	async (req, res) => {
		try {
			let events = await getEventsByDateRange(EventUpdateLog, req.query);
			res.status(200).send(events);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get('/activity', authMiddleware.verifyAdminToken, async (req, res) => {
	try {
		let requests = await RequestLog.find().lean();
		res.status(200).send(requests);
	} catch (error) {
		return res.status(400).send({ status: 400, message: error.message });
	}
});

router.get(
	'/activity/:actorId',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			const id = req.params.actorId;
			let requests = await RequestLog.find({ actor: id }).lean();
			res.status(200).send(requests);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get(
	'/audit/register',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			let requests = await RequestLog.find({ url: '/register' }).lean();
			res.status(200).send(requests);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get(
	'/audit/login',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			let requests = await RequestLog.find({ url: '/login' }).lean();
			res.status(200).send(requests);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get(
	'/audit/unauthorized',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			let requests = await RequestLog.find({ statusCode: 401 }).lean();
			res.status(200).send(requests);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

router.get(
	'/audit/forbidden',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		try {
			let requests = await RequestLog.find({ statusCode: 403 }).lean();
			res.status(200).send(requests);
		} catch (error) {
			return res.status(400).send({ status: 400, message: error.message });
		}
	}
);

module.exports = router;
