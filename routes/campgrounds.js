const express = require('express')
const router = express.Router()
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCamp } = require('../middleware')
const campgrounds = require('../controllers/campgrounds')
const multer = require('multer')
const { storage } = require('../cloudinary')
const upload = multer({ storage })

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn,
        upload.array('image'),
        validateCamp,
        catchAsync(campgrounds.postNewCamp))

router.get('/new', isLoggedIn, campgrounds.renderNewForm)
// the order does matter here. if :id wass to come first
// then the app would think "new" would be an id if
// we were to enter the link

router.route('/:id')
    .get(catchAsync(campgrounds.showCamp))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCamp, catchAsync(campgrounds.updateCamp))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCamp))

router.get('/:id/edit',
    isLoggedIn,
    isAuthor,
    catchAsync(campgrounds.renderEditForm))



module.exports = router;