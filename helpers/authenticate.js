
module.exports = function (req,res,next) {
    if(req.isAuthenticated()) return next();
    res.render('login', { errors: [{ msg: "Tylko zalogowani użytkownicy mają dostęp do tej strony!"}]});
};