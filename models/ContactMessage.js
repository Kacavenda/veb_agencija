const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    websiteType: { type: String, trim: true, default: 'Nije navedeno' },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'read', 'answered'], default: 'new' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
