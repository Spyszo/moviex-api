/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const UserCollection = require('mongoose').model('UserCollection');

exports.getCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findOne({ userID: req.userID });

    if (!collection) {
      return res.status(404).json({ message: 'Kolekcja pusta' });
    }

    return res.status(200).json({
      movies: collection.userCollection.movies,
      tvSeries: collection.userCollection.tvSeries,
    });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addMovie = async (req, res) => {
  try {
    const collection = await UserCollection.findOne({ userID: req.userID });

    if (!collection) {
      const newCollection = new UserCollection({
        userID: req.userID,
        userCollection: {
          movies: [{ ...req.body, added_at: Date.now() }],
        },
      });
      await newCollection.save();
    } else {
      collection.userCollection.movies.push({ ...req.body, added_at: Date.now() });
      await collection.save();
    }

    return res.status(200).json({ message: 'Collection working' });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeMovie = async (req, res) => {
  try {
    const collection = await UserCollection.findOne({ userID: req.userID });

    if (!collection) {
      const newCollection = new UserCollection({
        userID: req.userID,
        userCollection: {
          movies: [],
        },
      });
      await newCollection.save();
    } else {
      const oldCollection = collection.userCollection.movies;
      collection.userCollection.movies = oldCollection.filter(
        (movie) => movie.id !== req.body.id,
      );

      await collection.save();

      console.log('Usunięto');
    }
    return res.status(200).json({ message: 'Collection working' });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addTvSeries = async (req, res) => {
  try {
    const collection = await UserCollection.findOne({ userID: req.userID });

    if (!collection) {
      const newCollection = new UserCollection({
        userID: req.userID,
        userCollection: {
          tvSeries: [{ ...req.body, added_at: Date.now() }],
        },
      });
      await newCollection.save();
    } else {
      collection.userCollection.tvSeries.push({ ...req.body, added_at: Date.now() });
      await collection.save();
    }

    return res.status(200).json({ message: 'Collection working' });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeTvSeries = async (req, res) => {
  try {
    const collection = await UserCollection.findOne({ userID: req.userID });

    if (!collection) {
      const newCollection = new UserCollection({
        userID: req.userID,
        userCollection: {
          tvSeries: [],
        },
      });
      await newCollection.save();
    } else {
      const oldCollection = collection.userCollection.tvSeries;
      collection.userCollection.tvSeries = oldCollection.filter(
        (tvSeries) => tvSeries.id !== req.body.id,
      );

      await collection.save();

      console.log('Usunięto');
    }
    return res.status(200).json({ message: 'Collection working' });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
