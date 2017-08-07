const { describe, it } = require('mocha');
const assert = require('assert');
const request = require('request');
let accesskey = '';

describe('API', function() {

	//Try to create a url with insufficient data
	it('shouldn\'t create a shortened url with insufficient data', function(done) {
		const options = {
			method: 'POST',
			form: {},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Request must contain a valid url');

			done();
		});
	});

	//Try to create a url with a bad name
	it('shouldn\'t create a shortened url with a bad name', function(done) {
		const options = {
			method: 'POST',
			form: {
				name: '*Bad',
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'The name parameter, which is optional, may only contain lowercase letters, numbers, and hyphens');

			done();
		});
	});

	//Try to create a url with a bad secondsUntilExpiration
	it('shouldn\'t create a shortened url with a bad secondsUntilExpiration', function(done) {
		const options = {
			method: 'POST',
			form: {
				secondsUntilExpiration: 'bad',
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'The secondsUntilExpiration parameter, which is optional, must be a positive integer');

			done();
		});
	});

	//Try to create a url with a negative secondsUntilExpiration
	it('shouldn\'t create a shortened url with a negative secondsUntilExpiration', function(done) {
		const options = {
			method: 'POST',
			form: {
				secondsUntilExpiration: -10,
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'The secondsUntilExpiration parameter, which is optional, must be a positive integer');

			done();
		});
	});

	//Try to create a shortened url with a random name
	it('should create a shortened url with proper data', function(done) {
		const options = {
			method: 'POST',
			form: {
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, name, secondsUntilExpiration, key} = JSON.parse(body);
			assert.equal(httpCode,200);
			assert.equal(name.length, 6);
			assert.equal(key.length, 36);
			assert.equal(secondsUntilExpiration, 604800);

			done();
		});
	});

	//Try to create a shortened url with no expiration date
	it('should create a shortened url with no expiration date when passed 0 for secondsUntilExpiration', function(done) {
		const options = {
			method: 'POST',
			form: {
				url: 'http://lynn-miller.com/',
				secondsUntilExpiration: 0
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, name, secondsUntilExpiration, key} = JSON.parse(body);
			assert.equal(httpCode,200);
			assert.equal(name.length, 6);
			assert.equal(key.length, 36);
			assert.equal(secondsUntilExpiration, 0);

			options.method = 'GET';
			delete options.qs;
			options.url = 'http://localhost:3000/api/v1/'+name;

			request(options, function(error, response, body) {
				if (error) throw new Error(error);

				assert.equal(response.request.uri.href, 'http://lynn-miller.com/');

				done();
			});
		});
	});

	//Try to create a shortened url with a custom name
	it('should create a shortened url with a custom name', function(done) {
		const options = {
			method: 'POST',
			form: {
				name: 'beau',
				url: 'http://lynn-miller.com/',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, name, key, secondsUntilExpiration} = JSON.parse(body);
			assert.equal(httpCode, 200);
			assert.equal(name, 'beau');
			assert.equal(key.length, 36);
			assert.equal(secondsUntilExpiration, 604800);
			accesskey = key;

			done();
		});
	});

	//Try to reuse the same custom name
	it('should not allow me to use the same custom name twice', function(done) {
		const options = {
			method: 'POST',
			form: {
				name: 'beau',
				url: 'http://lynn-miller.com/',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message, key, secondsUntilExpiration} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name is already taken');

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

			assert.equal(response.request.uri.href, 'http://lynn-miller.com/');

			done();
		});
	});

	//Try to get information about the original url from the shortened url
	it('should return information about the original url from the shortened one', function(done) {
		const options = {
			method: 'GET',
			qs: { key: accesskey },
			url: 'http://localhost:3000/api/v1/beau'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, url, secondsUntilExpiration, hits, lastUsed} = JSON.parse(body);
			assert.equal(httpCode, 200);
			assert.equal(url, 'http://lynn-miller.com/');
			assert.notEqual(Date.parse(lastUsed), NaN);
			assert.equal(hits, 1);

			done();
		});
	});

	//Try to update the shortened url
	it('should update the url when supplied the key', function(done) {
		let options = {
			method: 'PUT',
			form: {
				key: accesskey,
				name: 'beau',
				url: 'http://dangertravels.com/about',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			options.method = 'GET';
			delete options.qs;
			options.url = 'http://localhost:3000/api/v1/beau';

			request(options, function(error, response, body) {
				if (error) throw new Error(error);

				assert.equal(response.request.uri.href, 'http://dangertravels.com/about');

				done();
			});
		});
	});

	//Try to update a url without enough data
	it('should return an error when the user tries to update a url without sending enough data', function(done) {
		const options = {
			method: 'PUT',
			form: {
				key: accesskey,
				name: 'beau'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'You must include either a url or a secondsUntilExpiration with this request');

			done();
		});
	});

	//Try to update a url with an invalid key
	it('should return an error when the user tries to update a url with an invalid key', function(done) {
		const options = {
			method: 'PUT',
			form: {
				key: 'fd13237c-83d0-4e6e-80c8-0a0000b00000',
				name: 'beau',
				url: 'http://dangertravels.com/about',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name/key combination didn\'t work');

			done();
		});
	});

	//Try to delete the shortened url
	it('should delete the shortened url when supplied the key', function(done) {
		let options = {
			method: 'DELETE',
			form: {
				key: accesskey,
				name: 'beau'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 200);
			assert.equal(message, 'Shortened url deleted');

			options.method = 'GET';
			delete options.qs;
			options.url = 'http://localhost:3000/api/v1/beau';

			request(options, function(error, response, body) {
				if (error) throw new Error(error);
				const {httpCode, message} = JSON.parse(body);
				assert.equal(httpCode, 404);
				assert.equal(message, 'Sorry, there\'s no url with that name');

				done();
			});
		});
	});

	//Try to create a url with a very short lifetime
	it('should be able to create a shortened url with a short lifetime', function(done) {
		const options = {
			method: 'POST',
			form: {
				secondsUntilExpiration: 1,
				url: 'http://lynn-miller.com/'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, name} = JSON.parse(body);
			assert.equal(httpCode, 200);
			assert.equal(name.length, 6);

			//Make sure the url expired in time
			setTimeout(function() {
				options.method = 'GET';
				delete options.qs;
				options.url = 'http://localhost:3000/api/v1/'+name;

				request(options, function(error, response, body) {
					if (error) throw new Error(error);

					const {httpCode, message} = JSON.parse(body);
					assert.equal(httpCode, 404);
					assert.equal(message, 'Sorry, there\'s no url with that name');

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
			assert.equal(httpCode, 404);
			assert.equal(message, 'Sorry, there\'s no url with that name');

			done();
		});
	});

	//Try to update a url that doesn't exist
	it('should return an error when the user tries to update a url that doesn\'t exist', function(done) {
		const options = {
			method: 'PUT',
			form: {
				key: accesskey,
				name: 'asdf',
				url: 'http://dangertravels.com/about',
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name/key combination didn\'t work');

			done();
		});
	});

	//Try to delete a url that doesn't exist
	it('should return an error when the user tries to delete a url that doesn\'t exist', function(done) {
		const options = {
			method: 'DELETE',
			form: {
				key: accesskey,
				name: 'asdf'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name/key combination didn\'t work');

			done();
		});
	});

	//Try to delete a url with an invalid key
	it('should return an error when the user tries to delete a url with an invalid key', function(done) {
		const options = {
			method: 'DELETE',
			form: {
				key: 'fd13237c-83d0-4e6e-80c8-0a0000b00000',
				name: 'beau'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name/key combination didn\'t work');

			done();
		});
	});

	//Try to delete a url that's already been deleted
	it('should return an error when the user tries to delete a url that\'s already been deleted', function(done) {
		const options = {
			method: 'DELETE',
			form: {
				key: accesskey,
				name: 'beau'
			},
			url: 'http://localhost:3000/api/v1/'
		};

		request(options, function(error, response, body) {
			if (error) throw new Error(error);

			const {httpCode, message} = JSON.parse(body);
			assert.equal(httpCode, 400);
			assert.equal(message, 'Sorry, that name/key combination didn\'t work');

			done();
		});
	});

	//Try to exceed the rate limit

});