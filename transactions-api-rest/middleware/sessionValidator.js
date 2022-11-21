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

const isValidOperation = (transactionStatus, requestedRoute, next) => {
	switch (transactionStatus) {
		case 'Fallida':
			next(RestError(
				'La transacción ha sido Fallida, por favor comience de nuevo.',
				400
			));
			break;
		case 'Completada':
			next(new RestError(
				'La transacción ha sido Completada, por favor comience de nuevo.',
				400
			));
			break;
		case 'En proceso':
			if (requestedRoute != 'purchase' && requestedRoute != 'eventsProducts') {
				next(new RestError(
					'La operación solicitada no es valida para el estado de la transacción.',
					400
				));
			}
			break;
		case 'Pendiente de pago':
			if (requestedRoute != 'payment' && requestedRoute != 'eventsProducts') {
				next(new RestError(
					'La operación solicitada no es valida para el estado de la transacción.',
					400
				));
			}
			break;
	}
};

const verifySession = async (req, res, next) => {
	const token = req.headers['sessiontoken'];
	const requestedRoute = req.route.path.split('/')[1];

	if (!token) {
		next(new RestError('Se necesita una transacción.', 401));
	}
	const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(
		token,
		PUBLIC_KEY,
		{ algorithm: 'RS256' },
		async function (err, receivedTransaction) {
			if (err) {
				next(new RestError(err.message, 400));
			} else {
				// hacer nullchecks, tire un token con un email sin usuario registrado y me tiro el servicio
				if (hasExpired(receivedTransaction.startDate)) {
					updateTransactionState(receivedTransaction._id, 'Fallida');
					return res.status(400).send('La transacción ha sido expirada.');
				}

				const transactionId = receivedTransaction._id;
				const transaction = await Transaction.findOne({ _id: transactionId });
				req.transaction = transaction;
				isValidOperation(transaction.status, requestedRoute, next);
				next();
			}
		}
	);
};

module.exports = verifySession;
