const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  votingMessageID: { required: true, type: String },
  endTime: { required: true, type: Number },
  status: { required: true, type: String, default: "currently_voting_on" },
});

module.exports = mongoose.models.Schematics || mongoose.model('ReviewSchematics', schema);
