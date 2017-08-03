const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const MongoClient = require('mongodb').MongoClient;

//Open a database connection once to be used throughout the lifetime of th app
let db = null;
MongoClient.connect('mongodb://localhost:27017/boundless').then((database) => {
	db = database;
}).catch((err) => {
	console.log('Error connecting to the database', err);
	process.exit();
});

//Create / POST
router.post('/', (req, res) => {
	//Make sure the request contains a valid url
	req.checkBody('url', 'Request must contain a valid url').notEmpty().isURL();

	//If the request contains a name, make sure it's valid
	req.checkBody('name', 'The name parameter, which is optional, may only contain lowercase letters, numbers, and hyphens').optional().matches(/^[a-z0-9-]+$/);

	//If the request contains an expiration time, make sure it's valid
	req.checkBody('secondsUntilExpiration', 'The secondsUntilExpiration parameter, which is optional, must be a positive integer').optional().isInt().isPositive();

	//Get any validation errors
	req.getValidationResult().then(async (result) => {
		//If there were any errors
		if(!result.isEmpty()) {
			//Return an error response
			return res.status(400).send({httpCode: 400, message: result.useFirstErrorOnly().array()[0].msg});
		}

		//Instatniate a name parameter
		let name = '';

		//If the user supplied a name
		if(req.body.name) {
			try {
				let result = await db.collection('urls').findOne({'name': req.body.name});
				//If that name is already taken
				if(result !== null) {
					//Return an error
					return res.status(400).send({httpCode: 400, message: 'Sorry, that name is already taken'});
				}
			}
			catch(error) {
				console.log(error);
			}

			//If we've gotten here, their name is fine to use
			name = req.body.name;
		}
		//Otherwise
		else {
			//Until we pick a unique name
			let result = 'anything';
			while(result !== null) {
				//Generate one
				name = Math.random().toString(36).slice(2, 8);

				//Check if it's already in the database
				result = await db.collection('urls').findOne({name});
			}
		}

		//Instatniate a secondsUntilExpiration parameter
		let secondsUntilExpiration = '';

		//If the user supplied a secondsUntilExpiration
		if(req.body.secondsUntilExpiration) {
			//Use that
			secondsUntilExpiration = parseInt(req.body.secondsUntilExpiration, 10);
		}
		//Otherwise
		else {
			//Default to a week
			secondsUntilExpiration = 604800;
		}

		let expirationDate = null;
		//If the user wants the url to last forever
		if(req.body.secondsUntilExpiration && req.body.secondsUntilExpiration === '0') {
			//Just use the maximum date
			expirationDate = new Date('9999-01-01T01:01:01');
		}
		//Otherwise
		else {
			//Calculate the expiration date based on the secondsUntilExpiration
			expirationDate = new Date();
			expirationDate.setSeconds(expirationDate.getSeconds() + secondsUntilExpiration);
		}

		//Generate a secret key for this record
		const key = uuidv4();

		//Save all the information to the database
		try {
			await db.collection('urls').insert({
				expirationDate,
				hits: 0,
				key,
				lastUsed: new Date(),
				name,
				url: req.body.url
			});
		} catch (err) {
			return res.status(400).send({httpCode: 400, message: 'Sorry, there was an error saving your url'});
		}

		//Return the result
		return res.status(200).send({
			httpCode: 200,
			key,
			name,
			secondsUntilExpiration
		});
	});
});


//Read / GET
router.get('/:name', (req, res) => {
	//Make sure the request actually has a name
	req.checkParams('name', 'Invalid url parameter').notEmpty().matches(/^[a-z0-9-]+$/);

	//Get any validation errors
	req.getValidationResult().then(async (result) => {
		//If there were any errors
		if(!result.isEmpty()) {
			//Return an error response
			return res.status(400).send({httpCode: 400, message: result.useFirstErrorOnly().array()[0].msg});
		}

		//Try to get a database record using that name
		let urlRecord = null;
		try {
			urlRecord = await db.collection('urls').find({'expirationDate': {$gte: new Date()}, 'name': req.params.name}).sort({_id: -1}).limit(1).next();

			//Update the lastUsed parameter and increment the hit count
			db.collection('urls').update({'name': req.params.name}, {$inc: {hits: 1}, $set: {lastUsed: new Date()}});

			//Redirect the user to the corresponding url
			return res.redirect(307, urlRecord.url);
		} catch (err) {
			return res.status(404).send({httpCode: 404, message: 'Sorry, there\'s no url with that name'});
		}
	});
});


//Update / PUT
router.put('/', (req, res) => {
	//Make sure the request contains a valid key
	req.checkBody('key', 'Request must contain a valid key').isUUID(4);

	//Make sure the request contains a valid name
	req.checkBody('name', 'Request must contain a valid name').matches(/^[a-z0-9-]+$/);

	//If the request contains a url, make sure it's valid
	req.checkBody('url', 'The url parameter, which is optional, must be a valid url').optional().isURL();

	//If the request contains an expiration time, make sure it's valid
	req.checkBody('secondsUntilExpiration', 'The secondsUntilExpiration parameter, which is optional, must be a positive integer').optional().isInt().isPositive();

	//Get any validation errors
	req.getValidationResult().then(async (result) => {
		//If there were any errors
		if(!result.isEmpty()) {
			//Return an error response
			return res.status(400).send({httpCode: 400, message: result.useFirstErrorOnly().array()[0].msg});
		}

		//If the request has neither a url nor a secondsUntilExpiration
		if(!req.body.url && !req.body.secondsUntilExpiration) {
			//Return an error
			return res.status(400).send({httpCode: 400, message: 'You must include either a url or a secondsUntilExpiration with this request'});
		}

		//Initialize the update object
		let updateParameters = {$set: {}};

		//If a url was sent
		if(req.body.url) {
			//Add it to the update object
			updateParameters.$set.url = req.body.url;
		}

		//If the user wants the url to last forever
		if(req.body.secondsUntilExpiration && req.body.secondsUntilExpiration === '0') {
			//Just use the maximum date
			let expirationDate = new Date('9999-01-01T01:01:01');

			//Add it to the update object
			updateParameters.$set.expirationDate = expirationDate;
		}
		//Otherwise if they still want to update the expiration date
		else if(req.body.secondsUntilExpiration) {
			//Calculate the new expiration date
			let expirationDate = new Date();
			expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(req.body.secondsUntilExpiration, 10));

			//Add it to the update object
			updateParameters.$set.expirationDate = expirationDate;
		}

		//Try to update records based on the supplied name/key combination
		let urlRecord = null;
		try {
			urlRecord = await db.collection('urls').update({'key': req.body.key, 'name': req.body.name}, updateParameters);

			//If no records were modified
			if(urlRecord.result.nModified < 1) {
				//Return an error
				return res.status(400).send({httpCode: 400, message: 'Sorry, that name/key combination didn\'t work'});
			}

			updateParameters.httpCode = 200;
			return res.status(200).send(updateParameters);
		} catch (err) {
			return res.status(400).send({httpCode: 400, message: 'Sorry, that name/key combination didn\'t work'});
		}
	});
});


//Delete / DELETE
router.delete('/', (req, res) => {
	//Make sure the request contains a valid key
	req.checkBody('key', 'Request must contain a valid key').isUUID(4);

	//Make sure the request contains a valid name
	req.checkBody('name', 'Request must contain a valid name').matches(/^[a-z0-9-]+$/);

	//Get any validation errors
	req.getValidationResult().then(async (result) => {
		//If there were any errors
		if(!result.isEmpty()) {
			//Return an error response
			return res.status(400).send({httpCode: 400, message: result.useFirstErrorOnly().array()[0].msg});
		}

		//Try to delete the record based on the supplied name/key combination
		let urlRecord = null;
		try {
			urlRecord = await db.collection('urls').removeOne({'key': req.body.key, 'name': req.body.name});

			//If no records were modified
			if(urlRecord.deletedCount < 1) {
				//Return an error
				return res.status(400).send({httpCode: 400, message: 'Sorry, that name/key combination didn\'t work'});
			}

			return res.status(200).send({httpCode: 200, message: 'Shortened url deleted'});
		} catch (err) {
			return res.status(400).send({httpCode: 400, message: 'Sorry, that name/key combination didn\'t work'});
		}
	});
});

module.exports = router;
