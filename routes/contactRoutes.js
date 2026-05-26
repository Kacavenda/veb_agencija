const express = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, websiteType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Ime, email i poruka su obavezni.' });
    }

    const savedMessage = await ContactMessage.create({ name, email, websiteType, message });

    return res.status(201).json({
      success: true,
      message: 'Poruka je uspešno poslata.',
      data: savedMessage
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Greška na serveru.', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Greška na serveru.', error: error.message });
  }
});

module.exports = router;
