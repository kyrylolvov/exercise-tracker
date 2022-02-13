require('dotenv').config();
const express = require('express');
const mongo = require('mongo');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const dateRegex = /\d{4}-\d{2}-\d{2}/;

// Connecting to MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);

// Defining USER model
const Schema = mongoose.Schema;

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema],
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', (req, res) => {
  User.find({}, (error, arrayOfUsers) => {
    if (!error) {
      res.json(arrayOfUsers);
    } else {
      res.status(500).json({
        error: 'Server error',
      });
    }
  });
});

app.post('/api/users', async function (req, res) {
  const { username } = req.body;
  if (username.length > 0) {
    try {
      const newUser = new User({
        username: username,
      });
      await newUser.save();
      res.json({
        username: newUser.username,
        _id: newUser._id.toString(),
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: 'Server error',
      });
    }
  } else {
    res.json({ error: 'Name cannot be empty' });
  }
});

app.post('/api/users/:_id/exercises', async function (req, res) {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  if (id.length > 0) {
    if (description.length > 0) {
      if (duration.length > 0) {
        if (!isNaN(duration)) {
          if (+duration > 0) {
            if (!!date && dateRegex.test(date)) {
              try {
                const newExercise = new Exercise({
                  description: description,
                  duration: +duration,
                  date: date,
                });

                User.findByIdAndUpdate(id, { $push: { log: newExercise } }, { new: true }, (error, updatedUser) => {
                  if (!error) {
                    let responseObject = {};
                    responseObject['_id'] = updatedUser.id;
                    responseObject['username'] = updatedUser.username;
                    responseObject['description'] = newExercise.description;
                    responseObject['duration'] = newExercise.duration;
                    responseObject['date'] = new Date(newExercise.date).toDateString();
                    res.json(responseObject);
                  } else {
                    res.status(500).json({
                      error: 'Error',
                    });
                  }
                });
              } catch (err) {
                console.log(err);
                res.status(500).json({
                  error: 'User not found',
                });
              }
            } else {
              res.json({ error: 'Invalid date' });
            }
          } else {
            res.json({ error: 'Duration cannot be zero' });
          }
        } else {
          res.json({ error: 'Duration must be a number' });
        }
      } else {
        res.json({ error: 'Duration cannot be empty' });
      }
    } else {
      res.json({ error: 'Description cannot be empty' });
    }
  } else {
    res.json({ error: 'Id cannot be empty' });
  }
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;

  User.findById(id, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      res.status(200).json({
        username: user.username,
        count: user.log.length,
        _id: user._id.toString(),
        log: user.log,
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
