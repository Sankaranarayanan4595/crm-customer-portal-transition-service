const mongoose = require("mongoose");


const TransitionMastTemplateSchema = new mongoose.Schema({
  components: {
    type: Array,
    default: [],
  },
  templateName: {
    type: String,
    required: true,
  },
  templateDescription: {
    type: String,
    default: '',
  },
  publish: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const TransitionMastTemplates = mongoose.model("form_templates", TransitionMastTemplateSchema);

module.exports = TransitionMastTemplates;
