const { cloudinary } = require('../cloudinary')
const Campground = require('../models/campgrounds')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mbxToken = process.env.MAPBOX_TOKEN
// export the mapbox token from the e=.env file
const geocoder = mbxGeocoding({ accessToken: mbxToken })
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.postNewCamp = async (req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    // take the files from req (in our case, images)
    // and make them an array
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'new campground was saved')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCamp = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
            // populate the reviews, and on each one of them,
            // populate the author. An example for a nested populate
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'camp not found')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'camp not found')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.updateCamp = async (req, res) => {
    const campground = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground })
    console.log(req.body)
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename)
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
        // pull out of the images array the filename attribute of the images in deleteImages
        // yeah...
    }
    req.flash('success', `successfully updated ${campground.title}`)
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCamp = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndDelete(id);
    req.flash('success', `${campground.title} was deleted`)
    res.redirect('/campgrounds')
}