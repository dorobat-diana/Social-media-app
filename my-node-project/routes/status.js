// routes/status.js

import express from 'express';

const router = express.Router();

// Route to check server status
router.get('/', (_req, res) => {
  res.json({ status: 'Server is up and running!' });
});

export default router;
