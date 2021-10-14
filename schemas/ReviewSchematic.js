const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  votingMessageID: { required: true, type: String },
  endTime: { required: true, type: Number },
  status: { required: true, type: String, default: "currently_voting_on" },
  resultUp: { type: String },
  resultDown: { type: String }
});

module.exports = mongoose.models.ReviewSchematics || mongoose.model('ReviewSchematics', schema);
