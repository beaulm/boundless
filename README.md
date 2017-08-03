# Boundless
A sample url shortener

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
*   Response: `httpCode`, `key`, `message`, `secondsUntilExpiration`

`url` is the url you'd like to shorten.
`name` is the short code you'd like to use, if possible (an error will be returned if it's already taken).
`secondsUntilExpiration` is how long you'd like your short url to live for. The default is one week.

`key` is a secret code generated for this url so you can update/delete it later.
`message` is the shortened url code.
`secondsUntilExpiration` is how many seconds left until the short url expires.

