const express = require('express');
const router = express.Router();
const fs = require("fs");
const ObjectId = require('mongoose').Types.ObjectId;

const log = require("../helpers/log");
const User = require("../models/user");
const Picture = require("../models/picture");
const multerConfig = require("../config/multer");
const authenticate = require("../helpers/authenticate");


router.get("/", async (req, res) => {
    res.redirect("/gallery/1");
});

router.get("/addpicture", authenticate, async (req, res) => {
    res.render("gallery/addpicture");
});

router.post("/addpicture", authenticate, (req, res) => {
    multerConfig.single('picture')(req, res, async (err) => {
        try {
            if (!req.file) {
                return res.status(400).json({ msg: "Podany przez ciebie plik nie istnieje, ma nieobsługiwany format lub zbyt duży rozmiar!" });
            }
            
            const pic = await Picture.create({
                title: req.body.title,
                description: req.body.description || undefined,
                author: req.user.id,
                timestamp: Date.now(),
                filename: req.file.filename
            });

            return res.status(201).json({ msg: "OK!" });
        }
        catch (e) {
            fs.unlink(req.file.path, (err) => {
                return res.status(400).json({ msg: "Podaj tytuł obrazka!" });
            });
        }
    });
});

router.post("/picture/addcomment", authenticate, async (req, res) => {
    try {
        if (req.body.comment.length < 1) throw new Error("Komentarz nie moze byc pusty!");
        const picture = await Picture.findById(req.body.pictureId).populate("author", "name");

        picture.comments.addToSet({
            author: req.user.id,
            timestamp: Date.now(),
            message: req.body.comment
        });
        await picture.save();

        res.redirect(req.get('referer'));
    } catch (e) {
        res.end(e.message);
    }
});

router.post("/upvotepicture/:pictureId", async (req, res) => {
    try {
        if (!req.user) return res.status(401).end("Musisz być zalogowany aby głosować!");

        await Picture.findByIdAndUpdate(req.params.pictureId,{
            $addToSet: {"upvotesFrom": req.user.id},   
        });
        
        res.status(200).end();
    } catch (e) {
        res.status(400).send(e.message);
    }
});

router.post("/upvotecomment/:commentId", async (req, res) => {
    try {
        if (!req.user) return res.status(401).end("Musisz być zalogowany aby głosować!");

        await Picture.findOneAndUpdate({
            _id: req.body.pictureId,
            "comments._id": req.params.commentId
         },
         {
            $addToSet: {"comments.$.upvotesFrom": req.user.id},         
         });

        res.status(200).end();
    } catch (e) {
        res.status(400).send(e.message);
    }
});

router.get("/picture/:pictureId", async (req, res) => {
    try {
        const picture = await Picture.findById(req.params.pictureId).populate("author", "name").populate("comments.author", "name");
        if (!picture) throw new Error("Nie znaleziono obrazka z takim ID!");

        res.render("gallery/picture", {
            picture: picture,
            pictureId: req.params.pictureId,
            pictureAuthorId: ObjectId(picture.author.id)
        });
    } catch (e) {
        return res.status(404).end(e.message);
    }
});

router.get("/:page", async (req, res) => {
    try {
        const page = parseInt(req.params.page);
        if (isNaN(page) || page - 1 <= -1) throw new Error("Nie znaleziono takiej strony w galerii!");

        const pictures = await Picture.paginate({}, {
            sort: { timestamp: -1 },
            populate: { path: 'author', select: 'name' },
            page: page,
            limit: 5
        });

        res.render("gallery", {
            pictures: pictures.docs,
            page: page,
            totalPages: Math.ceil(pictures.total / 5)
        });
    } catch (e) {
        res.status(404).send(e.message);
    }
});

module.exports = router;