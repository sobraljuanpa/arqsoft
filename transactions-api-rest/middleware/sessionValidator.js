const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const {
	updateTransactionState,
	hasExpired,
} = require('../services/transactionService');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

const isValidOperation = (transactionStatus, requestedRoute, res) => {
	switch (transactionStatus) {
		case 'Fallida':
			sendError(
				res,
				'La transacción ha sido Fallida, por favor comience de nuevo.'
			);
			break;
		case 'Completada':
			sendError(
				res,
				'La transacción ha sido Completada, por favor comience de nuevo.'
			);
			break;
		case 'En proceso':
			if (requestedRoute != 'purchase' && requestedRoute != 'eventsProducts') {
				sendError(
					res,
					'La operación solicitada no es valida para el estado de la transacción.'
				);
			}
			break;
		case 'Pendiente de pago':
			if (requestedRoute != 'payment' && requestedRoute != 'eventsProducts') {
				sendError(
					res,
					'La operación solicitada no es valida para el estado de la transacción.'
				);
			}
			break;
	}
};

const verifySession = async (req, res, next) => {
	const token = req.headers['sessiontoken'];
	const requestedRoute = req.route.path.split('/')[1];

	if (!token) {
		res
			.status(401)
			.send({ status: 401, message: 'Se necesita una transacción activa.' });
	} else {
		const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
		await jwt.verify(
			token,
			PUBLIC_KEY,
			{ algorithm: 'RS256' },
			async function (err, receivedTransaction) {
				if (err) {
					sendError(res, err.message);
					return;
				}
				if (hasExpired(receivedTransaction.startDate)) {
					updateTransactionState(receivedTransaction._id, 'Fallida');
					sendError(res, 'La transacción ha sido expirada.');
					return;
				}
				const transactionId = receivedTransaction._id;
				const transaction = await Transaction.findOne({ _id: transactionId });
				req.transaction = transaction;
				isValidOperation(transaction.status, requestedRoute, res);
				next();
			}
		);
	}
};

const sendError = (res, message) => {
	res.status(400).send({
		status: 400,
		message: message,
	});
};

module.exports = verifySession;
