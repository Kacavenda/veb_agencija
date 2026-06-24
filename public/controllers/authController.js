const User = require('../models/User');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

async function register(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Popuni sva obavezna polja.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Lozinke se ne poklapaju.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Lozinka mora imati najmanje 8 karaktera.'
      });
    }

    const hasLetter = /[A-Za-zČĆŽŠĐčćžšđ]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Lozinka mora sadržati najmanje jedno slovo i jedan broj.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Korisnik sa ovom email adresom već postoji.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    return res.status(201).json({
      success: true,
      message: 'Nalog je uspešno kreiran.',
      user: createSafeUser(user)
    });
  } catch (error) {
    console.error('Greška pri registraciji:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Korisnik sa ovom email adresom već postoji.'
      });
    }

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];

      return res.status(400).json({
        success: false,
        message: firstError?.message || 'Podaci nisu ispravni.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Došlo je do greške prilikom registracije.'
    });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Unesi email i lozinku.'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ili lozinka nisu ispravni.'
      });
    }

    const correctPassword = await user.comparePassword(password);

    if (!correctPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ili lozinka nisu ispravni.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Uspešno ste se prijavili.',
      user: createSafeUser(user)
    });
  } catch (error) {
    console.error('Greška pri prijavi:', error);

    return res.status(500).json({
      success: false,
      message: 'Došlo je do greške prilikom prijave.'
    });
  }
}

module.exports = {
  register,
  login
};
