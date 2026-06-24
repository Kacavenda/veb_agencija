const dns = require('node:dns');
const path = require('path');

dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const contactRoutes = require('./routes/contactRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const paypalRoutes = require('./routes/paypalRoutes');
const projectRoutes = require('./routes/projectRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME ||
  'veb_agencija';

const requiredEnvironmentVariables = [
  'MONGODB_URI',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET'
];

const missingEnvironmentVariables =
  requiredEnvironmentVariables.filter(
    (variableName) =>
      !process.env[variableName]
  );

if (
  missingEnvironmentVariables.length >
  0
) {
  console.error(
    `Nedostaju promenljive u .env fajlu: ${missingEnvironmentVariables.join(
      ', '
    )}`
  );

  process.exit(1);
}

app.use(
  cors({
    origin: true
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  express.static(
    path.join(
      __dirname,
      'public'
    )
  )
);

app.use(
  '/api/contact',
  contactRoutes
);

app.use(
  '/api/orders',
  orderRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/paypal',
  paypalRoutes
);

app.use(
  '/api/projects',
  projectRoutes
);

app.use(
  '/api/payments',
  paymentRoutes
);

app.use(
  '/api/admin',
  adminRoutes
);

app.get(
  '/api/health',
  (req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'Server radi.',
      mongoDatabase:
        mongoose.connection.name ||
        MONGODB_DB_NAME,
      paypalEnvironment:
        process.env.PAYPAL_ENV ===
        'live'
          ? 'live'
          : 'sandbox'
    });
  }
);

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      message:
        'API ruta nije pronađena.'
    });
  }
);

app.get(
  '*',
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        'public',
        'index.html'
      )
    );
  }
);

mongoose
  .connect(
    MONGODB_URI,
    {
      serverSelectionTimeoutMS:
        10000,
      dbName:
        MONGODB_DB_NAME
    }
  )
  .then(() => {
    console.log(
      'MongoDB konekcija uspešna.'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server pokrenut na http://localhost:${PORT}`
        );

        console.log(
          `MongoDB baza: ${mongoose.connection.name}`
        );

        if (
          mongoose.connection.name !==
          MONGODB_DB_NAME
        ) {
          console.warn(
            `Upozorenje: očekivana baza je ${MONGODB_DB_NAME}, a povezana je ${mongoose.connection.name}.`
          );
        }

        console.log(
          `PayPal okruženje: ${
            process.env
              .PAYPAL_ENV ===
            'live'
              ? 'LIVE'
              : 'SANDBOX'
          }`
        );
      }
    );
  })
  .catch((error) => {
    console.error(
      'Greška pri povezivanju sa MongoDB:',
      error.message
    );

    process.exit(1);
  });
