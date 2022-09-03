const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;
// a shortcut to reference mongoose.Schema
const opts = { toJSON: { virtuals: true } };
// allows virtuals to be parsed by JSON
imageSchema = new Schema({
    url: String,
    filename: String
})

imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/300x300', '/100x100')
})

const CampgroundSchema = new Schema({
    title: String,
    images: [imageSchema],
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
}, opts);

CampgroundSchema.virtual('properties.popUpText').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}(...)</p>`;
})

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
            // remove all reviews whom's IDs are
            // inside the review array of the deleted
            // campground
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);
