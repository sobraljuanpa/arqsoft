const mongoose = require('mongoose');

const supplierProductSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	description: {
		type: String,
		required: true,
	},
	cost: {
		type: Number,
		required:true,
	},
	informationUrl: {
		type: String,
	},
	eventId: {
		type: String,
		required: true,
	},
	validityDate: {
		type: String,
		required: true,
	},
	stock: {
		type: Number,
		required: true,
	},
	supplierEmail: {
		type: String,
		required: true,
	},
	country: {
		type: String,
		required: true,
	}
});

mongoose.model('SupplierProduct1', supplierProductSchema);
mongoose.model('SupplierProduct2', supplierProductSchema);
mongoose.model('SupplierProduct3', supplierProductSchema);
mongoose.model('SupplierProduct4', supplierProductSchema);
mongoose.model('SupplierProduct5', supplierProductSchema);
mongoose.model('SupplierProduct6', supplierProductSchema);
mongoose.model('SupplierProduct7', supplierProductSchema);
mongoose.model('SupplierProduct8', supplierProductSchema);
mongoose.model('SupplierProduct9', supplierProductSchema);
mongoose.model('SupplierProduct10', supplierProductSchema);
