# Boundless
A sample url shortener

### Requirements
The latest version of `node.js` is required for this snazzy new URL shortener. Check out [nvm](https://github.com/creationix/nvm) for managing node version.

### Installation
*   Install MongoDB server and start it running on port 27017
*   Create a `boundless` collection in Mongo
*   Download or clone this repository
*   `cd` into the directory you just created
*   `npm install`
*   `npm start`

### Testing
`npm test` will run all the integration tests.

### API

All requests and responses should be in JSON, and all responses will contain the HTTP status code of the response in the message body.

#### Create
*   URL: `/api/v1/`
*   Method: `PUT`
*   Params: `url` (required), `name` (optional), `secondsUntilExpiration` (optional)
*   Response: `httpCode`, `key`, `name`, `secondsUntilExpiration`

`url` is the url you'd like to shorten.  
`name` is the short code you'd like to use, if possible (an error will be returned if it's already taken or isn't a valid URL).  
`secondsUntilExpiration` is how long you'd like your short url to live for. The default is one week. 0 will create a url that won't ever expire.  
  
`key` is a secret code generated for this url so you can update/delete it later.  
`name` is the shortened url code.  
`secondsUntilExpiration` is how many seconds left until the short url expires.  

#### Read
*   URL: `/api/v1/{name}`
*   Method: `GET`
*   Params: `key` (optional)
*   Response: A redirect to the original url OR information about the shortened url

`name` is the short code which you got from Create.  
If a `key` is supplied you will receive information about the shortened url (`httpCode`, `url`, `hits`, `secondsUntilExpiration`, `lastUsed`), otherwise you will simply be redirected to the original url.
  
#### Update
*   URL: `/api/v1/`
*   Method: `PUT`
*   Params: `key` (required), `name` (required), `url` (optional), `secondsUntilExpiration` (optional)
*   Response: Whatever changed (either the `url` or the `secondsUntilExpiration`) and the `httpCode`

`key` is the secret key you received when creating the url.  
`name` is the short code which maps to your url.  
`url` is the new url you'd like to use with this name.  
`secondsUntilExpiration` is an updated expiration date.    


#### Delete
*   URL: `/api/v1/`
*   Method: `DELETE`
*   Params: `key` (required), `name` (required)
*   Response: `httpCode` and a `message` containing the result of the action
