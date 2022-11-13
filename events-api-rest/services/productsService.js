const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const axios = require('axios');
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
	let products = [];
	integrationURLs = await getAllIntegrationURLs();
	for (const integrationURL of integrationURLs) {
		const supplierProducts = await getSupplierProducts(integrationURL);
		// The operator spread (...) returns the element of an array/object.
		products.push(...supplierProducts);
	}
	return sortProductsByEvent(products);
};

const getSupplierProducts = async (integrationUrl) => {
	try {
		const supplierProductsUrl = `${integrationUrl}/products`;
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

// Deprecated.
const setAllCachedProductsByEvent = async (products) => {
	try {
		// If there are products we set the initial eventId
		let eventId = products ? products[0].eventId : '';
		let eventProducts = [];
		for (product of products) {
			// If the eventId is different, this product is the first on the list so we set the previous event products.
			if (product.eventId != eventId) {
				await RedisClient.set(
					`eventProducts?${eventId}`,
					JSON.stringify(eventProducts)
				);
				eventId = product.eventId;
				eventProducts = [];
			}
			eventProducts.push(product);
		}
		// This is for the last event.
		await RedisClient.set(
			`eventProducts?${eventId}`,
			JSON.stringify(eventProducts)
		);
	} catch (error) {
		console.log(error);
	}
};

// The format of the products will be [ {eventId: [products]}, {eventId: [products]} ]
const updateProductsCache = async (productsByEvent) => {
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
		if (products) {
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

const getProductsByEvent = async (eventId) => {
	try {
		const cachedProducts = await RedisClient.get(`eventProducts?${eventId}`);
		if (cachedProducts) {
			eventProducts = JSON.parse(cachedProducts);
			return eventProducts;
		} else {
			const products = await getAllProducts();
			const productsByEvent = separateProductsByEvents(products);

			// Update the cache.
			productsByEvent.length > 0 ?? updateProductsCache(productsByEvent);

			eventProducts = productsByEvent[eventId - 1][eventId];

			// The object will be [ {eventId: [products]}, {eventId: [products]} ]
			// [eventId - 1] is for the position on the array that is -1 because it start on 0.
			// [eventId] is for getting the products for the eventId.
			return eventProducts;
		}
	} catch (err) {
		console.log(err);
	}
};

module.exports = {
	getAllIntegrationURLs,
	getAllProducts,
	getProductsByEvent,
	separateProductsByEvents,
	updateProductsCache
};
