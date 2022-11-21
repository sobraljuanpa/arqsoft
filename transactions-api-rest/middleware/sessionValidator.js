const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const { updateTransactionState, hasExpired } = require('../services/transactionService');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

const verifySession = async (req, res, next) => {
	const token = req.headers['sessiontoken'];

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
				console.log(transactionId);
				const transaction = await Transaction.findOne({ _id: transactionId });
				console.log(transaction);
				req.transaction = transaction;
				if (transaction.status === 'Fallida') {
					return res
						.status(400)
						.send(
							'La transacción ha sido Fallida, por favor comience de nuevo.'
						);
				}
				next();
			}
		}
	);
};

module.exports = verifySession;
