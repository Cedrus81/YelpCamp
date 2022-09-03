const Review = require('../models/review')
const Campground = require('../models/campgrounds')

module.exports.postReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review(req.body.review)
    review.author = req.user._id;
    campground.reviews.push(review)
    // express Router keeps parameters seperate, not sharing them.
    // by default, we wont have access to the id shown in the URL
    // thats why we have to set mergeParams (line 2) to 'true'
    await review.save()
    await campground.save()
    req.flash('success', `Thanks! Your review was added to ${campground.title}'s page!`)
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const campground = await Campground.findById(req.params.id)
    Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId)
    req.flash('success', `Your review of ${campground.title} was successfully deleted`)
    res.redirect(`/campgrounds/${id}`)
}