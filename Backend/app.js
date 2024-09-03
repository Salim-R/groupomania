const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: '.env' })
require('./db');
const path = require('path');
const helmet = require('helmet');
const userRoutes = require('./routes/user.routes.js');
const postRoutes = require('./routes/post.routes.js');
const { checkUser, requireAuth } = require('./middleware/auth');
const cors = require('cors');
const app = express();

//logger les req et res
app.use(morgan("dev"));
const corsOptions = {
    origin: process.env.REACT_APP_CLIENT_URL,
    credentials: true,
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.REACT_APP_CLIENT_URL);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(cookieParser());

app.use(helmet());

app.get('*', checkUser);
app.get('/jwtid', requireAuth, (req, res) => {
    res.status(200).send(res.locals.user._id)
});
//routes
app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
module.exports = app;