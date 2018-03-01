const path = require('path');
const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require('socket.io')(server);
const mongoose = require("mongoose");
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require("passport");
const ms = require("times-in-milliseconds");

const log = require("./helpers/log");
const galleryRoute = require("./routes/gallery");
const loginRoute = require("./routes/login");

mongoose.Promise = global.Promise;
// mongodb://localhost/heheobrazki
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@ds153778.mlab.com:53778/heheobrazki`, {
    keepAlive: true,
    useMongoClient: true
});

mongoose.connection.once("open", () => log("Connected to MongoDB"));
mongoose.connection.on("error", (err) => log("MongoDB unreachable"));

if(app.get('env') === 'production') app.set('trust proxy', 1);
app.use(helmet());
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'heheSessionId',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection, autoRemove: 'native' }),
    cookie: { secure: app.get('env') === 'production', maxAge: ms.MINUTE * 15 }
}));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.locals.user = req.user || null;
    next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/gallery", galleryRoute);
app.use("/login", loginRoute);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

io.on('connection', function (socket) {
    socket.on('message sent', function (msg) {
        io.emit('message received', msg);
    });
}); 

const port = process.env.PORT || 8080;
server.listen(port, () => log(`Express server listening on port ${port} in ${app.get("env")} mode`));