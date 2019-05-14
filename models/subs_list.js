const db = require("../config/db");
const Joi = require('@hapi/joi');

const ratioObj = Joi.object().keys({
    base : Joi.number().integer().required(),
    value : Joi.number().integer(),
    unit : Joi.number().integer(),
    max_price : Joi.number().integer(),
    price : Joi.number().integer(),
    uom : Joi.string()
})

const schema = Joi.object().keys({
    access_name : Joi.string().required(),
    ratio : ratioObj
})

function model() {
    return db.getDB().collection("subs_list")
}

module.exports = {
    schema,
    model,
    Joi
}