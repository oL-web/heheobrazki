const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const User = require("../models/user");

module.exports = function (passport) {
    const strategySettings = {
        usernameField: 'email',
        passwordField: "password"
    };

    const strategyFunction = async function (email, password, done) {
        const errorMsg = { message: "Konto z takimi danymi nie istnieje, nie zostało aktywowane bądź wygasło!" };
        const user = await User.findOne({ email: email, createdAt: {$exists:false} });

        if (!user) return done(null, false, errorMsg);

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (passwordsMatch) return done(null, user);
        return done(null, false, errorMsg);
    };

    passport.use(new LocalStrategy(strategySettings, strategyFunction));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
};