const mongoose = require('mongoose');

const projectOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true
    },

    label: {
      type: String,
      required: true
    },

    value: {
      type: Number,
      required: true
    },

    baseValue: {
      type: Number,
      required: true
    },

    extraQuantity: {
      type: Number,
      default: 0
    },

    unitPrice: {
      type: Number,
      default: 0
    },

    extraTotal: {
      type: Number,
      default: 0
    }
  },
  {
    _id: false
  }
);

const projectRequirementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true
    },

    label: {
      type: String,
      required: true
    },

    required: {
      type: Boolean,
      default: true
    },

    provided: {
      type: Boolean,
      default: false
    },

    value: {
      type: String,
      default: '',
      maxlength: 3000
    }
  },
  {
    _id: false
  }
);

const projectFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },

    fileName: {
      type: String,
      required: true
    },

    storagePath: {
      type: String,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true,
      min: 0
    },

    uploadedByRole: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    uploadedByUserId: {
      type: String,
      default: ''
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true,
    versionKey: false
  }
);


const projectMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },

    senderId: {
      type: String,
      default: ''
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ['new', 'read', 'answered'],
      default: 'new'
    },

    readAt: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true,
    versionKey: false
  }
);

const projectSchema = new mongoose.Schema(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    userId: {
      type: String,
      default: '',
      index: true
    },

    userName: {
      type: String,
      default: ''
    },

    userEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true
    },

    paypalOrderId: {
      type: String,
      required: true,
      index: true
    },

    packageId: {
      type: String,
      enum: ['basic', 'pro', 'premium'],
      required: true
    },

    packageName: {
      type: String,
      required: true
    },

    unitIndex: {
      type: Number,
      required: true,
      min: 1
    },

    totalUnitsInPurchase: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: [
        'new',
        'reviewing',
        'waiting-for-client',
        'accepted',
        'in-progress',
        'testing',
        'completed',
        'cancelled'
      ],
      default: 'new',
      index: true
    },

    paymentStatus: {
      type: String,
      default: 'COMPLETED'
    },

    currency: {
      type: String,
      default: 'EUR'
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    configuration: {
      type: [projectOptionSchema],
      default: []
    },

    requirements: {
      type: [projectRequirementSchema],
      default: []
    },

    files: {
      type: [projectFileSchema],
      default: []
    },

    messages: {
      type: [projectMessageSchema],
      default: []
    },

    clientNote: {
      type: String,
      default: '',
      maxlength: 3000
    },

    adminNote: {
      type: String,
      default: '',
      maxlength: 3000
    },

    materialsSubmittedAt: {
      type: Date,
      default: null
    },

    materialsRevision: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'projects'
  }
);

projectSchema.index(
  {
    payment: 1,
    packageId: 1,
    unitIndex: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model('Project', projectSchema);
