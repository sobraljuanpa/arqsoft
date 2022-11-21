const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const axios = require('axios');
const http = require('http');
const RedisClient = require('../cache/cacheManager');

const getAllIntegrationURLs = async () => {
	try {
		const suppliers = await Supplier.find().lean();
		let integrationURLs = [];
		suppliers.forEach((supplier) => {
			integrationURLs.push(supplier.integrationURL);
		});
		return integrationURLs;
	} catch (error) {
		console.log(error);
	}
};

/**
 * Gets all products of the suppliers registered on the system.
 * @returns Products sorted by eventId descending.
 */
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
	} catch (err) {
		console.log(err);
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
	} catch (err) {
		console.log(err);
	}
};

const sortProductsByEvent = (products) => {
	const sortedProducts = products.sort((a, b) => {
		return a.eventId - b.eventId;
	});
	return sortedProducts;
};

// The format of the products will be [ {eventId: [products]}, {eventId: [products]} ]
const setProductsCache = async (productsByEvent) => {
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
		console.log(error);
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
	} catch (err) {
		console.log(err);
	}
};

const productsListAlgorithm = (products, country) => {
	if (products) {
		let firstProduct = {};
		let previousSupplierEmail = '';
		let productsFromDifferentSupplier = [];

		console.log('Products', products);
		if (products[0].country === country) {
			firstProduct = products[0];
			previousSupplierEmail = firstProduct.supplierEmail;
			productsFromDifferentSupplier = [firstProduct];
			console.log('First product', firstProduct);
		}
		products.forEach((product) => {
			if (
				product.supplierEmail != previousSupplierEmail &&
				product.country === country
			) {
				previousSupplierEmail = product.supplierEmail;
				productsFromDifferentSupplier.push(product);
			}
		});
		return productsFromDifferentSupplier.slice(0, 5);
	} else {
		return [];
	}
};

const updateAllProductsCache = async () => {
	console.log('Updating cache products');
	const products = await getAllProducts();
	const productsByEvent = separateProductsByEvents(products);
	await setProductsCache(productsByEvent);
};

const getProductStock = async (supplierEmail, productId) => {
	try {
		console.log(supplierEmail, productId)
		const supplier = await Supplier.findOne({ email: supplierEmail }).exec();
		const supplierProducts = await getSupplierProducts(supplier.integrationURL);
		const product = supplierProducts.find(
			(product) => product._id == productId
		);
		console.log(product)
		return product.stock;
	} catch (err) {
		console.log(err);
	}
};

// Require some testing.
const updateSpecificProductCache = async (product) => {
	try {
		const eventId = product.eventId;
		const cachedProducts = await RedisClient.get(`eventProducts?${eventId}`);
		if (cachedProducts) {
			eventProducts = JSON.parse(cachedProducts);
			// Returns a new array, iterates over all objects to find the same id and then update it.
			const updatedEventProducts = eventProducts.map(
				(oldProd) =>
					[product].find((newProd) => newProd.id === oldProd.id) || oldProd
			);
			await RedisClient.set(
				`eventProducts?${eventId}`,
				JSON.stringify(updatedEventProducts)
			);
		}
	} catch (error) {
		console.log(error);
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
};
