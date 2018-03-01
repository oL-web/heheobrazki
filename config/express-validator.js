const { check } = require('express-validator/check');
const User = require("../models/user");

module.exports = {
    checkName(name){
        return check(name, "Nazwa musi zawierać co najmniej 4 znaki!")
        .trim()
        .isLength({ min: 4 });
    },
    
    checkEmailNotExists(name){
        return check(name,'Pole musi zawierać prawidłowy adres email!')
        .trim()
        .isEmail()
        .normalizeEmail()
        .custom(value => {
           return User.findOne({email:value}).then(user => {
            if(user) throw new Error('Konto z takim adresem email już istnieje!');
            return true;
          });
        });
    },
    
    checkEmailExists(name){
        return check(name,'Pole musi zawierać prawidłowy adres email!')
        .trim()
        .isEmail()
        .normalizeEmail()
        .custom(value => {
           return User.findOne({email:value}).then(user => {
            if(!user) throw new Error('Nie ma konta z takim adresem email!');
            return true;
          });
        });
    },

    checkPassword(name){
        return check(name, 'Hasła muszą mieć od 6 do 32 znaków!')
        .isLength({ min: 6,max:32 });
    },
    
    checkPasswordRepeat(name){
        return check(name, 'Hasła muszą być takie same!')
        .custom((value, { req }) => value === req.body.password);
    }
};