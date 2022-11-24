const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');

require('../utils/models/userModel');
const authMiddleware = require('../utils/auth/authorization');
const Transaction = mongoose.model('Transaction');

const router = express.Router();

const getAverageTransactionTime = (transactions) => {
	let times = [];

	transactions.forEach((transaction) => {
		let startDate = new Date(transaction.startDate);
		let paymentDate = new Date(transaction.paymentInfo.paymentDate);
		let msDiff = paymentDate - startDate;
		times.push(msDiff / 1000);
	});

	let sum = times.reduce((partial, aux) => partial + aux, 0);

	return sum / times.length;
};

const getBestSeller = (transactions) => {
	let sellers = [];
	transactions.forEach((transaction) => {
		let aux = sellers.find((r) => r.email == transaction.supplierEmail);
		if (aux == undefined) {
			sellers.push({
				email: transaction.supplierEmail,
				sales: transaction.productQuantity,
			});
		} else {
			aux.sales += transaction.productQuantity;
		}
	});
	return sellers.sort(function (a, b) {
		return a.sales - b.sales;
	})[0];
};

const getBestSellingCountry = (transactions) => {
	let countries = [];
	transactions.forEach((transaction) => {
		let aux = countries.find((r) => r.country == transaction.country);
		if (aux == undefined) {
			countries.push({
				country: transaction.country,
				sales: transaction.productQuantity,
			});
		} else {
			aux.sales += transaction.productQuantity;
		}
	});
	return countries.sort(function (a, b) {
		return a.sales - b.sales;
	})[0];
};

const buildResponse = (grouped) => {
	const eventTransactions = grouped.filter((t) => t._id != null);
	let response = [];
	eventTransactions.forEach((event) => {
		let eventInfo = {};
		eventInfo.eventId = event._id;
		eventInfo.startedTransactions = event.transactions.length;
		completedTransactions = event.transactions.filter(
			(t) => t.status == 'Completada'
		);
		eventInfo.completedPercentage =
			(completedTransactions.length * 100) / event.transactions.length;
		const averageTime = getAverageTransactionTime(completedTransactions);
		eventInfo.averageTransactionTime = `${averageTime} seconds`;
		eventInfo.bestSeller = getBestSeller(completedTransactions);
		eventInfo.bestSellingCountry = getBestSellingCountry(completedTransactions);
		response.push(eventInfo);
	});
	return response;
};

router.get(
	'/sales/events',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		const groupedTransactions = await Transaction.aggregate([
			{ $group: { _id: '$eventId', transactions: { $push: '$$ROOT' } } },
		]);
		let result = buildResponse(groupedTransactions);
		res.status(200).send(result);
	}
);

const buildResponseByCountry = (grouped) => {
	let response = [];
	grouped.forEach((country) => {
		let countryInfo = {};
		countryInfo.country = country._id;
		countryInfo.startedTransactions = country.transactions.length;
		completedTransactions = country.transactions.filter(
			(t) => t.status == 'Completada'
		);
		countryInfo.completedPercentage =
			(completedTransactions.length * 100) / country.transactions.length;
		const averageTime = getAverageTransactionTime(completedTransactions);
		eventInfo.averageTransactionTime = `${averageTime} seconds`;
		countryInfo.bestSeller = getBestSeller(completedTransactions);
		response.push(countryInfo);
	});
	return response;
};

router.get(
	'/sales/events/:eventId',
	authMiddleware.verifyAdminToken,
	async (req, res) => {
		const eventId = req.params.eventId;
		const transactions = await Transaction.aggregate([
			{ $match: { eventId: eventId } },
			{ $group: { _id: '$country', transactions: { $push: '$$ROOT' } } },
		]);
		let result = buildResponseByCountry(transactions);
		res.status(200).send(result);
	}
);

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
	);
};

router.get('/sales/product/:productId', async (req, res) => {
	const token = req.headers['authorization'];
	if (!token) {
		res.status(401).send({
			status: 401,
			message:
				'Se necesita un token para verificar que es el dueño del producto',
		});
	} else {
		const productId = req.params.productId;
		let transactions = await Transaction.find({
			productId: productId,
			status: 'Completada',
		}).lean();
		await getProviderFromToken(token, req);
		try {
			if (transactions.length == 0) {
				res.status(404).send({
					status: 404,
					message: `No hay ventas para el producto con id ${productId}`,
				});
			} else if (req.user.email != transactions[0].supplierEmail) {
				res
					.status(403)
					.send({
						status: 403,
						message: `El usuario autenticado no es el dueño del producto con id ${productId}`,
					});
			} else {
				res.status(200).send(transactions);
			}
		} catch (err) {
			res.status(500).send(err.message);
		}
	}
});

module.exports = router;
