const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  iCountry_id: {
    type: Number,
    required: true
  },
  cCountry: {
    type: String,
    required: true
  },
  iValidate_Document: {
    type: Number,
    default: 0
  },
  bActive: {
    type: Boolean,
    default: true
  },
  iCurrency_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'mast_currencies' // Reference to another model, if applicable
  },
  countryFlag: {
    type: String,
    default: ''
  }
});

 module.exports = mongoose.model('mast_countries', countrySchema);
