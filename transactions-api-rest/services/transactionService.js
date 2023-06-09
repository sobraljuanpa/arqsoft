const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');

const { updateProductStock } = require('./productsService');

const hasExpired = (startDate) => {
	var expirationTime = process.env.SESSION_DURATION * 60000; // 60000 being the number of milliseconds in a minute
	var now = new Date();
	var timePassed = new Date(now - expirationTime);

	return new Date(startDate) < timePassed;
};

const updateTransactionState = async (transactionId, state) => {
	try {
		let updatedTransaction = await Transaction.findOneAndUpdate(transactionId, {
			status: state,
		});
		return updatedTransaction;
	} catch (error) {
		console.log(
			'An error occurred updating the transaction state: ',
			error.message
		);
	}
};

const validateAllTransactionsState = async () => {
	try {
		console.log('Validating transactions state.')
		const transactions = await Transaction.find().lean();
		for (transaction of transactions) {
			if (
				hasExpired(transaction.startDate) &&
				transaction.status != 'Completada'
			) {
				if (transaction.status == 'Pendiente de pago') {
					console.log(
						'Returning stock for failed transaction: ' + transaction._id
					);
					await updateProductStock(
						transaction.productId,
						transaction.supplierEmail,
						-transaction.productQuantity
					);
				}
				updateTransactionState(transaction._id, 'Fallida');
			}
		}
	} catch (error) {
		console.log(
			'An error occurred validating the transaction state: ',
			error.message
		);
	}
};

const getTransactionInfo = async (transactionId, res) => {
	try {
		const transaction = await Transaction.findOne({ _id: transactionId });
		transaction
			? res.status(200).send(transaction)
			: res.status(400).send({ status: 400, message: error.message });
		return;
	} catch (error) {
		return res.status(400).send({
			status: 400,
			message:
				'Ha ocurrido un problema al localizar la transacción solicitada, por favor comuniquese con el administrador.',
		});
	}
};

module.exports = {
	updateTransactionState,
	hasExpired,
	validateAllTransactionsState,
	getTransactionInfo,
};
