if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override')
const passport = require('passport');
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
const secret = process.env.SECRET || 'thisisnotasecret'

mongoose.connect(dbUrl)
    .then(() => {
        console.log("Connection open!");
    })
    .catch(err => {
        console.log("connection error");
        console.log(err);
    })
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
// adds the logic to check if there's an error
db.once("open", () => {
    console.log("database connected")
})
// lets us know if we connected successfully

const app = express();

app.engine('ejs', ejsMate);
// tells express to use ejs-mate instead of 
// the default engine

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// dont forget double      ^^  underscore
// sets the adress of the pages we see
// as already in the  views directory


app.use(mongoSanitize());
// this package disallows security breaches with the use of mongo.
// for example find all usernames greater than "": {$gt: ""}
app.use(express.urlencoded({ extended: true }))
// as a default, the parameters we get from a post request
// (req.body) are empty. this command overwrites it
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public')))

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret,
    }
})
//touchAfter sets a lazy update, thus it will only update
// once there's new information OR the allocated time has passed (24 hrs)

store.on("error", function (e) {
    console.log("session store ERROR: ", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    Cookie: {
        httpOnly: true,
        sameSite: "lax",
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
}

app.use(session(sessionConfig))
app.use(flash())
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: [...scriptSrcUrls, "'unsafe-inline'", "'self'"],
            styleSrc: [...styleSrcUrls, "'self'", "'unsafe-inline'"],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "https://res.cloudinary.com/defz7xcxw/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://source.unsplash.com/random/",
                "'self'",
                "blob:",
                "data:",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize())
// for persistent login sessions (vs loging in at every single requsest)
app.use(passport.session())
// has to be below app.use(session())
passport.use(new LocalStrategy(User.authenticate()))
// authenticate is a static method added by the passport library
// so passport has its own authentication method

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
//tells passport how to store and remove it's users

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    // sets the variable 'success' in the locals ad req.flash(success)
    res.locals.error = req.flash('error')
    res.locals.currentUser = req.user;
    next();
})

/* app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'erez', username: 'erezz' })
    const newUser = await User.register(user, 'chicken')
    res.send(newUser)
}) */

app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/', userRoutes)


app.get('/', (req, res) => {
    res.render('home');
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong'
    res.status(statusCode).render('error', { err })

})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`now serving on ${port}`)
})
