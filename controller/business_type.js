const db = require("../config/db");
const { schema, model, Joi } = require("../models/business_type");

function get(req, res) {
  // get all documents within our collection
  // send back to user as json
  let limit = req.query.limit;
  let skip = req.query.skip;
  let sorter = req.query.sorter;
  let sorter_val = req.query.sorter_val;
  let a = new Array();
  if (sorter_val == 1 || sorter_val == -1) {
    a[sorter] = parseInt(sorter_val);
  } else {
    a = {};
  }
  let sort = Object.assign({}, a);
  console.log(sort);
  model()
    .find({})
    .skip(parseInt((skip - 1) * limit))
    .limit(parseInt(limit))
    .sort(sort)
    .toArray((err, results) => {
      if (err) {
        res.send({ error: err });
      }
      if (results === undefined || results.length === 0) {
        res.send({ error: "No documents in database" });
      } else {
        res.send(results);
      }
    });
}

function getId(req, res) {
  let id = req.params.id;
  console.log(id);
  model().findOne({ _id: db.getPrimaryKey(id) }, (err, result) => {
    if (err) {
      res.send({ error: err });
    }
    if (result === undefined) {
      res.send({ error: "No documents in database" });
    } else {
      res.send(result);
    }
  });
}

function create(req, res, next) {
  // Document to be inserted
  const userInput = req.body;

  // Validate document
  // If document is invalid pass to error middleware
  // else insert document within collection
  Joi.validate(userInput, schema, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      model().insertOne(userInput, (err, result) => {
        if (err) {
          res.send(err);
        } else
          res.send({
            result: result,
            document: result.ops[0],
            msg: "Successfully inserted Data!!!",
            error: null
          });
      });
    }
  });
}

function patch(req, res) {
  // Primary Key of Document we wish to update
  const id = req.params.id;
  // Document used to update
  const userInput = req.body;
  // Find Document By ID and Update
  model().findOneAndUpdate(
    { _id: db.getPrimaryKey(id) },
    { $set: userInput },
    { returnOriginal: false },
    (err, result) => {
      if (err) {
        res.send({ error: err });
      } else {
        res.send(result);
      }
    }
  );
}

//delete (customer collection)
function remove(req, res) {
  // Primary Key of Document
  const id = req.params.id;
  // Find Document By ID and delete document from record
  model().findOneAndDelete({ _id: db.getPrimaryKey(id) }, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send(result);
    }
  });
}

module.exports = {
  get,
  getId,
  create,
  patch,
  remove
};
