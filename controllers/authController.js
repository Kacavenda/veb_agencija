const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizeText(
  value,
  maxLength
) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}

function createSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    companyName: user.companyName || '',
    phone: user.phone || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function passwordIsValid(password) {
  const hasLetter =
    /[A-Za-zČĆŽŠĐčćžšđ]/.test(
      password
    );

  const hasNumber =
    /\d/.test(password);

  return (
    password.length >= 8 &&
    hasLetter &&
    hasNumber
  );
}

async function findRequestUser(
  req,
  {
    includePassword = false
  } = {}
) {
  const userId = String(
    req.body?.userId ||
    req.query?.userId ||
    req.headers['x-user-id'] ||
    ''
  ).trim();

  const email = normalizeEmail(
    req.body?.currentEmail ||
    req.body?.userEmail ||
    req.query?.email ||
    req.headers['x-user-email'] ||
    ''
  );

  const conditions = [];

  if (
    mongoose.isValidObjectId(
      userId
    )
  ) {
    conditions.push({
      _id: userId
    });
  }

  if (email) {
    conditions.push({
      email
    });
  }

  if (!conditions.length) {
    return null;
  }

  let query = User.findOne({
    $or: conditions
  });

  if (includePassword) {
    query = query.select(
      '+password'
    );
  }

  return query;
}

async function register(req, res) {
  try {
    const name =
      normalizeText(
        req.body.name,
        80
      );

    const email =
      normalizeEmail(
        req.body.email
      );

    const password =
      String(
        req.body.password ||
        ''
      );

    const confirmPassword =
      String(
        req.body.confirmPassword ||
        ''
      );

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Popuni sva obavezna polja.'
      });
    }

    if (
      password !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Lozinke se ne poklapaju.'
      });
    }

    if (
      !passwordIsValid(
        password
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Lozinka mora imati najmanje 8 karaktera, jedno slovo i jedan broj.'
      });
    }

    const existingUser =
      await User.findOne({
        email
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'Korisnik sa ovom email adresom već postoji.'
      });
    }

    const user =
      await User.create({
        name,
        email,
        password,
        role: 'user'
      });

    return res.status(201).json({
      success: true,
      message:
        'Nalog je uspešno kreiran.',
      user:
        createSafeUser(user)
    });
  } catch (error) {
    console.error(
      'Greška pri registraciji:',
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'Korisnik sa ovom email adresom već postoji.'
      });
    }

    if (
      error.name ===
      'ValidationError'
    ) {
      const firstError =
        Object.values(
          error.errors
        )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          'Podaci nisu ispravni.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Došlo je do greške prilikom registracije.'
    });
  }
}

async function login(req, res) {
  try {
    const email =
      normalizeEmail(
        req.body.email
      );

    const password =
      String(
        req.body.password ||
        ''
      );

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Unesi email i lozinku.'
      });
    }

    const user =
      await User.findOne({
        email
      }).select(
        '+password'
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Email ili lozinka nisu ispravni.'
      });
    }

    const correctPassword =
      await user.comparePassword(
        password
      );

    if (!correctPassword) {
      return res.status(401).json({
        success: false,
        message:
          'Email ili lozinka nisu ispravni.'
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Uspešno ste se prijavili.',
      user:
        createSafeUser(user)
    });
  } catch (error) {
    console.error(
      'Greška pri prijavi:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Došlo je do greške prilikom prijave.'
    });
  }
}

async function getProfile(req, res) {
  try {
    const user =
      await findRequestUser(req);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'Korisnički nalog nije pronađen.'
      });
    }

    return res.status(200).json({
      success: true,
      user:
        createSafeUser(user)
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju profila:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Profil nije mogao da se učita.'
    });
  }
}

async function updateProfile(
  req,
  res
) {
  try {
    const user =
      await findRequestUser(req);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'Korisnički nalog nije pronađen.'
      });
    }

    const name =
      normalizeText(
        req.body.name,
        80
      );

    const email =
      normalizeEmail(
        req.body.email
      );

    const companyName =
      normalizeText(
        req.body.companyName,
        120
      );

    const phone =
      normalizeText(
        req.body.phone,
        40
      );

    if (
      !name ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Ime i email su obavezni.'
      });
    }

    if (
      name.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Ime mora imati najmanje 2 karaktera.'
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email adresa nije ispravna.'
      });
    }

    if (
      phone &&
      !/^[0-9+\s()/-]+$/.test(
        phone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Broj telefona sadrži nedozvoljene karaktere.'
      });
    }

    const emailOwner =
      await User.findOne({
        email,
        _id: {
          $ne: user._id
        }
      });

    if (emailOwner) {
      return res.status(409).json({
        success: false,
        message:
          'Drugi nalog već koristi ovu email adresu.'
      });
    }

    user.name = name;
    user.email = email;
    user.companyName =
      companyName;
    user.phone = phone;

    await user.save();

    await Project.updateMany(
      {
        userId:
          String(user._id)
      },
      {
        $set: {
          userName:
            user.name,
          userEmail:
            user.email
        }
      }
    );

    return res.status(200).json({
      success: true,
      message:
        'Profil je uspešno sačuvan.',
      user:
        createSafeUser(user)
    });
  } catch (error) {
    console.error(
      'Greška pri čuvanju profila:',
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'Drugi nalog već koristi ovu email adresu.'
      });
    }

    if (
      error.name ===
      'ValidationError'
    ) {
      const firstError =
        Object.values(
          error.errors
        )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          'Podaci profila nisu ispravni.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Profil nije mogao da se sačuva.'
    });
  }
}

async function changePassword(
  req,
  res
) {
  try {
    const user =
      await findRequestUser(
        req,
        {
          includePassword:
            true
        }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'Korisnički nalog nije pronađen.'
      });
    }

    const currentPassword =
      String(
        req.body.currentPassword ||
        ''
      );

    const newPassword =
      String(
        req.body.newPassword ||
        ''
      );

    const confirmPassword =
      String(
        req.body.confirmPassword ||
        ''
      );

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Popuni sva polja za promenu lozinke.'
      });
    }

    const correctPassword =
      await user.comparePassword(
        currentPassword
      );

    if (!correctPassword) {
      return res.status(401).json({
        success: false,
        message:
          'Trenutna lozinka nije ispravna.'
      });
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Nove lozinke se ne poklapaju.'
      });
    }

    if (
      !passwordIsValid(
        newPassword
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Nova lozinka mora imati najmanje 8 karaktera, jedno slovo i jedan broj.'
      });
    }

    const samePassword =
      await user.comparePassword(
        newPassword
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          'Nova lozinka mora biti drugačija od trenutne.'
      });
    }

    user.password =
      newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Lozinka je uspešno promenjena.'
    });
  } catch (error) {
    console.error(
      'Greška pri promeni lozinke:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Lozinka nije mogla da se promeni.'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
