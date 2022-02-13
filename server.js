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

const userSchema = new Schema({
  username: String,
});
const USER = mongoose.model('USER', userSchema);

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});
const EXERCISE = mongoose.model('EXERCISE', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async function (req, res) {
  const { username } = req.body;
  if (username.length > 0) {
    try {
      const newUser = new USER({
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
                const userFound = await USER.findOne({
                  _id: id,
                });
                const newExercise = new EXERCISE({
                  username: userFound.username,
                  description: description,
                  duration: +duration,
                  date: date,
                });
                await newExercise.save();
                res.json({
                  _id: newExercise._id.toString(),
                  username: newExercise.username,
                  description: newExercise.description,
                  duration: newExercise.duration,
                  date: newExercise.date.toDateString(),
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
