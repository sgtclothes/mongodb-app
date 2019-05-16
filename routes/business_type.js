const express = require("express");
const router = express.Router();

var { get, getId, create, patch } = require("../controller/business_type");

router.get("/", get);
router.get("/:id", getId);
router.post("/", create);
router.patch("/:id", patch);

module.exports = router;
