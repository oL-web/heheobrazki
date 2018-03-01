var assert = require("assert");
const mongoose = require("mongoose");

var User = require("../models/user");
var Picture = require("../models/picture");

const log = require("../helpers/log");

describe("Populating referenced documents", function () {
let randUser,randPicture;

    beforeEach((done) => {
        User.create({
            name: "Jan Kowalski",
            password: "Haslo",
            email: "xd@wp.pl"
        }).then(result=>{
            randUser = result;
            Picture.create({
                author: randUser._id,
                title: "Wakacje",
                filename: "siemka.jpg"
            }).then((result)=>{
                randPicture = result;
                done();
             });       
        });
    });




    it("populates picture's author prop", function (done) {
        Picture.findOne({_id:randPicture._id}).populate("author").then(result=>{
            log(result);
        })
    });

});
