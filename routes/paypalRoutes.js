const express = require('express');
const Payment = require('../models/Payment');
const Project = require('../models/Project');

const router = express.Router();

const PAYPAL_CURRENCY = 'EUR';

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PACKAGE_CATALOG = {
  basic: {
    name: 'Basic paket',
    basePrice: 300,
    options: {
      pages: {
        label: 'Broj stranica',
        base: 3,
        min: 3,
        max: 5,
        unitPrice: 60
      },
      forms: {
        label: 'Kontakt forme',
        base: 1,
        min: 1,
        max: 3,
        unitPrice: 30
      },
      revisions: {
        label: 'Krugovi revizija',
        base: 1,
        min: 1,
        max: 3,
        unitPrice: 25
      }
    }
  },

  pro: {
    name: 'Pro paket',
    basePrice: 500,
    options: {
      pages: {
        label: 'Broj stranica',
        base: 5,
        min: 5,
        max: 8,
        unitPrice: 70
      },
      animations: {
        label: 'Animirane sekcije',
        base: 2,
        min: 2,
        max: 6,
        unitPrice: 40
      },
      revisions: {
        label: 'Krugovi revizija',
        base: 2,
        min: 2,
        max: 5,
        unitPrice: 35
      }
    }
  },

  premium: {
    name: 'Premium paket',
    basePrice: 800,
    options: {
      pages: {
        label: 'Broj stranica',
        base: 8,
        min: 8,
        max: 12,
        unitPrice: 90
      },
      scenes: {
        label: 'Cinematic scene',
        base: 3,
        min: 3,
        max: 8,
        unitPrice: 75
      },
      integrations: {
        label: 'Napredne integracije',
        base: 2,
        min: 2,
        max: 6,
        unitPrice: 80
      }
    }
  }
};

const COMMON_REQUIREMENTS = [
  {
    key: 'business-information',
    label: 'Osnovne informacije o firmi',
    required: true,
    provided: false,
    value: ''
  },
  {
    key: 'logo',
    label: 'Logo ili naziv brenda',
    required: true,
    provided: false,
    value: ''
  },
  {
    key: 'page-content',
    label: 'Tekstovi za stranice',
    required: true,
    provided: false,
    value: ''
  },
  {
    key: 'photos',
    label: 'Fotografije i vizuelni materijal',
    required: true,
    provided: false,
    value: ''
  },
  {
    key: 'contact-information',
    label: 'Kontakt podaci i društvene mreže',
    required: true,
    provided: false,
    value: ''
  },
  {
    key: 'brand-colors',
    label: 'Boje i vizuelni pravac',
    required: false,
    provided: false,
    value: ''
  },
  {
    key: 'references',
    label: 'Primeri i reference sajtova',
    required: false,
    provided: false,
    value: ''
  }
];

function requirePayPalConfig() {
  if (
    !process.env.PAYPAL_CLIENT_ID ||
    !process.env.PAYPAL_CLIENT_SECRET
  ) {
    const error = new Error(
      'PAYPAL_CLIENT_ID ili PAYPAL_CLIENT_SECRET nisu definisani u .env fajlu.'
    );

    error.statusCode = 500;
    throw error;
  }
}

async function getPayPalAccessToken() {
  requirePayPalConfig();

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    const error = new Error(
      data.error_description ||
        data.message ||
        'PayPal autentifikacija nije uspela.'
    );

    error.statusCode = response.status || 500;
    throw error;
  }

  return data.access_token;
}

function normalizeOptionValues(item) {
  const result = {};

  if (!Array.isArray(item.options)) {
    return result;
  }

  item.options.forEach((option) => {
    if (
      !option ||
      typeof option.key !== 'string'
    ) {
      return;
    }

    result[option.key] = Number(option.value);
  });

  return result;
}

function calculateCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    const error = new Error('Korpa je prazna.');

    error.statusCode = 400;
    throw error;
  }

  const items = cart.map((cartItem) => {
    const packageId = String(
      cartItem.id || ''
    ).toLowerCase();

    const catalogItem = PACKAGE_CATALOG[packageId];

    if (!catalogItem) {
      const error = new Error(
        `Nepoznat paket: ${packageId || 'bez ID-a'}.`
      );

      error.statusCode = 400;
      throw error;
    }

    const quantity = Math.min(
      10,
      Math.max(
        1,
        Number(cartItem.quantity) || 1
      )
    );

    const incomingValues =
      normalizeOptionValues(cartItem);

    const calculatedOptions = [];

    let extrasTotal = 0;

    Object.entries(
      catalogItem.options
    ).forEach(([key, definition]) => {
      const requestedValue = Number(
        incomingValues[key]
      );

      const value = Number.isFinite(requestedValue)
        ? Math.min(
            definition.max,
            Math.max(
              definition.min,
              requestedValue
            )
          )
        : definition.base;

      const extraQuantity = Math.max(
        0,
        value - definition.base
      );

      const extraTotal =
        extraQuantity * definition.unitPrice;

      extrasTotal += extraTotal;

      calculatedOptions.push({
        key,
        label: definition.label,
        value,
        baseValue: definition.base,
        extraQuantity,
        unitPrice: definition.unitPrice,
        extraTotal
      });
    });

    const unitPrice =
      catalogItem.basePrice + extrasTotal;

    const subtotal =
      unitPrice * quantity;

    return {
      packageId,
      packageName: catalogItem.name,
      quantity,
      basePrice: catalogItem.basePrice,
      extrasTotal,
      unitPrice,
      subtotal,
      options: calculatedOptions
    };
  });

  const total = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  return {
    currency: PAYPAL_CURRENCY,
    items,
    total
  };
}

function buildPayPalItems(calculation) {
  return calculation.items.map((item) => {
    const changedOptions = item.options
      .filter(
        (option) =>
          option.extraQuantity > 0
      )
      .map(
        (option) =>
          `${option.label}: ${option.value}`
      )
      .join(', ');

    return {
      name: item.packageName.slice(0, 127),
      sku: item.packageId,
      description: (
        changedOptions ||
        'Osnovna konfiguracija'
      ).slice(0, 127),
      quantity: String(item.quantity),
      unit_amount: {
        currency_code:
          calculation.currency,
        value:
          item.unitPrice.toFixed(2)
      },
      category: 'DIGITAL_GOODS'
    };
  });
}

function createProjectCode(
  payment,
  packageId,
  unitIndex
) {
  const paymentPart = String(
    payment._id
  )
    .slice(-6)
    .toUpperCase();

  return `CA-${paymentPart}-${packageId.toUpperCase()}-${unitIndex}`;
}

function serializeProject(project) {
  return {
    id: project._id,
    projectCode: project.projectCode,
    packageId: project.packageId,
    packageName: project.packageName,
    status: project.status,
    paymentStatus: project.paymentStatus,
    currency: project.currency,
    totalPrice: project.totalPrice,
    configuration: project.configuration,
    requirements: project.requirements,
    unitIndex: project.unitIndex,
    totalUnitsInPurchase:
      project.totalUnitsInPurchase,
    createdAt: project.createdAt
  };
}

async function createProjectsForPayment(
  payment,
  calculation,
  applicationUser
) {
  const operations = [];

  calculation.items.forEach((item) => {
    for (
      let unitIndex = 1;
      unitIndex <= item.quantity;
      unitIndex += 1
    ) {
      const projectCode =
        createProjectCode(
          payment,
          item.packageId,
          unitIndex
        );

      operations.push({
        updateOne: {
          filter: {
            payment: payment._id,
            packageId: item.packageId,
            unitIndex
          },

          update: {
            $setOnInsert: {
              projectCode,

              userId: String(
                applicationUser.id || ''
              ),

              userName: String(
                applicationUser.name || ''
              ),

              userEmail: String(
                applicationUser.email || ''
              )
                .trim()
                .toLowerCase(),

              payment: payment._id,

              paypalOrderId:
                payment.paypalOrderId,

              packageId:
                item.packageId,

              packageName:
                item.packageName,

              unitIndex,

              totalUnitsInPurchase:
                item.quantity,

              status: 'new',

              paymentStatus:
                payment.status,

              currency:
                payment.currency,

              totalPrice:
                item.unitPrice,

              configuration:
                item.options,

              requirements:
                COMMON_REQUIREMENTS,

              clientNote: '',

              adminNote: ''
            }
          },

          upsert: true
        }
      });
    }
  });

  if (operations.length > 0) {
    await Project.bulkWrite(
      operations,
      {
        ordered: false
      }
    );
  }

  return Project.find({
    payment: payment._id
  }).sort({
    packageId: 1,
    unitIndex: 1
  });
}

router.get('/config', (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return res.status(500).json({
      message:
        'PAYPAL_CLIENT_ID nije definisan u .env fajlu.'
    });
  }

  return res.status(200).json({
    clientId:
      process.env.PAYPAL_CLIENT_ID,

    currency:
      PAYPAL_CURRENCY,

    environment:
      process.env.PAYPAL_ENV === 'live'
        ? 'live'
        : 'sandbox'
  });
});

router.post('/orders', async (req, res) => {
  try {
    const calculation = calculateCart(
      req.body.cart
    );

    const accessToken =
      await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json',

          'PayPal-Request-Id':
            `cinematic-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`
        },

        body: JSON.stringify({
          intent: 'CAPTURE',

          purchase_units: [
            {
              reference_id:
                'CINEMATIC_CART',

              description:
                'Cinematic Agency web paketi',

              amount: {
                currency_code:
                  calculation.currency,

                value:
                  calculation.total.toFixed(
                    2
                  ),

                breakdown: {
                  item_total: {
                    currency_code:
                      calculation.currency,

                    value:
                      calculation.total.toFixed(
                        2
                      )
                  }
                }
              },

              items:
                buildPayPalItems(
                  calculation
                )
            }
          ],

          application_context: {
            brand_name:
              'Cinematic Agency',

            shipping_preference:
              'NO_SHIPPING',

            user_action:
              'PAY_NOW'
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.id) {
      return res
        .status(response.status || 500)
        .json({
          message:
            data.message ||
            data.details?.[0]
              ?.description ||
            'PayPal porudžbina nije kreirana.',

          paypalError: data
        });
    }

    return res.status(201).json({
      id: data.id
    });
  } catch (error) {
    console.error(
      'PayPal create order greška:',
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        message:
          error.message ||
          'Greška prilikom kreiranja PayPal porudžbine.'
      });
  }
});

router.post(
  '/orders/:orderId/capture',
  async (req, res) => {
    try {
      const orderId = String(
        req.params.orderId || ''
      ).trim();

      if (!orderId) {
        return res.status(400).json({
          message:
            'PayPal Order ID nije prosleđen.'
        });
      }

      const calculation = calculateCart(
        req.body.cart
      );

      const applicationUser =
        req.body.user || {};

      /*
        Ako je capture već uspešno obrađen,
        ne pokušavamo ponovo da naplatimo.
      */
      const existingPayment =
        await Payment.findOne({
          paypalOrderId: orderId
        });

      if (
        existingPayment &&
        existingPayment.status ===
          'COMPLETED'
      ) {
        const projects =
          await createProjectsForPayment(
            existingPayment,
            calculation,
            applicationUser
          );

        return res.status(200).json({
          message:
            'PayPal plaćanje je već bilo uspešno završeno.',

          paymentId:
            existingPayment._id,

          status:
            existingPayment.status,

          amount:
            existingPayment.amount,

          currency:
            existingPayment.currency,

          paypalOrderId:
            existingPayment.paypalOrderId,

          paypalCaptureId:
            existingPayment.paypalCaptureId,

          projects:
            projects.map(
              serializeProject
            )
        });
      }

      const accessToken =
        await getPayPalAccessToken();

      const response = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(
          orderId
        )}/capture`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            'Content-Type':
              'application/json',

            'PayPal-Request-Id':
              `capture-${orderId}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res
          .status(response.status || 500)
          .json({
            message:
              data.message ||
              data.details?.[0]
                ?.description ||
              'PayPal plaćanje nije potvrđeno.',

            paypalError: data
          });
      }

      const capture =
        data.purchase_units?.[0]
          ?.payments?.captures?.[0] ||
        null;

      const capturedAmount = Number(
        capture?.amount?.value || 0
      );

      const expectedAmount = Number(
        calculation.total.toFixed(2)
      );

      if (
        Math.abs(
          capturedAmount -
            expectedAmount
        ) > 0.01
      ) {
        return res.status(409).json({
          message:
            'Plaćeni iznos se ne poklapa sa trenutno izračunatom vrednošću korpe.'
        });
      }

      const payerName = [
        data.payer?.name
          ?.given_name,
        data.payer?.name
          ?.surname
      ]
        .filter(Boolean)
        .join(' ');

      const payment =
        await Payment.findOneAndUpdate(
          {
            paypalOrderId:
              orderId
          },

          {
            paypalOrderId:
              orderId,

            paypalCaptureId:
              capture?.id || null,

            status:
              data.status ||
              capture?.status ||
              'COMPLETED',

            currency:
              capture?.amount
                ?.currency_code ||
              calculation.currency,

            amount:
              capturedAmount,

            payer: {
              email:
                data.payer
                  ?.email_address ||
                '',

              payerId:
                data.payer
                  ?.payer_id ||
                '',

              fullName:
                payerName
            },

            applicationUser: {
              userId: String(
                applicationUser.id ||
                  ''
              ),

              name: String(
                applicationUser.name ||
                  ''
              ),

              email: String(
                applicationUser.email ||
                  ''
              )
            },

            items:
              calculation.items,

            paypalResponse:
              data
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

      let projects = [];
      let projectWarning = '';

      try {
        projects =
          await createProjectsForPayment(
            payment,
            calculation,
            applicationUser
          );
      } catch (projectError) {
        console.error(
          'Plaćanje je sačuvano, ali projekti nisu automatski kreirani:',
          projectError
        );

        projectWarning =
          'Plaćanje je uspešno sačuvano, ali projekti nisu automatski kreirani.';
      }

      return res.status(200).json({
        message:
          'PayPal plaćanje je uspešno završeno.',

        paymentId:
          payment._id,

        status:
          payment.status,

        amount:
          payment.amount,

        currency:
          payment.currency,

        paypalOrderId:
          payment.paypalOrderId,

        paypalCaptureId:
          payment.paypalCaptureId,

        projects:
          projects.map(
            serializeProject
          ),

        projectWarning
      });
    } catch (error) {
      console.error(
        'PayPal capture greška:',
        error
      );

      return res
        .status(error.statusCode || 500)
        .json({
          message:
            error.message ||
            'Greška prilikom potvrde PayPal plaćanja.'
        });
    }
  }
);

module.exports = router;
