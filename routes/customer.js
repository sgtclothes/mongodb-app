const express = require('express');
const router = express.Router();

var { get, getId, create, patch, remove } = require('../controller/customer');

router.get('/', get);
router.get('/:id', getId);
router.post('/', create);
router.patch('/:id', patch);
router.delete('/:id', remove);

module.exports = router;