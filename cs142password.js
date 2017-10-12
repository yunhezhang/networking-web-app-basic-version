"use strict";

var crypto = require('crypto');

module.exports = {
	makePasswordEntry: function (clearTextPassword) {
		var hash = crypto.createHash('sha1');
		var randomSalt = String(crypto.randomBytes(16));
		hash.update(clearTextPassword+randomSalt);
		return {hash: hash.digest('hex'), salt: randomSalt};
	},
	doesPasswordMatch: function (hash, salt, clearTextPassword) {
		var hashMatch = crypto.createHash('sha1');
		hashMatch.update(clearTextPassword+salt);
		return hashMatch.digest('hex') === hash;
	}
};