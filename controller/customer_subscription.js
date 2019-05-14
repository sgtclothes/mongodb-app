const Joi = require("@hapi/joi");
const assert = require("assert");
const db = require("../config/db");

const package = Joi.object().keys({
  ref_packages: Joi.string()
});

const customerSubscriptionSchema = Joi.object().keys({
  business_type_id: Joi.string().required(),
  package: package,
  customer_id: Joi.string().required(),
  periode: Joi.string(),
  unit: Joi.string(),
  value: Joi.number().integer()
});

function get(req, res) {
  db.getDB()
    .collection("customer_subscription")
    .aggregate(
      [
        {
          $lookup: {
            from: "subs_package",
            localField: "package.ref_packages",
            foreignField: "_id",
            as: "package.packages"
          }
        },
        {
          $project: { "package.packages._id": 0 }
        }
      ],
      (err, cursor) => {
        assert.equal(err, null);

        cursor.toArray(function(err, results) {
          if (err) {
            res.send({ error: err });
          }
          if (results === undefined || results.length === 0) {
            res.send({ error: "No documents in database" });
          } else {
            for (let key in results) {
              if (results[key].package.ref_packages) {
                let ref_packages = results[key].package.ref_packages;
                results[key].package = Object.assign(
                  {},
                  ...results[key].package.packages
                );
                results[key].package.ref_packages = ref_packages;
              } else {
                results[key].package.name = null;
                results[key].package.price = null;
                for (keys in results[key].package.access_list) {
                  results[key].package.access_list[keys].access_id = null;
                  results[key].package.access_list[keys].value = null;
                  results[key].package.access_list[keys].uom = null;
                }
                results[key].package.ref_packages = ref_packages;
              }
            }
            res.send(results);
          }
        });
      }
    );
}

function getId(req, res) {
  let id = req.params.id;
  db.getDB()
    .collection("customer_subscription")
    .aggregate(
      [
        {
          $lookup: {
            from: "subs_package",
            localField: "package.ref_packages",
            foreignField: "_id",
            as: "package.packages"
          }
        },
        {
          $project: { "package.packages._id": 0 }
        },
        {
          $match: { _id: db.getPrimaryKey(id) }
        }
      ],
      (err, cursor) => {
        assert.equal(err, null);

        cursor.toArray(function(err, result) {
          if (err) {
            res.status(400).send({ error: err });
          }
          if (result === undefined) {
            res.status(400).send({ error: "No documents in database" });
          } else {
            for (let key in result) {
              let ref_packages = result[key].package.ref_packages;
              result[key].package = Object.assign(
                {},
                ...result[key].package.packages
              );
              result[key].package.ref_packages = ref_packages;
            }
            res.status(200).send(result);
          }
        });
      }
    );
}

function create(req, res, next) {
  // Document to be inserted

  let userInput = req.body;

  if (userInput.package.ref_packages === null) {
    userInput.package.name = null;
    userInput.package.price = null;
    userInput.package.access_list = [
      {
        access_id: null,
        value: null,
        uom: null
      }
    ];
    getResults(userInput);
  } else {
    db.getDB()
      .collection("customer_subscription")
      .aggregate(
        [
          {
            $lookup: {
              from: "subs_package",
              localField: "package.ref_packages",
              foreignField: "_id",
              as: "package.packages"
            }
          },
          {
            $project: { "package.packages._id": 0 }
          }
        ],
        (err, cursor) => {
          let user = userInput;
          assert.equal(err, null);
          cursor.next(function(err, results) {
            if (err) {
              res.send({ error: err });
            } else {
              let packages = Object.assign({}, ...results.package.packages);
              user.package.name = packages.name;
              user.package.price = packages.price;
              user.package.access_list = [
                {
                  access_id: packages.access_list[0].access_id,
                  value: packages.access_list[0].value,
                  uom: packages.access_list[0].uom
                }
              ];
              getResults(user);
            }
          });
        }
      );
  }

  function getResults(userInput) {
    let newUserInput = Object.assign({}, userInput);

    if (userInput.business_type_id !== undefined) {
      newUserInput.business_type_id = db.getPrimaryKey(
        userInput.business_type_id
      );
    }
    if (userInput.customer_id !== undefined) {
      newUserInput.customer_id = db.getPrimaryKey(userInput.customer_id);
    }
    if (userInput.package.ref_packages !== null) {
      newUserInput.package.ref_packages = db.getPrimaryKey(
        userInput.package.ref_packages
      );
    } 
    db.getDB()
      .collection("customer_subscription")
      .insertOne(newUserInput, (err, result) => {
        if (err) {
          const error = new Error("Failed to insert Document");
          error.status = 400;
          next(error);
        } else {
          res.send({
            result: result,
            document: result.ops[0],
            msg: "Successfully inserted Data!!!",
            error: null
          });
        }
      });
  }
}

function patch(req, res) {
  // Primary Key of Document we wish to update
  const id = req.params.id;
  // Document used to update
  const userInput = req.body;
  var newUserInput = Object.assign({}, userInput);
  if (userInput.business_type_id !== undefined) {
    newUserInput.business_type_id = db.getPrimaryKey(
      userInput.business_type_id
    );
  }
  if (userInput.customer_id !== undefined) {
    newUserInput.customer_id = db.getPrimaryKey(userInput.customer_id);
  }
  if (userInput.package.ref_packages == "") {
    userInput.package.name = "";
    userInput.package.price = null;
    userInput.package.access_list = [
      {
        access_id: "",
        value: null,
        uom: ""
      }
    ];
  } else {
    newUserInput.package.ref_packages = db.getPrimaryKey(
      userInput.package.ref_packages
    );
  }

  // if (userInput.package.ref_packages !== undefined) {
  //   newUserInput.package.ref_packages = db.getPrimaryKey(
  //     userInput.package.ref_packages
  //   );
  // }

  // Find Document By ID and Update
  db.getDB()
    .collection("customer_subscription")
    .findOneAndUpdate(
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

//delete (customer collection)
function remove(req, res) {
  // Primary Key of Document
  const id = req.params.id;
  // Find Document By ID and delete document from record
  db.getDB()
    .collection("customer_subscription")
    .findOneAndDelete({ _id: db.getPrimaryKey(id) }, (err, result) => {
      if (err) {
        res.status(400).send({ error: err });
      } else {
        res.status(200).send(result);
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
