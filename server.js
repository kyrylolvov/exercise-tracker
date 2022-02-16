require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');

const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost/exercise-track',
  { useNewUrlParser: true },
  { useUnifiedTopology: true },
);

const personSchema = new Schema({ username: String });
const Person = mongoose.model('Person', personSchema);

const exerciseSchema = new Schema({ userId: String, description: String, duration: Number, date: Date });
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const newPerson = new Person({ username: req.body.username });
  newPerson.save((err, data) => {
    res.json({ username: data.username, _id: data.id });
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;
  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  Person.findById(userId, (err, data) => {
    if (!data) {
      res.send('Unknown userId');
    } else {
      let username = data.username;
      let newExercise = new Exercise({ userId, description, duration, date });

      newExercise.save((err, data) => {
        res.json({ username, description, duration: +duration, date: new Date(date).toDateString(), _id: userId });
      });
    }
  });
});

app.get('/api/users', (req, res) => {
  Person.find({}, (err, data) => {
    if (!data) {
      res.json('No data');
    } else {
      res.json(data);
    }
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  let userId = req.params._id;

  Person.findById(userId, (err, data) => {
    if (!data) {
      res.json({ 'Error userId': userId });
    } else {
      const username = data.username;
      Exercise.find({ userId }, { date: { $gte: new Date(from), $lte: new Date(to) } })
        .select(['username', 'description', 'duration', 'date'])
        .limit(+limit)
        .exec((err, data) => {
          const customdata = data.map((exer) => {
            return {
              description: exer.description,
              duration: +exer.duration,
              date: new Date(exer.date).toDateString(),
            };
          });
          if (!data) {
            res.json({
              username: username,
              count: customdata.length,
              _id: userId,
              log: [],
            });
          } else {
            res.json({
              username: username,
              count: customdata.length,
              _id: userId,
              from: new Date(from).toDateString(),
              to: new Date(to).toDateString(),
              log: customdata,
            });
          }
        });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
