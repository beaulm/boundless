# Boundless
A sample url shortener

### Requirements
The latest version of `node.js` is required for this snazzy new URL shortener. Check out [nvm](https://github.com/creationix/nvm) for managing node version.

### Installation
*   Install MongoDB server
*   Create a `boundless` collection in Mongo
*   Download or clone this repository
*   `cd` into the directory you just created
*   `npm install`
*   `npm start`

### API

All requests and responses should be in JSON, and all responses will contain the HTTP status code of the response in the message body.

#### Create
*   URL: `/api/v1/`
*   Method: `PUT`
*   Params: `url` (required), `name` (optional), `secondsUntilExpiration` (optional)
*   Response: `httpCode`, `key`, `name`, `secondsUntilExpiration`

`url` is the url you'd like to shorten.  
`name` is the short code you'd like to use, if possible (an error will be returned if it's already taken).  
`secondsUntilExpiration` is how long you'd like your short url to live for. The default is one week.  
  
`key` is a secret code generated for this url so you can update/delete it later.  
`name` is the shortened url code.  
`secondsUntilExpiration` is how many seconds left until the short url expires.  

#### Read
*   URL: `/api/v1/{name}`
*   Method: `GET`
*   Response: A redirect to the original url

`name` is the short code which you got from Create.  
  
#### Update
*   URL: `/api/v1/`
*   Method: `PUT`
*   Params: `key` (required), `name` (requried), `url` (optional), `secondsUntilExpiration` (optional)
*   Response: Whatever what changed (either the `url` or the `secondsUntilExpiration`)

`key` is the secret key you received when creating the url.  
`name` is the short code which maps to your url.  
`url` is the new url you'd like to use with this name.  
`secondsUntilExpiration` is an updated expiration date.    


#### Delete
*   URL: `/api/v1/`
*   Method: `DELETE`
*   Params: `key` (required), `name` (requried)
*   Response: `message` containing the result of the action
