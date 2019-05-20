const db = require("../config/db");
const {
  Joi,
  assert,
  customerSubscriptionSchema,
  model
} = require("../models/customer_subscription");

let contains = function(needle) {
  let findNaN = needle !== needle;
  let indexOf;

  if (!findNaN && typeof Array.prototype.indexOf === "function") {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function(needle) {
      var i = -1,
        index = -1;

      for (i = 0; i < this.length; i++) {
        var item = this[i];

        if ((findNaN && item !== item) || item === needle) {
          index = i;
          break;
        }
      }

      return index;
    };
  }

  return indexOf.call(this, needle) > -1;
};

function get(req, res) {
  let customerids = [];
  let regex = {};
  let arrayUrl = req.url.slice(1).split("/");

  function match(array, key) {
    let match = contains.call(array, key);
    if (match == true) {
      let index = array.indexOf(key);
      let value = array[index + 1];
      if (key == "search" || key == "sort") {
        let key_val = array[index + 2];
        let arr_val = [value, key_val];
        return arr_val;
      } else {
        return value;
      }
    } else {
      return;
    }
  }

  function getData(arr) {
    let checkId = arrayUrl[0];
    model()
      .find(arr[0])
      .sort(arr[1])
      .skip(arr[2])
      .limit(parseInt(arr[3]))
      .toArray((err, results) => {
        if (results === undefined || results.length === 0) {
          res.send({ error: "No documents in database" });
        } else {
          for (let key in results) {
            customerids.push(results[key].customer_id.toString());
          }
          let match = contains.call(customerids, checkId);
          if (match == true) {
            getId(req, res);
          } else {
            res.send(results);
          }
        }
      });
  }

  let search = match(arrayUrl, "search");
  let sort = match(arrayUrl, "sort");
  let page = match(arrayUrl, "skip");
  let limit = match(arrayUrl, "limit");

  if (search !== undefined) {
    regex = {
      [search[0]]: { $regex: new RegExp(search[1], "i") }
    };
  } else {
    regex = {};
  }

  let a = new Array();
  if (sort !== undefined) {
    if (sort[0] && (parseInt(sort[1]) == 1 || parseInt(sort[1]) == -1)) {
      a[sort[0]] = parseInt(sort[1]);
    } else {
      a = {};
    }
  } else {
    a = {};
  }

  let sorting = Object.assign({}, a);

  if (page < 1 || undefined) page = 1;
  let pageNumber = (page - 1) * limit;

  let arrModel = [regex, sorting, pageNumber, limit];
  getData(arrModel);
}

function getId(req, res) {
  let id = req.url.slice(1);
  model().aggregate(
    [
      {
        $match: { customer_id: db.getPrimaryKey(id) }
      },
      {
        $project: {
          _id: 0,
          business_type_id: 0,
          periode: 0,
          unit: 0,
          value: 0
        }
      }
    ],
    (err, cursor) => {
      assert.equal(err, null);

      cursor.toArray(function(err, results) {
        if (err) {
          res.send({ error: err });
        }
        if (results === undefined) {
          res.send({ error: "No documents in database" });
        } else {
          var result = new Object();
          result.customer_id = results[0].customer_id;
          result.subscriptions = [];
          for (let key in results) {
            var name = results[key].package.name;
            var price = results[key].package.price;
            var access_list = results[key].package.access_list;
            var ref_packages = results[key].package.ref_packages;
            result.subscriptions.push({
              ref_packages,
              name,
              price,
              access_list
            });
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

  if (userInput.package.ref_packages === null) {
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
