"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var crypto = require('./cs142password.js');
var express = require('express');
var app = express();
var fs = require("fs");

// XXX - Your submission should work without this line
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

var MongoStore = require('connect-mongo')(session);
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: 'secretKey',
  	store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));

app.get('/', function (request, response) {
	response.send('Simple web server of files from ' + __dirname);
});

app.post('/checkLogin', function (request, response) {
	if (!request.session) {
		response.send();
		return;
	}
	if (!request.session.user_id) {
		response.send();
		return;
	}

    User.findOne({_id: request.session.user_id}, function(error, user) {
    	if (error) {
    		response.status(400).send();
    		return;
    	}
    	var currUser = JSON.parse(JSON.stringify(user));
		response.status(200).send(JSON.stringify(currUser));
    });

});


app.get('/mentionListAPI/:at', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var atText = request.params.at;
	Photo.find({$text: { $search: atText, $caseSensitive: true}}, function(err, photos) {
		if (err) {
			response.status(400).send();
			return;
		}
		response.status(200).send(photos);
	});
});


app.post('/deleteFavAPI', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var userId = request.body.userId;
	var photoId = request.body.photoId;
	User.findOne({_id: userId}, function(err, user) {
		if (err) {
			response.status(400).send();
			return;
		}
		for (var i=0; i<user.favlist.length; i++) {
			if ((user.favlist[i]._id).toString() === photoId.toString()) {
				console.log('euqal');
				user.favlist[i].remove();
				user.save();
				response.status(200).send();
			}
		}
	});
});

app.post('/likeAPI', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var userId = request.body.userId;
	var photoId = request.body.photoId;
	Photo.findOne({_id: photoId}, function(err, photo) {
		if (err) {
			response.status(400).send();
			return;
		}
		var likeObj = {user_id: userId};

		for (var i=0; i<photo.likes.length; i++) {
			if (photo.likes[i].user_id === userId) {
				photo.likes[i].remove();
				i--;
				photo.save();
				response.status(200).send();
				return;

			}
		}
		photo.likes.push(likeObj);
		photo.save();
		response.status(200).send();
	});
});

app.post('/favoriteAPI', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var userId = request.body.userId;
	var photoId = request.body.photoId;
	Photo.findOne({_id: photoId}, function(err, photo) {
		User.findOne({_id: userId}, function(err, user) {
			var photoObj = JSON.parse(JSON.stringify(photo));
			photoObj.add_time = Date();
			user.favlist.push(photoObj);
			user.save();
			response.status(200).send();
		});
	});

});

app.post('/deleteAccountAPI', function(request,response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var userId = request.body.userId;
	Photo.find({user_id:userId}, function(err, photos) {
		if (err) {
			console.log('error during deleting user account! ',err);
			response.status(400).send();
			return;
		}
		for (var i=0; i<photos.length; i++) {
			for (var c=0; c<photos[i].comments.length; c++) {

				photos[i].comments[c].remove();
				c--;
				photos[i].save();

			}
			delete photos[i];
		}
		Photo.find({}, function(err, photos) {
			for (var j=0; j<photos.length; j++) {

				for (var h=0; h<photos[j].likes.length; h++) {
					if (photos[j].likes[h].user_id === userId) {
						photos[j].likes[h].remove();
						h--;
						photos[j].save();
					}
				}
				for (var k=0; k<photos[j].comments.length; k++) {
					if ((photos[j].comments[k].user_id).toString() === userId.toString()) {
						photos[j].comments[k].remove();
						k--;
						photos[j].save();
					}
				}
			}

			User.find({}, function(err, users) {
				for (var u=0; u < users.length; u++) {
					for(var f=0; f < users[u].favlist.length; f++) {
						if ((users[u].favlist[f].user_id).toString() === userId.toString()) {
							
							users[u].favlist[f].remove();
							f--;
							users[u].save();
						}
					}
				}
				User.findOne({_id:userId}, function(err, user) {
					user.remove();
					user.save();
					response.status(200).send();
				});
			});
		});
	});
});

app.post('/deletePhotoAPI', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var photoId = request.body.photoId;
	var userId = request.body.userId;
	if (userId !== request.session.user_id) {
		console.log('Not logged in user');
		response.status(401).send();
	}
	Photo.findOne({_id: photoId}, function (err, photo) {
		if (err) {
			console.log('error during deleting comment! ',err);
			response.status(400).send();
			return;
		}
		photo.remove();
		User.find({}, function(err, users) {
			for (var i=0; i<users.length; i++) {
				for (var j=0; j<users[i].favlist.length; j++) {
					if ((users[i].favlist[j]._id).toString() === photoId.toString()) {
						users[i].favlist[j].remove();
						j--;
						users[i].save();
					}
				}
			}
			response.status(200).send();	

		});
	});
});

app.post('/deleteCommentAPI', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var commentId = request.body.commentId;
	var photoId = request.body.photoId;
	var userId = request.body.userId;
	if (userId !== request.session.user_id) {
		console.log('Not logged in user');
		response.status(401).send();
	}
	Photo.findOne({_id: photoId}, function (err, photo) {
		if (err) {
			console.log('error during deleting comment! ',err);
			response.status(400).send();
			return;
		}
		for (var i=0; i<photo.comments.length; i++) {
			if ((photo.comments[i]._id).toString() === commentId.toString()) {
				photo.comments[i].remove();
				i--;
				photo.save();
				response.status(200).send();
			} 
		}	
	});
});

app.post('/user', function (request, response) {
	var tmpPasswordObj = crypto.makePasswordEntry(request.body.password);
    var newUserObj = {
        first_name: request.body.first_name, // First name of the user.
        last_name: request.body.last_name,  // Last name of the user.
        location: request.body.location,    // Location  of the user.
        description: request.body.description,  // A brief user description
        occupation: request.body.occupation,    // Occupation of the user.
        login_name: request.body.login_name,
        password_digest: tmpPasswordObj.hash,
        salt: tmpPasswordObj.salt
    };
    User.findOne({login_name: request.body.login_name}, function(error, user) {
    	if (user) {
    		response.status(400).send('User login_name already exists');
    		return;
    	}
	    User.create(newUserObj, function() {
			response.status(200).send();
    	});
    });



});

app.post('/photos/new', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}

	processFormBody(request, response, function (err) {
            if (err || !request.file) {
            	response.status(400).send();
                return;
            }
            console.log('originalname: ', request.file.originalname);
            // request.file has the following properties of interest
            //      fieldname      - Should be 'uploadedphoto' since that is what we sent
            //      originalname:  - The name of the file the user uploaded
            //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
            //      buffer:        - A node Buffer containing the contents of the file
            //      size:          - The size of the file in bytes
            if (!request.file || !request.file.buffer) {
            	response.status(400).send();
                return;
            }
            // We need to create the file in the directory "images" under an unique name. We make
            // the original file name unique by adding a unique prefix with a timestamp.
            var timestamp = new Date().valueOf();
            var filename = 'U' +  String(timestamp) + request.file.originalname;

            fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
				Photo.create({file_name: filename, date_time: timestamp, user_id:request.session.user_id}, function() {
					response.status(200).send();
				});
            });
        });

});

app.post('/commentsOfPhoto/:photo_id', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var photo_id = request.params.photo_id;
	var commentText = request.body.comment;
	var userId = request.session.user_id;
	Photo.findOne({_id: photo_id}, function(error, photo) {
		if (error || !commentText || commentText.length === 0) {
			response.status(400).send();
			return;
		}
		var commentObj = {comment: commentText, user_id: userId, date_time:Date()};
		photo.comments.push(commentObj);
		photo.save();
		response.status(200).send(JSON.stringify(photo));
	});

});

app.post('/admin/logout', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(400).send('No one logged in yet');
		return;
	}
	request.session.destroy(function(err) {
		response.status(400).send(JSON.stringify(err));
		return;
	});
	response.status(200).send();
});

app.post('/admin/login', function(request, response) {
	var login_name = request.body.login_name;
	var loginPassword = request.body.password;

	request.session.login_name = login_name;
	User.findOne({login_name: login_name}, function(error, user) {
		if (error || !user) {
			response.status(400).send(JSON.stringify(error));
			console.log('User login_name not found! ');
			return;
		}
		var currUser = JSON.parse(JSON.stringify(user));


		if (!crypto.doesPasswordMatch(currUser.password_digest, currUser.salt, loginPassword)) {
			response.status(400).send('wrong password');
			return;
		}
		request.session.user_id = currUser._id;
		response.status(200).send(JSON.stringify(currUser));
	});
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	// Express parses the ":p1" from the URL and returns it in the request.params objects.
	console.log('/test called with param1 = ', request.params.p1);

	var param = request.params.p1 || 'info';

	if (param === 'info') {
		// Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
		SchemaInfo.find({}, function (err, info) {
			if (err) {
				// Query returned an error.  We pass it back to the browser with an Internal Service
				// Error (500) error code.
				console.error('Doing /user/info error:', err);
				response.status(500).send(JSON.stringify(err));
				return;
			}
			if (info.length === 0) {
				// Query didn't return an error but didn't find the SchemaInfo object - This
				// is also an internal error return.
				response.status(500).send('Missing SchemaInfo');
				return;
			}

			// We got the object - return it in JSON format.
			console.log('SchemaInfo', info[0]);
			response.end(JSON.stringify(info[0]));
		});
	} else if (param === 'counts') {
		// In order to return the counts of all the collections we need to do an async
		// call to each collections. That is tricky to do so we use the async package
		// do the work.  We put the collections into array and use async.each to
		// do each .count() query.
		var collections = [
			{name: 'user', collection: User},
			{name: 'photo', collection: Photo},
			{name: 'schemaInfo', collection: SchemaInfo}
		];
		async.each(collections, function (col, done_callback) {
			col.collection.count({}, function (err, count) {
				col.count = count;
				done_callback(err);
			});
		}, function (err) {
			if (err) {
				response.status(500).send(JSON.stringify(err));
			} else {
				var obj = {};
				for (var i = 0; i < collections.length; i++) {
					obj[collections[i].name] = collections[i].count;
				}
				response.end(JSON.stringify(obj));

			}
		});
	} else {
		// If we know understand the parameter we return a (Bad Parameter) (400) status.
		response.status(400).send('Bad param ' + param);
	}
});

/*
 * URL /user/list - Return all the User object.
 */

app.get('/user/list', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var infoNeeded  = ['_id', 'first_name', 'last_name'];
	User.find(function(error, users) {
		var allUsers = JSON.parse(JSON.stringify(users));
		for (var i = 0; i < allUsers.length; i++) {
			Object.keys(allUsers[i]).forEach(function(key){
				if (infoNeeded.indexOf(key) < 0) {
					delete allUsers[i][key];
				}
			});
		}
		response.status(200).send(JSON.stringify(allUsers));
	});
});

/*
 * URL /user/:id - Return the information for User (id)
 */

app.get('/user/:id', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	var id = request.params.id;
	User.findOne({_id: id}, function(error, user) {
		if (error) {
			response.status(400).send(JSON.stringify(error));
			return;
		}
		var currUser = JSON.parse(JSON.stringify(user));
		delete currUser.password_digest;
		delete currUser.salt;
		delete currUser.__v;
		delete currUser.login_name;
		response.status(200).send(JSON.stringify(currUser));
	});
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */

app.get('/photosOfUser/:id', function (request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	Photo.find({user_id: request.params.id}, function(error, photos) {
		if (error) {
			response.status(400).send(JSON.stringify(error));
			return;
		}
		var userPhotos = JSON.parse(JSON.stringify(photos));
		async.each(userPhotos, function(photo, done_callback1) {
			delete photo.__v;
			async.each(photo.comments, function(comment, done_callback2) {
				var tmp_userId = comment.user_id;
				delete comment.user_id;
				User.findOne({_id: tmp_userId}, function(error, userObj) {
					if (error) {
						response.status(400).send(JSON.stringify(error));
						return;
					}
					comment.user = JSON.parse(JSON.stringify(userObj));
					if (comment.user) {
						delete comment.user.occupation;
						delete comment.user.description;
						delete comment.user.location;
						delete comment.user.__v;
						delete comment.user.login_name;
						delete comment.user.password_digest;
						delete comment.user.salt;
					}
					done_callback2(error);
				});
			}, function(err) {
				if (err) {
					response.status(400).send(JSON.stringify(error));
				} else {
					done_callback1(err);
				}
			});

		}, function(error) {
			if (error) {
				response.status(400).send(JSON.stringify(error));
			} else {
				response.status(200).send(JSON.stringify(userPhotos));
			}

		});
	});
});

/*
 * URL /allPhotos - Return the photo/comment count and commentsArray for users 
 */
app.get('/allPhotos', function(request, response) {
	if (!request.session || !request.session.user_id) {
		response.status(401).send('error');
		return;
	}
	Photo.find({}, function(error, photos) {
		if (error) {
			response.status(400).send(JSON.stringify(error));
			return;
		}
		var retObj = {}; 
		var allPhotos = JSON.parse(JSON.stringify(photos));
		async.each(allPhotos, function(photoObj, callback1) {
			var currentPhotoUser = retObj[photoObj.user_id];
			if (!currentPhotoUser) {
				retObj[photoObj.user_id] = {};
				retObj[photoObj.user_id].photoNum = 1;
			} else {
				if (!currentPhotoUser.photoNum) {
					retObj[photoObj.user_id].photoNum = 1;
				} else {
					retObj[photoObj.user_id].photoNum += 1;
				}
			}

			async.each(photoObj.comments, function(commentObj, callback2) {
				var currentCommentUser = retObj[commentObj.user_id];
				if (!currentCommentUser) {
					retObj[commentObj.user_id] = {};
					retObj[commentObj.user_id].commentNum = 1;
				} else {
					if (!currentCommentUser.commentNum) {
						retObj[commentObj.user_id].commentNum = 1;
					} else {
						retObj[commentObj.user_id].commentNum += 1;
					}
				}
				if (!retObj[commentObj.user_id].commentsArray) {
					retObj[commentObj.user_id].commentsArray = [];
				}
				var commentConstructor = {};
				commentConstructor.comment = commentObj.comment;
				commentConstructor.photo_user_id = photoObj.user_id;
				commentConstructor.photo_name = photoObj.file_name;
				commentConstructor.photo_id = photoObj._id;

				retObj[commentObj.user_id].commentsArray.push(commentConstructor);

				callback2(error);

			}, function(err) {
				if (err) {
					response.status(400).send(JSON.stringify(err));
					return;     
				}
				callback1(error);
			});
		}, function(err) {
			if (err) {
				response.status(400).send(JSON.stringify(err));
				return;     
			}
			response.status(200).send(JSON.stringify(retObj));
		});

	});
	
});

var server = app.listen(3000, function () {
	var port = server.address().port;
	console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


