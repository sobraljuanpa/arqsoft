// TODO: Ver si esto va aca.
const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const axios = require('axios');
const RedisClient = require('../cache/cacheManager');

// Working like a charm
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

// Working like a charm
const getAllProducts = async () => {
	let products = [];
	integrationURLs = await getAllIntegrationURLs();
	for (const integrationURL of integrationURLs) {
		const supplierProducts = await getSupplierProducts(integrationURL);
		products.push(...supplierProducts);
	}
	return sortProductsByEvent(products);
};

// Working like a charm
const getSupplierProducts = async (integrationUrl) => {
	try {
		const supplierProductsUrl = `${integrationUrl}/products`;
		const response = await axios.get(supplierProductsUrl);
		return response.data;
	} catch (err) {
		console.log(err);
	}
};

// Working like a charm
const sortProductsByEvent = (products) => {
	const sortedProducts = products.sort((a, b) => {
		return a.eventId - b.eventId;
	});
	return sortedProducts;
};

// The products received must be sorted by eventId descending.
const setCachedProductsByEvent = async (products) => {
	try {
		// If there are products we set the initial eventId
		let eventId = products ? products[0].eventId : '';
		let eventProducts = [];
		for (product of products) {
			// If the eventId is different, this product is the first on the list so we set the previous event products.
			// TODO: Creo que el ultimo evento no estaria quedando
			if (product.eventId != eventId) {
				await RedisClient.set(
					`eventsProducts?${eventId}`,
					JSON.stringify(eventProducts)
				);
				eventId = product.eventId;
				eventProducts = [];
			}
			eventProducts.push(product);
		}
	} catch (error) {
		console.log(error);
	}
};

const setCachedEventProducts = async (eventId, products) => {
	// Me debo conectar cada vez?
	try {
		await RedisClient.set(
			`eventsProducts?${eventId}`,
			JSON.stringify(products)
		);
	} catch (err) {
		console.log(err);
	}
};

const getCachedEventProducts = async (eventId) => {
	try {
		console.log("Event id on function: ", eventId)
		const cacheKey = `eventsProducts?${eventId}`;
		const products = await RedisClient.get(cacheKey);
		return JSON.parse(products);
	} catch (err) {
		console.log(err);
	}
};

const main = async () => {
	getAllProducts();
	const products = await getCachedEventProducts(1);
	//   products = products.filter((product) => {
	//     return product.eventId === 1;
	//   });
	console.log(products);
	//   console.log(
	//     products.filter((product) => {
	//       return product.eventId === 1;
	//     })
	//   );
};

// main();

module.exports = {
	getAllIntegrationURLs,
	getAllProducts,
	setCachedProductsByEvent,
	getCachedEventProducts,
};
