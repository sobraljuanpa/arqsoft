const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');

const hasExpired = (startDate) => {
	//TODO: Make this config.
	var expirationTime = 15 * 60000; // 60000 being the number of milliseconds in a minute
	var now = new Date();
	var timePassed = new Date(now - expirationTime);

	return new Date(startDate) < timePassed;
};

const updateTransactionState = async (transactionId, state) => {
	let updatedTransaction = await Transaction.findOneAndUpdate(transactionId, {
		status: state,
	});
	return updatedTransaction;
};

const validateAllTransactionsState = async () => {
	try {
		const transactions = await Transaction.find().lean();
		for (transaction of transactions) {
			if (hasExpired(transaction.startDate) && transaction.status != 'Completada') {
				updateTransactionState(transaction._id, 'Fallida');
			}
		}
	} catch (err) {
		console.log(err);
	}
};

module.exports = {
	updateTransactionState,
	hasExpired,
	validateAllTransactionsState,
};
