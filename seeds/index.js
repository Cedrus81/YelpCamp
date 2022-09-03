const mongoose = require('mongoose')
const cities = require('./cities');
const { places, descriptors } = require('./seedhelpers');
const Campground = require('../models/campgrounds')
//  we need to back out one ^^^ directory, since we're in /seeds
const loremIpsum = require("lorem-ipsum").loremIpsum;
// ^^ lorem ipsum gibberish generator
const db = mongoose.connection;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl)
    .then(() => {
        console.log("Connection open!");
    })
    .catch(err => {
        console.log("connection error");
        console.log(err);
    })
db.on("error", console.error.bind(console, "connection error:"));
// adds the logic to check if there's an error
db.once("open", () => {
    console.log("database connected")
})
// arrow functions reminder:
const sample = array => array[Math.floor(Math.random() * array.length)];
//     ^^ name    ^^ we pass in an array, and return whats after the =>
// in this case, it returns a random value inside the array
let count = 10;
function images() {
    let images = []
    for (let i = 0; i < 3; i++) {
        count++;
        images[i] = {
            url: `https://source.unsplash.com/random/300x300?camping,${count}`,
            crossOriginIsolated: true,
            filename: `yelpcamp/media/${count}`
        }
    }
    return images;
}

function description() {
    let description = ""
    for (let i = 0; i < 5; i++) {
        description += " ";
        description += loremIpsum();
    }
    return description;
}

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const price = Math.ceil(Math.random() * 20) + 10;
        const rand1000 = Math.floor(Math.random() * 1000);
        const camp = new Campground({
            description: description(),
            price: price,
            author: '630b3d56fbf897b65ee7a6b8',
            location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: images(),
            geometry: {
                type: "Point",
                coordinates: [
                    cities[rand1000].longitude,
                    cities[rand1000].latitude,
                ]
            },
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});

