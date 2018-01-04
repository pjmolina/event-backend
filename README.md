# Event Backend #

[![Greenkeeper badge](https://badges.greenkeeper.io/pjmolina/event-backend.svg)](https://greenkeeper.io/)
Project Event Backend documentation.

[![Build Status](https://travis-ci.org/pjmolina/event-backend.svg?branch=master)](https://travis-ci.org/pjmolina/event-backend)
[![bitHound Overall Score](https://www.bithound.io/github/pjmolina/event-backend/badges/score.svg)](https://www.bithound.io/github/pjmolina/event-backend)

Event Backend services implemented using the following technologies:

* NodeJS
* MongoDB
* Mongoose
* Baucis
* Swagger

API REST published over `/api` on default port 5000.

API documentation for `/api` available on:
 
* OpenAPI 3.0 on `/api/openapi.json`
* Swagger 2.0 on `/api/swagger.json`
* Swagger 1.1 on `/api/documentation`

Admin frontend created with AngularJS 1.3 + Bootstrap.

## Default connection string for database ##
`mongodb://localhost:27017/DemoDb`

## How to run it? ##

1. Open a console window and set the root folder (where the package.json file is located).
2. Install dependencies executing `npm install`
3. Run the server executing `node app\server.js`
4. Default credentials are: root / 1234

## Test prerequirements and debugging tools ##
In order to launch debugging tools and quality code reports you must install the following prerequirements:

```npm install -g nodemon phantomjs grunt-cli karma karma-cli jshint```

## Test ##
Run 

```npm test```

## Karma UI Test ##
Install Karma and dependencies:

```
npm install -g karma-chrome-launcher karma-coverage karma-firefox-launcher karma-jasmine karma-junit-reporter karma-phantomjs-launcher karma-teamcity-reporter@0.2.1 mocha-teamcity-cov-reporter jasmine-reporters karma@0.9.8 protractor
```

And then run: `npm test-ui-single-run`


## Check for JS code quality ##

Run:
- JSHint: `grunt jshint`
- ESLint: `grunt eslint` for console or an HTML report: `grunt eslint-report`


