const db = require("../config/db");
const Joi = require('@hapi/joi');

const layerList = Joi.string()

const schema = Joi.object().keys({
    type : Joi.string().required(),
    layer_list : Joi.array().items(layerList)
})

function model() {
    return db.getDB().collection("business_type")
}

module.exports = {
    schema,
    model,
    Joi
}