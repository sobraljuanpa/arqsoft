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

const userExists = async (userEmail) => {
	const oldUser = await User.findOne({ email: userEmail });
	if (oldUser != null) {
		return true;
	} else {
		return false;
	}
};

const registerValidation = async (req, res, next) => {
	const { first_name, last_name, email, password, role } = req.body;
	if (!first_name) {
		sendError(res, 'El nombre es requerido.');
		return;
	} else if (!last_name) {
		sendError(res, 'El apellido es requerido.');
		return;
	} else if (!role) {
		sendError(res, 'El rol es requerido.');
		return;
	} else if (!isRoleValid(role)) {
		sendError(res, 'El rol ingresado no es válido.');
		return;
	} else if (!email) {
		sendError(res, 'El email es requerido.');
		return;
	} else if (!isMailValid(email)) {
		sendError(res, 'El formato del email del proveedor no es válido.');
		return;
	} else if (!password) {
		sendError(res, 'La contraseña es requerida.');
		return;
	} else if (await userExists(email)) {
		sendError(res, 'Este email ya esta siendo utilizado');
		return;
	} else {
		next();
	}
};

const loginValidation = async (req, res, next) => {
	const { email, password } = req.body;
	if (!email) {
		sendError(res, 'El email es requerido.');
		return;
	} else if (!isMailValid(email)) {
		sendError(res, 'El formato del email del proveedor no es válido.');
		return;
	} else if (!password) {
		sendError(res, 'La contraseña es requerida.');
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

module.exports = { registerValidation, loginValidation };
