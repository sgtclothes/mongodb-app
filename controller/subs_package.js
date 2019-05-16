const db = require("../config/db");
const { schema, model, Joi } = require("../models/subs_package");

function get(req, res) {
  let { limit, skip, sorter, sorter_val, keyword, key_val } = req.query;
  let a = new Array();
  let b = new Array();
  if (sorter && (sorter_val == 1 || sorter_val == -1)) {
    a[sorter] = parseInt(sorter_val);
  } else {
    a = {};
  }
  if (keyword && key_val !== undefined) {
    b[keyword] = new RegExp(key_val);
  } else {
    b = {};
  }
  if (limit) {
    limit = parseInt(limit);
  } else {
    limit = 0;
  }
  if (skip < 1 || undefined) skip = 1;
  let pageNumber = parseInt((skip - 1) * limit);
  let sort = Object.assign({}, a);
  let search = Object.assign({}, b);
  model()
    .find(search)
    .skip(pageNumber)
    .limit(limit)
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
  const userInput = req.body;
  var newUserInput = Object.assign({}, userInput);
  console.log(newUserInput);
  for (let key in newUserInput.access_list) {
    newUserInput.access_list[key].access_id = db.getPrimaryKey(
      newUserInput.access_list[key].access_id
    );
  }

  model().insertOne(newUserInput, (err, result) => {
    if (err) {
      res.send(err)
    } else
      res.send({
        result: result,
        document: result.ops[0],
        msg: "Successfully inserted Data!!!",
        error: null
      });
  });
}

function patch(req, res) {
  const id = req.params.id;
  const userInput = req.body;
  var newUserInput = Object.assign({}, userInput);
  for (let i = 0; i < userInput.access_list.length; i++) {
    newUserInput.access_list[i].access_id = db.getPrimaryKey(
      userInput.access_list[i].access_id
    );
  }
  model().findOneAndUpdate(
    { _id: db.getPrimaryKey(id) },
    { $set: newUserInput },
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

module.exports = {
  get,
  getId,
  create,
  patch
};
