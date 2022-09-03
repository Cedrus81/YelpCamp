const User = require('../models/user')

module.exports.loginForm = (req, res) => {
    res.render('users/login')
}

module.exports.loginPost = (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Goodbye!");
        res.redirect('/campgrounds');
    });
}

module.exports.registerForm = (req, res) => {
    res.render('users/register');
}

module.exports.registerPost = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username })
        const newUser = await User.register(user, password)
        req.login(newUser, err => {
            if (err) return next(err);
            req.flash(`success`, `welcome to the YelpCamp community, ${username}!`)
            res.redirect('/campgrounds')
        })
    }
    catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }
}