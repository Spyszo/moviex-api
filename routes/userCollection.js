const router = require('express').Router();
const UserCollectionController = require('../controllers/UserCollectionController');
const verifyJWT = require('../helpers/verifyJWT');

router.get('/', verifyJWT, UserCollectionController.getCollection);

router.post('/movies/add', verifyJWT, UserCollectionController.addMovie);
router.post('/movies/remove', verifyJWT, UserCollectionController.removeMovie);

router.post('/tvSeries/add', verifyJWT, UserCollectionController.addTvSeries);
router.post('/tvSeries/remove', verifyJWT, UserCollectionController.removeTvSeries);

module.exports = router;
