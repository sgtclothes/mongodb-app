const express = require('express');
const router = express.Router();

var { get, create, patch, remove } = require('../controller/customer_subscription');



router.get('/\*', get);
router.post('/', create);
router.patch('/:id', patch);

module.exports = router;