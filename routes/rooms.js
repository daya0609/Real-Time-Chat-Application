const express = require('express');
const router = express.Router();

// Example static room list
const rooms = ['General', 'Sports', 'Tech', 'Random'];

router.get('/', (req, res) => {
  res.json(rooms);
});

module.exports = router;
