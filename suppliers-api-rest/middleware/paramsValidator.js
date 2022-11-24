const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const validUrl = require('valid-url');

const isMailValid = (email) => {
	const regex = /\S+@\S+\.\S+/;
	const isValid = regex.test(email);
	return isValid;
};

const supplierExists = async (email) => {
	const oldSupplier = await Supplier.findOne({ email });
	if (oldSupplier != null) {
		return true;
	} else {
		return false;
	}
};

const validURL = (url) => {
	return validUrl.isUri(url);
};

const createValidation = async (req, res, next) => {
	const { name, address, email, phone, integrationURL } = req.body;
	if (!name) {
		sendError(res, 'El nombre es requerido.');
	} else if (!address.country) {
		sendError(res, 'El país es requerido.');
	} else if (!address.city) {
		sendError(res, 'La ciudad es requerida.');
	} else if (!phone) {
		sendError(res, 'El telefono es requerido.');
	} else if (!email) {
		sendError(res, 'El email es requerido.');
	} else if (!isMailValid(email)) {
		sendError(res, 'El formato del email no es válido.');
	} else if (await supplierExists(email)) {
		sendError(res, 'Este email ya esta siendo utilizado.');
	} else if (!integrationURL) {
		sendError(res, 'La dirección de integración es requerida.');
	} else if (!validURL(integrationURL)) {
		sendError(res, 'El formato de la dirección de integración no es válido.');
	} else {
		next();
	}
};

const sendError = (res, message) => {
	res.status(400).send({
		status: 400,
		message: message,
	});
	return;
};

module.exports = createValidation;
