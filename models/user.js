var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    password:{type:String, required:true},
    email:{type:String, required:true},
    emailConfirmationToken: String,
    createdAt: { type: Date, expires: 1800 },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

module.exports = mongoose.model("user", userSchema);