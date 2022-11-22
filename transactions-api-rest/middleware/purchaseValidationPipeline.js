const ciValidator = require('ciuy');
const Pipeline = require('pipes-and-filters');

const { getProductStock } = require('../services/productsService');

const validationPipeline = Pipeline.create('Transaction validations');

const validate_mail = function (input, next) {
	const regex = /\S+@\S+\.\S+/;
	if (regex.test(input.email)) {
		next(null, input);
	} else {
		return next(Error('El formato del email del proveedor no es válido.'), 400);
	}
};

const validate_CI = function (input, next) {
	if (ciValidator.validateIdentificationNumber(input.ci)) {
		next(null, input);
	} else {
		return next(Error('El formato de la cédula de identidad es inválido.'));
	}
};

const validate_stock = async function (input, next) {
	try {
		const quantity = input.product.quantity;
		const productId = input.product.productId;
		const supplierEmail = input.product.supplierEmail;
		const productStock = await getProductStock(supplierEmail, productId);
		if (quantity <= productStock) {
			next(null, input);
		} else {
			return next(Error('No hay stock suficiente para realizar la compra.'));
		}
	} catch (error) {
        return next(Error(error.message));
    }
};

const purchaseValidation = (input, next) => {
	const { productId, supplierEmail, eventId } = input.product;
	const emailRegex = /\S+@\S+\.\S+/;

	if (!productId) {
		return next(Error('El id del producto es requerido.'));
	} else if (!eventId) {
		return next(Error('El id del evento es requerido.'));
	} else if (!supplierEmail) {
		return next(Error('El email del proveedor es requerido.'));
	} else if (!emailRegex.test(supplierEmail)) {
		return next(Error('El formato del email del proveedor no es válido.'));
	}
	next(null, input);
};

validationPipeline.use(purchaseValidation);
validationPipeline.use(validate_mail);
validationPipeline.use(validate_CI);
validationPipeline.use(validate_stock);

module.exports = validationPipeline;
