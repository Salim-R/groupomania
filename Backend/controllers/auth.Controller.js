const jwt = require('jsonwebtoken');
const User = require('../models/user.model')
const cryptojs = require('crypto-js');
const dotenv = require("dotenv"); const result = dotenv.config();
const bcrypt = require('bcrypt');
const { signUpErrors, signInErrors } = require('../utilis/errors.utils');

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (id) => {
    return jwt.sign({ id }, process.env.TOKEN_SECRET, {
        expiresIn: maxAge
    })
};

exports.signup = async (req, res) => {
    const { pseudo, email, password } = req.body

    try {
        const user = await User.create({ pseudo, email, password });
        res.status(201).json({ user: user._id });
    }
    catch (err) {
        const errors = signUpErrors(err);
        res.status(200).send({ errors })
    }
}

exports.signIn = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge });
        res.status(200).json({ user: user._id, isAdmin: user.isAdmin })
    } catch (err) {
        const errors = signInErrors(err);
        res.status(200).json({ errors });
    }
}

module.exports.logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
}

