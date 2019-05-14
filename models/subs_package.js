const db = require("../config/db");
const Joi = require('@hapi/joi');

const accessListObj = Joi.object().keys({
    access_id : Joi.string().alphanum().max(50).required(),
    value: Joi.number().integer(),
    uom : Joi.string()
})

const schema = Joi.object().keys({
   name: Joi.string().required(),
   price : Joi.number().integer(),
   access_list :Joi.array().items(accessListObj)
})

function model() {
    return db.getDB().collection("subs_package")
}

module.exports = {
    schema,
    model,
    Joi
}