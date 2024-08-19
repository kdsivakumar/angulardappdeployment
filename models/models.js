const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// File Schema
const fileSchema = new Schema({
  name: String,
  path: String,
  size: Number,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

// Folder Schema
const folderSchema = new Schema({
  name: String,
  path: String,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('AngDepFile', fileSchema);
const Folder = mongoose.model('AngDepFolder', folderSchema);

module.exports = { File, Folder };
