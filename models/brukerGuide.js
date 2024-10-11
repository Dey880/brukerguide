const mongoose = require("mongoose");

const brukerSchema = new mongoose.Schema({
  author: String,
  tittel: String,
  tag: String,
  overskrift: Array,
  beskrivelse: Array,
  bilde: Array
});

const BrukerGuide = mongoose.model("BrukerGuide", brukerSchema);
module.exports = BrukerGuide;
