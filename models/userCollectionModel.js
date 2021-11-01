/* eslint-disable func-names */
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  id: { type: Number },
  title: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  year: { type: Number },
  added_at: { type: Number },
});

const tvSeriesSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  added_at: { type: Number },
});

const userCollectionSchema = new mongoose.Schema({
  userID: { type: String, unique: true, required: true },
  userCollection: {
    movies: [movieSchema],
    tvSeries: [tvSeriesSchema],
  },
});

mongoose.model('UserCollection', userCollectionSchema);
