const express = require('express')
const router = express.Router()
const passport = require('passport')
const catchAsync = require('../utils/catchAsync')
const users = require('../controllers/users')

router.route('/register')
    .get(users.registerForm)
    .post(catchAsync(users.registerPost))
// registring a new user: if it works, well redirect you to the index page
// with a success message. If not, we'll refresh you with an error.
// we use catchAsync as a second line of defense

router.route('/login')
    .get(users.loginForm)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.loginPost)
// passport.authenticate for the local strategy (as opposed to google, facebook accounts etc.)
// flashFailure send a flash failure message
// in case of failure, redirect back to /login

router.get('/logout', users.logout);

module.exports = router;