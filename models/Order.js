const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['documentation_sent', 'waiting_documentation', 'ai_estimation', 'queued', 'active', 'finished'],
      default: 'documentation_sent'
    },
    aiEstimate: {
      priceFrom: Number,
      priceTo: Number,
      estimatedDays: Number,
      note: String
    },
    queuePosition: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
