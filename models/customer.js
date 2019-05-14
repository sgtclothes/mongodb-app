const db = require("../config/db");
const Joi = require('@hapi/joi');

const schema = Joi.object().keys({
    customer_type : Joi.string().required(),
    customer_id : Joi.string().required(),
    id_type : Joi.string().required(),
    name : Joi.string()
});

function model() {
    return db.getDB().collection("customer")
}

module.exports = {
    schema,
    model,
    Joi
}