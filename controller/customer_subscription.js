const Joi = require('@hapi/joi');
const assert = require('assert');
const db = require("../config/db");

const package = Joi.object().keys({
    ref_packages : Joi.string()
})

const customerSubscriptionSchema = Joi.object().keys({
    business_type_id : Joi.string().required(),
    package : package,
    customer_id : Joi.string().required(),
    periode : Joi.string(),
    unit: Joi.string(),
    value : Joi.number().integer()
});

function get (req,res) {
    // get all documents within our collection
    // send back to user as json
    db.getDB().collection("customer_subscription").aggregate(
        [ { "$lookup": 
              {
                  "from": "subs_package",
                  "localField" : "package.ref_packages",
                  "foreignField": "_id",
                  "as": "package.packages"
              }
          },
          {
              "$project": { "package.packages._id" : 0 }
          }
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
    db.getDB().collection("customer_subscription").aggregate(
        [ { "$lookup": 
                {
                    "from": "subs_package",
                    "localField" : "package.ref_packages",
                    "foreignField": "_id",
                    "as": "package.packages"
                }
          },
          {
              "$project": { "package.packages._id" : 0 }
          },
          {
              "$match" : { "_id" : db.getPrimaryKey(id) } 
          }
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
    var newUserInput = Object.assign({},userInput)
    newUserInput.business_type_id = db.getPrimaryKey(userInput.business_type_id)
    newUserInput.customer_id = db.getPrimaryKey(userInput.customer_id)
    newUserInput.package.ref_packages = db.getPrimaryKey(userInput.package.ref_packages)
    // Validate document
    // If document is invalid pass to error middleware
    // else insert document within collection
    Joi.validate(userInput, customerSubscriptionSchema,(err,result)=>{
        if(err){
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection("customer_subscription").insertOne(newUserInput,(err,result)=>{
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
    if (userInput.business_type_id !== undefined) {
        newUserInput.business_type_id = db.getPrimaryKey(userInput.business_type_id)
    }
    if (userInput.customer_id !== undefined) {
        newUserInput.customer_id = db.getPrimaryKey(userInput.customer_id)
    }
    if (userInput.package.ref_packages !== undefined) {
        newUserInput.package.ref_packages = db.getPrimaryKey(userInput.package.ref_packages)
    }
    // Find Document By ID and Update
    db.getDB().collection("customer_subscription").findOneAndUpdate({_id : db.getPrimaryKey(id)},{$set : newUserInput},{returnOriginal : false},(err,result)=>{
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
    db.getDB().collection("customer_subscription").findOneAndDelete({_id : db.getPrimaryKey(id)},(err,result)=>{
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