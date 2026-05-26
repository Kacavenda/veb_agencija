const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

function createBasicEstimate(packageName) {
  const normalized = packageName.toLowerCase();

  if (normalized.includes('premium')) {
    return { priceFrom: 700, priceTo: 1200, estimatedDays: 18, note: 'Napredan paket sa custom animacijama i pripremom dashboard funkcija.' };
  }

  if (normalized.includes('pro')) {
    return { priceFrom: 500, priceTo: 700, estimatedDays: 10, note: 'Najbolji odnos obima, dizajna i roka izrade.' };
  }

  return { priceFrom: 300, priceTo: 450, estimatedDays: 7, note: 'Osnovni paket za jednostavan poslovni web sajt.' };
}

router.post('/', async (req, res) => {
  try {
    const { packageName, clientName, email } = req.body;

    if (!packageName || !clientName || !email) {
      return res.status(400).json({ success: false, message: 'Paket, ime klijenta i email su obavezni.' });
    }

    const activeProjects = await Order.countDocuments({ status: 'active' });
    const queuedProjects = await Order.countDocuments({ status: 'queued' });
    const isQueued = activeProjects >= 2;

    const order = await Order.create({
      packageName,
      clientName,
      email,
      status: isQueued ? 'queued' : 'documentation_sent',
      aiEstimate: createBasicEstimate(packageName),
      queuePosition: isQueued ? queuedProjects + 1 : 0
    });

    return res.status(201).json({
      success: true,
      message: isQueued
        ? 'Trenutno postoje dva aktivna projekta. Klijent je dodat u red čekanja.'
        : 'Narudžbina je sačuvana. Sledeći korak je slanje dokumentacije klijentu.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Greška na serveru.', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Greška na serveru.', error: error.message });
  }
});

module.exports = router;
