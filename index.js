const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const db = require("./config/db");

const business_type = require("./routes/business_type");
const customer = require("./routes/customer");
const customer_subscription = require("./routes/customer_subscription");

const subs_list = require("./routes/subs_list");
const subs_package = require("./routes/subs_package");

// parses json data sent to us by the user
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", res => {
  res.send("welcome");
});

app.use("/business_type", business_type);
app.use("/customer", customer);
app.use("/customer_subscription", customer_subscription);

app.use("/subs_list", subs_list);
app.use("/subs_package", subs_package);

// Middleware for handling Error
// Sends Error Response Back to User
app.use((err, req, res, next) => {
  res.status(err.status).json({
    error: {
      message: err.message
    }
  });
});

db.connect(err => {
  // If err unable to connect to database
  // End application
  if (err) {
    console.log("unable to connect to database");
    process.exit(1);
  }
  // Successfully connected to database
  // Start up our Express Application
  // And listen for Request
  else {
    app.listen(3000, () => {
      console.log("Connected to Database, API listening on port 3000");
    });
  }
});
