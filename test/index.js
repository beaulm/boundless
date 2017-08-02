const { describe, it } = require('mocha');
const assert = require('assert');
const request = require('request');
let accesskey = '';

describe('API', function() {

	//Try to create a url with insufficient data
	it('shouldn\'t create a shortened url with insufficient data', function(done) {
		const options = {
			method: 'POST',
			qs: {},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(400, httpCode);
			assert.equal('Insufficient data', message);

			done();
		});
	});

	//Try to create a shortened url with a random name
	it('should create a shortened url with proper data', function(done) {
		const options = {
			method: 'POST',
			qs: {
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message, secondsUntilExpiration, key} = JSON.parse(body);
			assert.equal(200, httpCode);
			assert.equal(6, message.length);
			assert.equal(64, key.length);
			assert.equal(604800, secondsUntilExpiration);

			done();
		});
	});

	//Try to create a shortened url with a custom name
	it('should create a shortened url with a custom name', function(done) {
		const options = {
			method: 'POST',
			qs: {
				name: 'beau',
				url: 'http://lynn-miller.com/',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message, key} = JSON.parse(body);
			assert.equal(200, httpCode);
			assert.equal('beau', message);
			assert.equal(64, key.length);
			assert.equal(604800, secondsUntilExpiration);
			accesskey = key;

			done();
		});
	});

	//Try to get the original url from the shortened url
	it('should return the original url from the shortened one', function(done) {
		const options = {
			method: 'GET',
			url: 'http://localhost:3000/api/v1/beau'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(200, httpCode);
			assert.equal('http://lynn-miller.com/', message);

			done();
		});
	});

	//Try to update the shortened url
	it('should update the url when supplied the key', function(done) {
		let options = {
			method: 'PUT',
			qs: {
				key: accesskey,
				url: 'http://dangertravels.com/',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			options.method = 'GET';
			delete options.qs;

			request(options, function(error, response, body) {
				if (error) throw new Error(error);

				const {httpCode, message} = JSON.parse(body);
				assert.equal(200, httpCode);
				assert.equal('http://dangertravels.com/', message);

				done();
			});
		});
	});

	//Try to update a url without enough data
	it('should return an error when the user tries to update a url without sending enough data', function(done) {
		const options = {
			method: 'PUT',
			qs: {
				key: accesskey,
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(400, httpCode);
			assert.equal('Please provide either a url, an expiration time, or both', message);

			done();
		});
	});

	//Try to update a url with an invalid key
	it('should return an error when the user tries to update a url with an invalid key', function(done) {
		const options = {
			method: 'PUT',
			qs: {
				key: 'fakekey',
				url: 'http://dangertravels.com/',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(401, httpCode);
			assert.equal('Invalid key', message);

			done();
		});
	});

	//Try to delete the shortened url
	it('should delete the shortened url when supplied the key', function(done) {
		let options = {
			method: 'DELETE',
			qs: {
				key: accesskey
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(200, httpCode);
			assert.equal('Shortened url deleted', message);

			options.method = 'GET';
			delete options.qs;
			options.url = 'http://localhost:3000/api/v1/beau';

			request(options, function(error, response, body) {
				if (error) throw new Error(error);
				const {httpCode, message} = JSON.parse(body);
				assert.equal(404, httpCode);
				assert.equal('Sorry, there\'s no url with that name', message);

				done();
			});
		});
	});

	//Try to create a url with a very short lifetime
	it('should be able to create a shortened url with a short lifetime', function(done) {
		const options = {
			method: 'POST',
			qs: {
				name: 'beau',
				secondsUntilExpiration: 1,
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message, secondsUntilExpiration, key} = JSON.parse(body);
			assert.equal(200, httpCode);
			assert.equal(6, message.length);
			assert.equal(64, key.length);
			assert.equal(1, secondsUntilExpiration);

			//Make sure the url expired in time
			setTimeout(function() {
				options.method = 'GET';
				delete options.qs;
				options.url = 'http://localhost:3000/api/v1/beau';

				request(options, function(error, response, body) {
					if (error) throw new Error(error);
					const {httpCode, message} = JSON.parse(body);
					assert.equal(404, httpCode);
					assert.equal('Sorry, there\'s no url with that name', message);

					done();
				});
			}, 1001);
		});
	});

	//Try to get a url that doesn't exist
	it('should return an error when the user tries to get a url that doesn\'t exist', function(done) {
		const options = {
			method: 'GET',
			url: 'http://localhost:3000/api/v1/adsf'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(404, httpCode);
			assert.equal('Sorry, there\'s no url with that name', message);

			done();
		});
	});

	//Try to update a url that doesn't exist
	it('should return an error when the user tries to update a url that doesn\'t exist', function(done) {
		const options = {
			method: 'PUT',
			qs: {
				key: accesskey,
				url: 'http://dangertravels.com/',
			},
			url: 'http://localhost:3000/api/v1/adsf'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(404, httpCode);
			assert.equal('Sorry, there\'s no url with that name', message);

			done();
		});
	});

	//Try to delete a url that doesn't exist
	it('should return an error when the user tries to delete a url that doesn\'t exist', function(done) {
		const options = {
			method: 'DELETE',
			qs: {
				key: accesskey,
			},
			url: 'http://localhost:3000/api/v1/adsf'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(404, httpCode);
			assert.equal('Sorry, there\'s no url with that name', message);

			done();
		});
	});

	//Try to delete a url with an invalid key
	it('should return an error when the user tries to delete a url with an invalid key', function(done) {
		const options = {
			method: 'DELETE',
			qs: {
				key: 'fakekey',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(401, httpCode);
			assert.equal('Invalid key', message);

			done();
		});
	});

	//Try to delete a url that's already been deleted
	it('should return an error when the user tries to delete a url that\'s already been deleted', function(done) {
		const options = {
			method: 'DELETE',
			qs: {
				key: accesskey,
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(404, httpCode);
			assert.equal('Sorry, there\'s no url with that name', message);

			done();
		});
	});

	//Try to exceed the rate limit

});