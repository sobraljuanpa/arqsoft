const mongoose = require('mongoose');
const User = mongoose.model('User');

const isMailValid = (email) => {
	const regex = /\S+@\S+\.\S+/;
	const isValid = regex.test(email);
	return isValid;
};

const isRoleValid = (role) => {
	const validRoles = ['administrador', 'proveedor'];
	return validRoles.includes(role);
};

const validateUserExistance = async (userEmail) => {
	// Validate if user exist in our database
	const oldUser = await User.findOne({ userEmail });

	if (oldUser) {
		return res.status(409).send('Este email ya esta siendo utilizado');
	}
};

const validateEmailAndPassword = async (email, password, res) => {
	if (!email) {
		sendError(res, 'El email es requerido.');
	} else if (!isMailValid(email)) {
		sendError(res, 'El formato del email del proveedor no es válido.');
	} else if (!password) {
		sendError(res, 'La contraseña es requerida.');
	}
};

const registerValidation = async (req, res, next) => {
	const { first_name, last_name, email, password, role } = req.body;
	if (!first_name) {
		sendError(res, 'El nombre es requerido.');
	} else if (!last_name) {
        sendError(res, 'El apellido es requerido.');
	}
	if (!role) {
		sendError(res, 'El rol es requerido.');
	} else if (!isRoleValid(role)) {
        sendError(res, 'El rol ingresado no es válido.');
	}
	await validateEmailAndPassword(email, password, res);
	await validateUserExistance(email, res);
	next();
};

const loginValidation = async (req, res, next) => {
    const { email, password } = req.body;
    await validateEmailAndPassword(email, password, res);
};

const sendError = (res, message) => {
	res.status(400).send({
		status: 400,
		message: message,
	});
	return;
};

module.exports = { registerValidation, loginValidation };
