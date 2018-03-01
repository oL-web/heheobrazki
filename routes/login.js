const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const bcrypt = require("bcryptjs");
const crypto = require('mz/crypto')
const passport = require("passport");
const nodemailer = require('nodemailer');

const User = require("../models/user");
const log = require("../helpers/log");
const nodemailerConfig = require("../config/nodemailer");
const validationTests = require("../config/express-validator");

router.get("/", (req, res) => {
    res.render("login");
});

router.get("/forgottenpassword", (req, res) => {
    res.render("login/forgottenpassword");
});

router.get("/resetpassword/:token", (req, res) => {
    res.render("login/resetpassword");
});

router.post("/signin", (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) return next(err);
        if (!user) {
            return res.render('login', { errors: [{ msg: info.message }] });
        }
        req.logIn(user, function (err) {
            if (err) return next(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

router.post("/resetpassword/:token", [
    validationTests.checkPassword('password'),
    validationTests.checkPasswordRepeat('password-repeat')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("login/resetpassword", {
            errors: errors.array()
        });
    }

    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        return res.render('login/resetpassword', { errors: [{ msg: "Twój token zmiany hasła jest nieprawidłowy lub wygasł." }] });
    }

    req.logout();
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(req.body.password, salt);
    user.password = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.save();

    res.render("login", {
        success: `Hasło konta ${user.name} zostało pomyślnie zmienione! Zaloguj się ponownie.`
    });
});

router.post("/forgottenpassword", [
    validationTests.checkEmailExists("email")]
    , async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("login/forgottenpassword", {
                errors: errors.array()
            });
        }

        let token = await crypto.randomBytes(20);
        token = await token.toString('hex');
        const user = await User.findOne({ email: req.body.email });

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 900000;
        user.save();

        const transport = nodemailer.createTransport(nodemailerConfig);

        const tokenLink = `${req.protocol}://${req.headers.host}/login/resetpassword/${token}`;

        const mailOptions = {
            from: nodemailerConfig.auth.user,
            to: user.email,
            subject: 'ElipsaTeam - zmiana hasła',
            text: `Na adres ${user.email} wypłynęło żądanie zmiany hasła konta ${user.name}.

        Żądanie to wygaśnie w przeciągu 15 minut. Jeśli to nie ty żądałeś zmiany hasła, zignoruj ten email. W przeciwnym wypadku, aby zresetować swoje hasło do konta, kliknij lub skopiuj poniższy link:
        
        ${tokenLink}`,
            html: `
          <h1>ElipsaTeam</h1>
          <h2>Zmiana hasła konta ${user.name}</h2>
          <p>Na adres ${user.email} wypłynęło żądanie zmiany hasła konta ${user.name}.</p>
          <p>Żądanie to wygaśnie w przeciągu 15 minut. Jeśli to nie ty żądałeś zmiany hasła, zignoruj ten email. W przeciwnym wypadku, aby zresetować swoje hasło do konta, kliknij poniższy odnośnik:</p>
            <a href="${tokenLink}">Zresetuj hasło</a>
            <p>Jeśli nie widzisz odnośnika, skopiuj do przeglądarki poniższy link:</p>

            ${tokenLink}`
        };

        transport.sendMail(mailOptions, function (err) {
            res.render("login/forgottenpassword", {
                success: `Pomyślnie wysłano żądanie zmiany hasła na adres ${user.email}`
            });
        });
    });

router.post("/signup", [
    validationTests.checkName("name"),
    validationTests.checkEmailNotExists("email"),
    validationTests.checkPassword('password'),
    validationTests.checkPasswordRepeat('password-repeat')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("login", {
            errors: errors.array()
        });
    }

    const user = matchedData(req);

    async function hashPassword() {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
    }

    async function genToken() {
        let token = await crypto.randomBytes(20);
        token = await token.toString('hex');
        user.emailConfirmationToken = token;
    }

    await Promise.all([hashPassword(), genToken()]);

    user.createdAt = Date.now();
    User.create(user);

    const transport = nodemailer.createTransport(nodemailerConfig);

    const tokenLink = `${req.protocol}://${req.headers.host}/login/${user.emailConfirmationToken}`;

    const mailOptions = {
        from: nodemailerConfig.auth.user,
        to: user.email,
        subject: 'ElipsaTeam - potwierdź rejestrację konta',
        text: `Na adres ${user.email} wypłynęło żądanie utworzenia konta ${user.name}.

            Żądanie to wygaśnie w przeciągu 30 minut. Jeśli to nie ty żądałeś utworzenia konta, zignoruj ten email. W przeciwnym wypadku, aby aktywować swoje konto, kliknij lub skopiuj poniższy link:
        
        ${tokenLink}`,
        html: `
            <h1>ElipsaTeam</h1>
            <h2>Potwierdzenia aktywacji konta ${user.name}</h2>
            <p>Na adres ${user.email} wypłynęło żądanie utworzenia konta ${user.name}.</p>
            <p>Żądanie to wygaśnie w przeciągu 30 minut. Jeśli to nie ty żądałeś utworzenia konta, zignoruj ten email. W przeciwnym wypadku, aby aktywować swoje konto, kliknij lub skopiuj poniższy odnośnik:</p>
            <a href="${tokenLink}">Aktywuj konto</a>
            <p>Jeśli nie widzisz odnośnika, skopiuj do przeglądarki poniższy link:</p>

            ${tokenLink}`
    };

    transport.sendMail(mailOptions, function (err) {
        res.render("login", {
            success: `Na twój adres email ${user.email} wysłano link aktywacyjny do twojego konta.`
        });
    });
});

router.get("/:token", async (req, res) => {
    const user = await User.findOne({ emailConfirmationToken: req.params.token });
    if (!user) {
        return res.render("login", {
            errors: [{ msg: "Nie udało się zaktywować konta - token jest nieprawidłowy bądź konto już wygasło!" }]
        });
    }

    user.emailConfirmationToken = undefined;
    user.createdAt = undefined;
    user.save();
    res.render("login", {
        success: `Twoje konto ${user.name} zostało aktywowane! Możesz już się zalogować.`
    });
});

module.exports = router;
