const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');

const router = express.Router();

function serializePayment(payment) {
  return {
    id: payment._id,
    paypalOrderId: payment.paypalOrderId,
    paypalCaptureId: payment.paypalCaptureId,
    status: payment.status,
    currency: payment.currency,
    amount: payment.amount,
    payer: payment.payer,
    applicationUser: payment.applicationUser,
    items: payment.items,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
}

function buildUserQuery(userId, email) {
  const conditions = [];

  if (userId) {
    conditions.push({
      'applicationUser.userId': userId
    });
  }

  if (email) {
    conditions.push({
      'applicationUser.email': email
    });
  }

  if (!conditions.length) {
    return null;
  }

  return conditions.length === 1
    ? conditions[0]
    : {
        $or: conditions
      };
}

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const email = String(req.query.email || '')
      .trim()
      .toLowerCase();

    const query = buildUserQuery(userId, email);

    if (!query) {
      return res.status(400).json({
        message: 'ID korisnika ili email nisu prosleđeni.'
      });
    }

    const payments = await Payment.find(query)
      .sort({
        createdAt: -1
      });

    return res.status(200).json({
      count: payments.length,
      payments: payments.map(serializePayment)
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju istorije kupovina:',
      error
    );

    return res.status(500).json({
      message: 'Istorija kupovina nije mogla da se učita.'
    });
  }
});

router.get('/:paymentId', async (req, res) => {
  try {
    const paymentId = String(req.params.paymentId || '').trim();

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        message: 'ID plaćanja nije ispravan.'
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: 'Plaćanje nije pronađeno.'
      });
    }

    return res.status(200).json({
      payment: serializePayment(payment)
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju plaćanja:',
      error
    );

    return res.status(500).json({
      message: 'Plaćanje nije moglo da se učita.'
    });
  }
});

module.exports = router;
