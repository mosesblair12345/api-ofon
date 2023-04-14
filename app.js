const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const app = express();
const port = 3000;

app.use(express.json());
app.set("view engine", "ejs");

mongoose.connect(process.env.DB_CONNECTION);

const day = new Date();
const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const date = day.toLocaleDateString("en-US", options);

const pointsSchema = new mongoose.Schema({
  msisdn: {
    type: String,
  },
  shortCode: {
    type: String,
  },
  message: {
    type: String,
  },
  dateReceived: {
    type: String,
  },
});

const usersSchema = new mongoose.Schema({
  name: String,
  id: Number,
  msisdn: Number,
  points: Number,
  dateCreated: String,
});

const Points = mongoose.model("Point", pointsSchema);
const Users = mongoose.model("User", usersSchema);

async function getAllRecords() {
  const allRecords = Points.find({});
  return allRecords;
}

async function getAllUsers() {
  const allRecords = Users.find({});
  return allRecords;
}

async function getRecord(number) {
  const record = Points.findOne({ msisdn: number });
  return record;
}

async function getUser(number) {
  const record = Users.findOne({ msisdn: number });
  return record;
}

async function createNewPoint({ msisdn, shortCode, message, dateReceived }) {
  const point = Points.create({
    msisdn: msisdn,
    shortCode: shortCode,
    message: message,
    dateReceived: dateReceived,
  });
  return point;
}

async function createNewUser({ name, id, number, points }) {
  const user = Users.create({
    name: name,
    id: id,
    msisdn: number,
    points: points,
    dateCreated: date,
  });
  return user;
}

async function patchPoint(number, request) {
  const patchOne = Points.updateOne({ msisdn: number }, { $set: request });
  return patchOne;
}

async function patchUser(number, request) {
  const patchOne = Users.updateOne({ msisdn: number }, { $set: request });
  return patchOne;
}

async function deletePoint(number) {
  const deleteOne = Points.deleteOne({ msisdn: number });
  return deleteOne;
}

async function deleteUser(number) {
  const deleteOne = Users.deleteOne({ msisdn: number });
  return deleteOne;
}

async function deletePoints() {
  const deleteAll = Points.deleteMany();
  return deleteAll;
}

async function deleteUsers() {
  const deleteAll = Users.deleteMany();
  return deleteAll;
}

app.get("/points", (req, res) => {
  getAllRecords()
    .then((foundItems) => {
      if (foundItems != null && foundItems.length < 1) {
        res.send("Database empty please post a record .Thank you 😟");
      } else {
        res.send(foundItems);
      }
    })
    .catch(() => {
      res.send("There was an error please check your code. Thank you");
    });
});

app.get("/users", (req, res) => {
  getAllUsers()
    .then((foundItems) => {
      if (foundItems.length === 0) {
        res.send("Database empty please post a record .Thank you 😟");
      } else {
        res.send(foundItems);
      }
    })
    .catch(() => {
      res.send("There was an error please check your code. Thank you ☹️");
    });
});

app.get("/points/:id", (req, res) => {
  const number = req.params.id;
  getRecord(number)
    .then((foundItem) => {
      if (foundItem.length === 0) {
        res.send("No Record found sorry ☹️ ");
      } else {
        res.send(foundItem);
      }
    })
    .catch(() => {
      res.send("No record found sorry Please check your code ☹️.");
    });
});

app.get("/users/:id", (req, res) => {
  const number = req.params.id;
  getUser(number)
    .then((foundItem) => {
      if (foundItem.length === 0) {
        res.send("No Record found sorry ☹️ ");
      } else {
        res.send(foundItem);
      }
    })
    .catch(() => {
      res.send("No record found sorry Please check your code ☹️.");
    });
});

app.post("/points", (req, res) => {
  const msisdn = req.body.msisdn;
  const shortCode = req.body.shortCode;
  const message = req.body.message;
  const dateReceived = req.body.dateReceived;

  if (shortCode === undefined) {
    res.send("No service Id please check your input ☹️");
  }
  if (msisdn === undefined) {
    res.send("No msisdn please check ☹️");
  }
  if (message === undefined) {
    res.send("No message please try again ☹️");
  }
  if (dateReceived === undefined) {
    res.send("No date provided ☹️");
  }
  if (msisdn && shortCode && message && dateReceived) {
    createNewPoint({ msisdn, shortCode, message, dateReceived })
      .then(() => {
        async function fetchRequestedPoint(msisdn) {
          const response = Users.findOne({ msisdn: msisdn });
          return response;
        }

        fetchRequestedPoint(msisdn)
          .then((foundItem) => {
            if (foundItem.length === 0) {
              res.send("No customer record found ☹️.");
            } else {
              const fetchedPoints = foundItem.points;
              const fetchedNumber = foundItem.msisdn;
              const fetchedName = foundItem.name;
              const fechedDate = foundItem.dateCreated;

              let text = "";
              if (message !== "points") {
                text = "Please enter a valid request";
              } else {
                text = `Hello ${fetchedName} your points are ${fetchedPoints} and you created your card on ${fechedDate}. Have a lovely day ${fetchedName}`;
              }
              let data = JSON.stringify({
                SenderId: "Mobitext",
                MessageParameters: [
                  {
                    Number: `${fetchedNumber}`,
                    Text: `${text}`,
                  },
                ],
                ApiKey: process.env.API_KEY,
                ClientId: process.env.CLIENT_ID,
              });

              let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: "https://apis.onfonmedia.co.ke/v1/sms/SendBulkSMS",
                headers: {
                  "Content-Type": "application/json",
                  AccessKey: process.env.ACCESS_KEY,
                },
                data: data,
              };

              axios
                .request(config)
                .then(() => {
                  res.send(
                    "Messsage sucessfully sent. Thank you for your patience 👍🏽"
                  );
                })
                .catch((error) => {
                  res.send(error);
                });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch(() => {
        res.send(
          "There was an error please make sure you have inputed the correct details and check your code. Thank you ☹️"
        );
      });
  }
});

app.post("/users", (req, res) => {
  const name = req.body.name;
  const id = req.body.id;
  const number = req.body.number;
  const points = req.body.points;

  if (name === undefined) {
    res.send("please enter a name 😟");
  }
  if (id === undefined) {
    res.send("please enter an id 😟");
  }
  if (number === undefined) {
    res.send("Wrong number please check ☹️");
  }
  if (points === undefined) {
    res.send("Please input points ☹️");
  }
  if (name && id && number && points) {
    createNewUser({ name, id, number, points })
      .then(() => {
        res.send("Record inserted Successfully well done 👍.");
      })
      .catch(() => {
        res.send(
          "There was an error please make sure you have inputed the correct details and check your code. Thank you ☹️"
        );
      });
  }
});

app.patch("/points/:id", (req, res) => {
  const number = req.params.id;
  const request = req.body;

  patchPoint(number, request)
    .then(() => {
      res.send("updated sucessfully 👍");
    })
    .catch(() => {
      res.send("error while update please check your code Thank you ☹️");
    });
});

app.patch("/users/:id", (req, res) => {
  const number = req.params.id;
  const request = req.body;

  patchUser(number, request)
    .then(() => {
      res.send("updated sucessfully 👍");
    })
    .catch(() => {
      res.send("error while update please check your code Thank you ☹️");
    });
});

app.delete("/points", (req, res) => {
  deletePoints()
    .then(() => {
      res.send("Sucessfully deleted all the records. Thank you 👍.");
    })
    .catch(() => {
      res.send("There was an erorr please check your code. Thank you ☹️");
    });
});

app.delete("/points/:id", (req, res) => {
  const number = req.params.id;
  deletePoint(number)
    .then(() => {
      res.send("deleted record sucessfully 👍");
    })
    .catch(() => {
      res.send("error while deleting please check your code. Thank you ☹️");
    });
});

app.delete("/users", (req, res) => {
  deleteUsers()
    .then(() => {
      res.send("Sucessfully deleted all the records. Thank you 👍.");
    })
    .catch(() => {
      res.send("There was an erorr please check your code. Thank you ☹️");
    });
});

app.delete("/users/:id", (req, res) => {
  const number = req.params.id;
  deleteUser(number)
    .then(() => {
      res.send("deleted record sucessfully 👍");
    })
    .catch(() => {
      res.send("error while deleting please check your code. Thank you ☹️");
    });
});

app.listen(port, () => {
  console.log(`i am listening on port ${port}`);
});
