# Boundless
A sample url shortener

## Requirements
The latest version of `node.js` is required for this snazzy new URL shortener. Check out [nvm](https://github.com/creationix/nvm) for managing node version.

## Installation
*   Install MongoDB server and start it running on port 27017
*   Create a `boundless` collection in Mongo
*   Download or clone this repository
*   `cd` into the directory you just created
*   `npm install`
*   `npm start`

## API

All requests and responses should be in JSON, and all responses will contain the HTTP status code of the response in the message body.

Example creating a shortened url with cURL:
```
curl -X POST http://localhost:3000/api/v1/ -H 'content-type: application/x-www-form-urlencoded' -d url=https%3A%2F%2Fwww.google.com%2F
  ```
Example response:
```JSON
{
    "httpCode": 200,
    "key": "2a04bd8a-2e23-4587-a64f-3bf7748dc85f",
    "name": "i4s4ju",
    "secondsUntilExpiration": 604800
}
```
  
  
### Create
*   URL: `/api/v1/`
*   Method: `PUT`

#### Parameters
| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `url` | String | Yes | https://www.google.com/ | The url you'd like to shorten |
| `name` | Url string | No | short-name | The "slug" you'd like to use, if possible |
| `secondsUntilExpiration` | Positive integer | No | 86400 | How many seconds until the short url expires. Default is one week. To create a url that never expires, send 0 for this parameter |

#### Response
| Name | Example | Description |
| ---- | ------- | ----------- |
| `httpCode` | 200 | The HTTP status code of your request. |
| `key` | bc07d9a3-f9e0-42c3-a3c0-05bdcca9fe4a | Keep this key secret, you'll need it to update or delete your shortened url |
| `name` | qw6i4g | The "slug" for your short url. If no name was passed in this will be a randomly-generated, six character string, otherwise it will be the name you sent, if it's available and meets standard URL naming conventions |
| `secondsUntilExpiration` | 86400 | How many seconds until the short url expires |
  
  
### Read
*   URL: `/api/v1/{name}`
*   Method: `GET`

`name` is the "slug" which you got from Create.  

#### Parameters
| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `key` | String | No | bc07d9a3-f9e0-42c3-a3c0-05bdcca9fe4a | The key you got when creating the shortened url |

#### Response
| Name | Example | Description |
| ---- | ------- | ----------- |
| `httpCode` | 200 | The HTTP status code of your request |
| `url` | https://www.google.com/ | The original url |
| `hits` | 1337 | The number of times your shortened url has been used so far |
| `secondsUntilExpiration` | 86400 | How many seconds until the short url expires |
| `lastUsed` | 2017-08-03T16:22:38.613Z | The ISO date that your shortened url was last used |

If a `key` is supplied you will receive information about the shortened url, otherwise you will simply be redirected to the original url.
  
  
### Update
*   URL: `/api/v1/`
*   Method: `PUT`

#### Parameters
| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `key` | String | Yes | bc07d9a3-f9e0-42c3-a3c0-05bdcca9fe4a | The key you got when creating the shortened url |
| `name` | String | Yes | qw6i4g | The "slug" for your short url |
| `url` | String | No | https://duckduckgo.com/ | The new url you'd like your "slug" to point to |
| `secondsUntilExpiration` | Positive integer | No | 0 | The new number of seconds you'd like your shortened url to expire in |

#### Response
| Name | Example | Description |
| ---- | ------- | ----------- |
| `httpCode` | 200 | The HTTP status code of your request |
| `url` | https://duckduckgo.com/ | The new url |
| `secondsUntilExpiration` | 86400 | The new number seconds until the short url expires |

Only the changed data will be reported back, letting you know that your change was saved.
  
  
### Delete
*   URL: `/api/v1/`
*   Method: `DELETE`

#### Parameters
| Name | Type | Required | Example | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `key` | String | Yes | bc07d9a3-f9e0-42c3-a3c0-05bdcca9fe4a | The key you got when creating the shortened url |
| `name` | String | Yes | qw6i4g | The "slug" for your short url |

#### Response
| Name | Example | Description |
| ---- | ------- | ----------- |
| `httpCode` | 200 | The HTTP status code of your request |
| `message` | Shortened url deleted | The result of your delete request |
  
  
## Testing
`npm test` will run all the integration tests.
