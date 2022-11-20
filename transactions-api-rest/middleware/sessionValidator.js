const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

const verifySession = async (req, res, next) => {
	const token = req.headers['sessiontoken'];

	if (!token) {
		// TODO: Improve this.
		next(new RestError('Se necesita una transacción.', 401));
	}
	const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(
		token,
		PUBLIC_KEY,
		{ algorithm: 'RS256' },
		async function (err, receivedTransaction) {
			if (err) {
				next(new RestError(err.message, 403));
			} else {
				// hacer nullchecks, tire un token con un email sin usuario registrado y me tiro el servicio
				const transactionId = receivedTransaction._id;
				const transaction = await Transaction.findOne({ transactionId });
				req.transaction = transaction;
				if (transaction.status === 'Expired') {
					//TODO: Ver el manejo de la expiracion y eso.
					return res.status(401).send('La transaction ha sido expirada.');
				}
				next();
			}
		}
	);
};

module.exports = verifySession;
