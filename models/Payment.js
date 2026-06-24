const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema(
  {
    packageId: {
      type: String,
      required: true
    },

    packageName: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    options: {
      type: Array,
      default: []
    }
  },
  {
    _id: false
  }
);

const paymentSchema = new mongoose.Schema(
  {
    paypalOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    paypalCaptureId: {
      type: String,
      default: null
    },

    status: {
      type: String,
      required: true
    },

    currency: {
      type: String,
      default: 'EUR'
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    payer: {
      email: {
        type: String,
        default: ''
      },

      payerId: {
        type: String,
        default: ''
      },

      fullName: {
        type: String,
        default: ''
      }
    },

    applicationUser: {
      userId: {
        type: String,
        default: ''
      },

      name: {
        type: String,
        default: ''
      },

      email: {
        type: String,
        default: ''
      }
    },

    items: {
      type: [paymentItemSchema],
      default: []
    },

    paypalResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'payments'
  }
);

module.exports = mongoose.model('Payment', paymentSchema);