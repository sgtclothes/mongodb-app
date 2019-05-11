const Joi = require('@hapi/joi');
const assert = require('assert');
const db = require("../config/db");

const accessListObj = Joi.object().keys({
    access_id : Joi.string().required(),
    value: Joi.number().integer(),
    uom : Joi.string()
})

const Schema = Joi.object().keys({
   name: Joi.string().required(),
   price : Joi.number().integer(),
   access_list :Joi.array().items(accessListObj)
})

function get (req,res) {
    // get all documents within our collection
    // send back to user as json
    db.getDB().collection("subs_package").find({}).toArray((err,results)=>{
        if (err) {
            res.status(400).send({'error': err})
        }
        if (results === undefined || results.length === 0) {
            res.status(400).send({'error':'No documents in database'})
        } else {
            res.status(200).send(results)
        }
    })
};

function getId (req, res) {
    let id = req.params.id
    db.getDB().collection("subs_package").findOne({'_id': db.getPrimaryKey(id)}, (err, result) => {
        if (err) {
            res.status(400).send({'error': err})
        }
        if (result === undefined) {
            res.status(400).send({'error':'No documents in database'})
        } else {
            res.status(200).send(result)
        }
    })
}

function create (req,res,next) {
    // Document to be inserted
    const userInput = req.body;
    var newUserInput = Object.assign({},userInput)
    for (let i = 0; i < userInput.access_list.length; i++) {
        newUserInput.access_list[i].access_id = db.getPrimaryKey(userInput.access_list[i].access_id);
    }
    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within collection
    Joi.validate(userInput, Schema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection("subs_package").insertOne(newUserInput,(err,result)=>{
                if(err){
                    const error = new Error("Failed to insert Document");
                    error.status = 400;
                    next(error);
                }
                else
                    res.status(200).send({result : result, document : result.ops[0], msg : "Successfully inserted Data!!!",error : null});
            });
        }
    })    
};

function patch (req,res) {
    // Primary Key of Document we wish to update
    const id = req.params.id;
    // Document used to update
    const userInput = req.body;
    var newUserInput = Object.assign({},userInput)
    if (userInput.access_list.length > 0) {
        for (let i = 0; i < userInput.access_list.length; i++) {
            if (userInput.access_list[i].access_id !== undefined) {
                newUserInput.access_list[i].access_id = db.getPrimaryKey(userInput.access_list[i].access_id);
            }
        }
    }
    // Find Document By ID and Update
    db.getDB().collection("subs_package").findOneAndUpdate({_id : db.getPrimaryKey(id)},{$set : newUserInput},{returnOriginal : false},(err,result)=>{
        if (err) {
            res.status(400).send({'error': err})
        }
        else{
            res.status(200).send(result);
        }      
    });
};

//delete (customer collection)
function remove (req,res) {
    // Primary Key of Document
    const id = req.params.id;
    // Find Document By ID and delete document from record
    db.getDB().collection("subs_package").findOneAndDelete({_id : db.getPrimaryKey(id)},(err,result)=>{
        if (err) {
            res.status(400).send({'error': err})
        }
        else{
            res.status(200).send(result);
        } 
    });
};

module.exports = {
    get,
    getId,
    create,
    patch,
    remove
}