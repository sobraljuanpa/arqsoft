const dateIsValid = (dateStr) => {
	const regex = /^\d{4}-\d{2}-\d{2}$/;

	if (dateStr.match(regex) === null) {
		return false;
	}

	const date = new Date(dateStr);

	const timestamp = date.getTime();

	if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
		return false;
	}

	return date.toISOString().startsWith(dateStr);
};

const transactionValidation = (req, res, next) => {
	const { name, birthdate, country, transactionId } = req.body;

	if (!transactionId) {
		if (!name) {
			sendError(res, 'El nombre es requerido.');
			return;
		} else if (!country) {
			sendError(res, 'El país de origen es requerido.');
			return;
		} else if (!birthdate) {
			sendError(res, 'La fecha de nacimiento es requerida.');
			return;
		} else if (!dateIsValid(birthdate)) {
			sendError(
				res,
				'El formato de la fecha de nacimiento es inválido, el formato requerido es YYYY-MM-DD.'
			);
			return;
		}
	}
	next();
};

const paymentValidation = (req, res, next) => {
	const { fullName, cardNumber, birthDate, billingAddress } = req.body;
	if (!fullName) {
		sendError(res, 'El nombre completo es requerido.');
		return;
	} else if (!cardNumber) {
		sendError(res, 'El numero de tarjeta de crédito es requerido.');
		return;
	} else if (!birthDate) {
		sendError(res, 'La fecha de nacimiento es requerida.');
		return;
	} else if (!dateIsValid(birthDate)) {
		sendError(
			res,
			'El formato de la fecha de nacimiento es inválido, el formato requerido es YYYY-MM-DD.'
		);
		return;
	} else if (!billingAddress) {
		sendError(res, 'La dirección de facturación es requerida.');
		return;
	}
	next();
};

const sendError = (res, message) => {
	res.status(400).send({
		status: 400,
		message: message,
	});
};

module.exports = {
	transactionValidation,
	paymentValidation,
};
