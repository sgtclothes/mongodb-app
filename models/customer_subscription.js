const Joi = require("@hapi/joi");
const assert = require("assert");
const db = require("../config/db");

const package = Joi.object().keys({
  ref_packages: Joi.string()
});

const customerSubscriptionSchema = Joi.object().keys({
  business_type_id: Joi.string().required(),
  package: package,
  customer_id: Joi.string().required(),
  periode: Joi.string(),
  unit: Joi.string(),
  value: Joi.number().integer()
});

function model() {
  return db.getDB().collection("customer_subscription");
}

module.exports = {
  Joi,
  assert,
  customerSubscriptionSchema,
  model
};
