const db = require("../config/db");
const { schema, model, Joi, assert } = require("../models/customer");

function get(req, res) {
  let { limit, skip, sorter, sorter_val, keyword, key_val } = req.query;
  let sort = new Array();
  let search = new Array();
  let aggregate = [
    {
      $lookup: {
        from: "customer_subscription",
        localField: "_id",
        foreignField: "customer_id",
        as: "subscriptions"
      }
    },
    { $project: { "subscriptions._id": 0 } }
  ];

  if (sorter && (sorter_val == 1 || sorter_val == -1)) {
    sort[sorter] = parseInt(sorter_val);
  } else {
    sort = null;
  }
  if (keyword && key_val !== undefined) {
    search[keyword] = new RegExp(key_val);
  } else {
    search = null;
  }
  if (limit) {
    limit = parseInt(limit);
  } else {
    limit = undefined;
  }

  if (search !== null) {
    aggregate.push({ $match: Object.assign({}, search) });
  }

  if (skip !== undefined && limit !== undefined) {
    let pageNumber = parseInt((skip - 1) * limit);
    aggregate.push({ $skip: pageNumber });
  }
  if (limit !== undefined && limit !== 0) {
    aggregate.push({ $limit: limit });
  }
  if (sort !== null) {
    aggregate.push({ $sort: Object.assign({}, sort) });
  }

  model().aggregate(aggregate, (err, cursor) => {
    assert.equal(err, null);

    cursor.toArray(function(err, results) {
      if (err) {
        res.send({ error: err });
      }
      if (results === undefined || results.length === 0) {
        res.send({ error: "No documents in database" });
      } else {
        res.send(results);
      }
    });
  });
}

function getId(req, res) {
  let id = req.params.id;
  model().aggregate(
    [
      {
        $lookup: {
          from: "customer_subscription",
          localField: "_id",
          foreignField: "customer_id",
          as: "subscriptions"
        }
      },
      {
        $match: {
          _id: db.getPrimaryKey(id)
        }
      },
      { $project: { "subscriptions._id": 0 } }
    ],
    (err, cursor) => {
      assert.equal(err, null);

      cursor.toArray(function(err, result) {
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
  );
}

function create(req, res, next) {
  const userInput = req.body;
  let newUserInput = Object.assign({}, userInput);
  if (userInput.subscription_id == null) {
    newUserInput.subscriptions = [];
  } else {
    for (let key in userInput.subscription_id) {
      if (userInput.subscription_id[key]) {
        newUserInput.subscription_id[key] = db.getPrimaryKey(
          userInput.subscription_id[key]
        );
      }
    }
  }

  model().insertOne(newUserInput, (err, result) => {
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

function patch(req, res) {
  const id = req.params.id;
  const userInput = req.body;
  let newUserInput = Object.assign({}, userInput);
  if (userInput.subscription_id !== undefined) {
    newUserInput.subscription_id = db.getPrimaryKey(userInput.subscription_id);
  }
  model().findOneAndUpdate(
    { _id: db.getPrimaryKey(id) },
    { $set: newUserInput },
    { returnOriginal: false },
    (err, result) => {
      if (err) {
        res.status(400).send({ error: err });
      } else {
        res.status(200).send(result);
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
