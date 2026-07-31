const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/** Vrai si la chaîne est déjà un condensat bcrypt. */
const isHashed = (value) => typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

module.exports.hash = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);

module.exports.verify = async (plain, hashed) => bcrypt.compare(plain, hashed);

module.exports.isHashed = isHashed;
