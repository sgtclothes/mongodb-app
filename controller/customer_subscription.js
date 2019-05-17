const db = require("../config/db");
const {
  Joi,
  assert,
  customerSubscriptionSchema,
  model
} = require("../models/customer_subscription");

let isEdited = false;

function get(req, res) {
  let { limit, skip, sorter, sorter_val, keyword, key_val } = req.query;
  let sort = new Array();
  let search = new Array();
  let aggregate = [
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
        for (let key in results) {
          if (results[key].package.ref_packages !== null) {
            let ref_packages = results[key].package.ref_packages;
            results[key].package = Object.assign(
              {},
              ...results[key].package.packages
            );
            results[key].package.ref_packages = ref_packages;
          } else {
            results[key].package.ref_packages = null;
            results[key].package.name = null;
            results[key].package.price = null;
            for (keys in results[key].package.access_list) {
              results[key].package.access_list[keys].access_id = null;
              results[key].package.access_list[keys].value = null;
              results[key].package.access_list[keys].uom = null;
            }
            delete results[key].package.packages;
          }
        }
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
          res.send({ error: err });
        }
        if (result === undefined) {
          res.send({ error: "No documents in database" });
        } else {
          for (let key in result) {
            let ref_packages = result[key].package.ref_packages;
            result[key].package = Object.assign(
              {},
              ...result[key].package.packages
            );
            result[key].package.ref_packages = ref_packages;
          }
          res.send(result);
        }
      });
    }
  );
}

function create(req, res, next) {
  // Document to be inserted

  let userInput = req.body;

  if (userInput.package.ref_packages === null && isEdited == false) {
    isEdited = true;
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
    model().aggregate(
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
    model().insertOne(newUserInput, (err, result) => {
      if (err) {
        res.send(err);
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
  let userInput = req.body;
  if (userInput.package.ref_packages == null) {
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
    model().aggregate(
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
}

module.exports = {
  get,
  getId,
  create,
  patch
};
