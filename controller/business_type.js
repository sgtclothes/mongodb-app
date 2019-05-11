const Joi = require('@hapi/joi');
const db = require("../config/db");

const businessTypeSchema = Joi.object().keys({
    type : Joi.string().required()
})

function get (req,res) {
    // get all documents within our collection
    // send back to user as json
    db.getDB().collection("business_type").find({}).toArray((err,results)=>{
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
    db.getDB().collection("business_type").findOne({'_id': db.getPrimaryKey(id)}, (err, result) => {
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

    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within collection
    Joi.validate(userInput, businessTypeSchema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection("business_type").insertOne(userInput,(err,result)=>{
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
    // Find Document By ID and Update
    db.getDB().collection("business_type").findOneAndUpdate({_id : db.getPrimaryKey(id)},{$set : userInput},{returnOriginal : false},(err,result)=>{
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
    db.getDB().collection("business_type").findOneAndDelete({_id : db.getPrimaryKey(id)},(err,result)=>{
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