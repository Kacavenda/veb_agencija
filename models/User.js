const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ime i prezime su obavezni.'],
      trim: true,
      minlength: [2, 'Ime mora imati najmanje 2 karaktera.'],
      maxlength: [80, 'Ime može imati najviše 80 karaktera.']
    },

    email: {
      type: String,
      required: [true, 'Email adresa je obavezna.'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [160, 'Email adresa je predugačka.'],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email adresa nije ispravna.'
      ]
    },

    companyName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Naziv firme može imati najviše 120 karaktera.']
    },

    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [40, 'Broj telefona može imati najviše 40 karaktera.']
    },

    password: {
      type: String,
      required: [true, 'Lozinka je obavezna.'],
      minlength: [8, 'Lozinka mora imati najmanje 8 karaktera.'],
      select: false
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'users'
  }
);

userSchema.pre(
  'save',
  async function hashPassword(next) {
    try {
      if (!this.isModified('password')) {
        return next();
      }

      this.password = await bcrypt.hash(
        this.password,
        12
      );

      return next();
    } catch (error) {
      return next(error);
    }
  }
);

userSchema.methods.comparePassword =
  function comparePassword(
    enteredPassword
  ) {
    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

module.exports = mongoose.model(
  'User',
  userSchema
);
