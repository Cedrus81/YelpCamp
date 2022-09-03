const ExpressError = require('./utils/ExpressError');
const { campgroundSchema } = require('./schemas');
const Campground = require('./models/campgrounds')
const Review = require('./models/review')
const { reviewSchema } = require('./schemas');


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        // url in originalUrl was Uppercase in the beginning, it caused
        // an error 
        req.flash('error', 'You must be signed in!')
        return res.redirect('/login')
        // if we dont return res.redirect, we will go on
        // and render campgrounds new, which will prompt an error
        // that it "cannot set headers after theyre sent to client"
    }
    next();
    //otherwise, go on
}

// this middleware validates if the camp form
// was filled without error
module.exports.validateCamp = (req, res, next) => {

    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join()
        throw new ExpressError(msg, 400)
    }
    next();
}

// only the camp's author is allowed to edit or remove
// his own added camp
module.exports.isAuthor = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', `You have no permission to do that!`)
        return res.redirect(`/campgrounds/${campground._id}`)
    }
    next();
}

//checks if the review is valid
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join()
        throw new ExpressError(msg, 400)
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    // id of review was named as such in the router.delete
    const review = await Review.findById(reviewId)
    if (!review.author.equals(req.user._id)) {
        req.flash('error', `You have no permission to do that!`)
        return res.redirect(`/campgrounds/${id}`)
    }
    next();
}