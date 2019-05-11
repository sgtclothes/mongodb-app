const Joi = require('@hapi/joi');
const assert = require('assert');
const db = require("../config/db");

const customerSchema = Joi.object().keys({
    customer_type : Joi.string().required(),
    customer_id : Joi.string().required(),
    id_type : Joi.string().required(),
    name : Joi.string()
});

function get (req,res) {
    // get all documents within our collection
    // send back to user as json
    db.getDB().collection("customer").aggregate(
        [ { "$lookup": 
              {
                  "from": "customer_subscription",
                  "localField" : "_id",
                  "foreignField": "customer_id",
                  "as": "subscriptions"
              }
          },
          { "$project": { "subscriptions._id" : 0 } }
        ],
        (err, cursor) => {
          assert.equal(err, null);
  
          cursor.toArray(function(err, results) {
            if (err) {
                res.status(400).send({'error': err})
            }
            if (results === undefined || results.length === 0) {
                res.status(400).send({'error':'No documents in database'})
            } else {
                res.status(200).send(results)
            }
          });
        }
    );
};

function getId (req, res) {
    let id = req.params.id
    db.getDB().collection("customer").aggregate(
        [ { "$lookup": 
              {
                  "from": "customer_subscription",
                  "localField" : "_id",
                  "foreignField": "customer_id",
                  "as": "subscriptions"
              }
          },
          { "$match" : 
              { 
                  "_id" : db.getPrimaryKey(id)
              } 
          },
          { "$project": { "subscriptions._id" : 0 } }
        ],
        (err, cursor) => {
          assert.equal(err, null);
  
          cursor.toArray(function(err, result) {
            if (err) {
                res.status(400).send({'error': err})
            }
            if (result === undefined) {
                res.status(400).send({'error':'No documents in database'})
            } else {
                res.status(200).send(result)
            }
          });
        }
    );
}

function create (req,res,next) {
    // Document to be inserted
    const userInput = req.body;
    
    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within collection
    Joi.validate(userInput, customerSchema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection("customer").insertOne(userInput,(err,result)=>{
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
    db.getDB().collection("customer").findOneAndUpdate({_id : db.getPrimaryKey(id)},{$set : userInput},{returnOriginal : false},(err,result)=>{
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
    db.getDB().collection("customer").findOneAndDelete({_id : db.getPrimaryKey(id)},(err,result)=>{
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