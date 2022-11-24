const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const axios = require('axios');
const RedisClient = require('../cache/cacheManager');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

const getAllIntegrationURLs = async () => {
	try {
		const suppliers = await Supplier.find().lean();
		let integrationURLs = [];
		suppliers.forEach((supplier) => {
			integrationURLs.push(supplier.integrationURL);
		});
		return integrationURLs;
	} catch (error) {
		console.log(error.message);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

const getAllProducts = async () => {
	try {
		let products = [];
		integrationURLs = await getAllIntegrationURLs();
		for (const integrationURL of integrationURLs) {
			const supplierProducts = await getSupplierProducts(integrationURL);
			// The operator spread (...) returns the element of an array/object.
			products.push(...supplierProducts);
		}
		return sortProductsByEvent(products);
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

const getSupplierProducts = async (integrationUrl) => {
	try {
		const supplierProductsUrl = integrationUrl.replace(
			/[\u200B-\u200D\uFEFF]/g,
			''
		);
		const response = await axios.get(supplierProductsUrl);
		return response.data;
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

const sortProductsByEvent = (products) => {
	const sortedProducts = products.sort((a, b) => {
		return a.eventId.localeCompare(b.eventId, undefined, {
			numerid: true,
			sensitivity: 'base',
		});
	});
	return sortedProducts;
};

// The format of the products will be [ {eventId: [products]}, {eventId: [products]} ]
const setProductsCache = async (productsByEvent) => {
	try {
		for (products of productsByEvent) {
			// First we obtain the eventId
			const eventId = Object.keys(products)[0];
			// Then we obtain the products for that event
			const eventProducts = products[eventId];
			// We set the products on redis.
			await RedisClient.set(
				`eventProducts?${eventId}`,
				JSON.stringify(eventProducts)
			);
		}
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

// The products received must be sorted by eventId descending.
const separateProductsByEvents = (products) => {
	try {
		// If there are products we set the initial eventId
		if (products.length > 0) {
			let productsByEvents = [];

			let eventId = products[0].eventId;
			let productsByEvent = [];
			for (product of products) {
				// If the eventId is different, this product is the first on the list so we set the previous event products.
				if (product.eventId != eventId) {
					// The object will be [ {eventId: [products]}, {eventId: [products]} ]
					productsByEvents = [
						...productsByEvents,
						{ [eventId]: productsByEvent },
					];
					eventId = product.eventId;
					productsByEvent = [];
				}
				productsByEvent.push(product);
			}
			// This is for the last event.
			productsByEvents = [...productsByEvents, { [eventId]: productsByEvent }];
			return productsByEvents;
		} else {
			return [];
		}
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

const getProductsByEvent = async (eventId, country) => {
	try {
		let eventProducts = [];
		const cachedProducts = await RedisClient.get(`eventProducts?${eventId}`);
		if (cachedProducts) {
			eventProducts = JSON.parse(cachedProducts);
			eventProducts = productsListAlgorithm(eventProducts, country);
			return eventProducts;
		} else {
			const products = await getAllProducts();
			const productsByEvent = separateProductsByEvents(products);

			// Update the cache.
			productsByEvent.length > 0 ?? setProductsCache(productsByEvent);

			// The object will be [ {eventId: [products]}, {eventId: [products]} ]
			productsByEvent.forEach((event) => {
				const containsEvent = Object.keys(event).includes(eventId);
				if (containsEvent) {
					eventProducts = event[eventId];
				}
			});
			eventProducts = productsListAlgorithm(eventProducts, country);

			return eventProducts;
		}
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

const shuffleList = (list) => {
	const shuffeled = list.sort(() => {
		const randomTrueOrFalse = Math.random() > 0.5;
		return randomTrueOrFalse ? 1 : -1;
	});
	return shuffeled;
};

const productsListAlgorithm = (products, country) => {
	if (products) {
		let previousSupplierEmails = [];
		let productsFromDifferentSupplier = [];
		if (products[0].country === country) {
			const firstProduct = products[0];
			previousSupplierEmails.push(firstProduct.supplierEmail);
			productsFromDifferentSupplier = [firstProduct];
		}
		products.forEach((product) => {
			if (
				!previousSupplierEmails.includes(product.supplierEmail) &&
				product.country === country
			) {
				previousSupplierEmails.push(product.supplierEmail);
				productsFromDifferentSupplier.push(product);
			}
		});
		shuffleProducs = shuffleList(productsFromDifferentSupplier);
		return shuffleProducs.slice(0, 5);
	} else {
		return [];
	}
};

const updateAllProductsCache = async () => {
	console.log('Updating cache products');
	try {
		const products = await getAllProducts();
		const productsByEvent = separateProductsByEvents(products);
		await setProductsCache(productsByEvent);
	} catch (error) {
		console.log('An error occurred updating the cache: ', error.message);
	}
};

const getProductStock = async (supplierEmail, productId) => {
	const supplier = await Supplier.findOne({ email: supplierEmail }).exec();
	const supplierProducts = await getSupplierProducts(supplier.integrationURL);
	const product = supplierProducts.find((product) => product._id == productId);
	if (!product) {
		throw new RestError('No existe un producto con el id especificado.', 400);
	}
	return product.stock;
};

const updateProductStock = async (productId, supplierEmail, quantity) => {
	try {
		const supplier = await Supplier.findOne({ email: supplierEmail }).exec();
		const updateStockUrl = `${supplier.integrationURL}/${productId}`.replace(
			/[\u200B-\u200D\uFEFF]/g,
			''
		);
		// Retain stock
		await axios.put(updateStockUrl, {}, { params: { stock: quantity } });

		updateAllProductsCache();
	} catch (error) {
		console.log(
			'An error occurred updating the product stock: ',
			error.message
		);
		throw new RestError(
			'El sistema esta experimentando problemas, por favor reintente en un tiempo o contactesé con un administrador.',
			400
		);
	}
};

module.exports = {
	getAllIntegrationURLs,
	getAllProducts,
	getProductsByEvent,
	separateProductsByEvents,
	setProductsCache,
	updateAllProductsCache,
	getProductStock,
	updateProductStock,
};
