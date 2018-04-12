var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var tools = require('./core/tools');
var lti   = require('./core/lti');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// var allowCrossDomain = function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');
//     if (req.method === "OPTIONS") res.send(200);
//     else next();
// }
// app.use(allowCrossDomain);


var router = express.Router();

router.route('/')
    .get(
        function (req, res, next) {
            console.log("\n\n");
            console.log("******* GET Request ******");
            console.log("url: ", req.url);
            console.log("originalUrl: ", req.originalUrl);
            console.log("params: ", JSON.stringify(req.params, null, 2));
            console.log("query: ", JSON.stringify(req.query, null, 2));

            var secsDif = tools.secsDif(req.body.oauth_timestamp);

            res.render('index', {
                title: 'GET LTI requested!',
                headers: JSON.stringify(req.headers, null, 2),
                body: JSON.stringify(req.body, null, 2),
                timestamp: (new Date().getTime() / 1000) + " - " + req.body.oauth_timestamp + " = " + tools.toHHMMSS(secsDif),
                oauth: req.body.oauth_signature,
                queryParams: JSON.stringify(req.params, null, 2),
                urlParams: JSON.stringify(req.query, null, 2),
                reqUrl: req.url
            });
        }
    )
    .post(
        function (req, res, next) {
            //var firstNameParsed = req.body.firstName ? req.body.firstName : req.body.username;
            console.log("\n\n");
            console.log("******* POST Request ******");
            console.log("url: ", req.url);
            console.log("originalUrl: ", req.originalUrl);
            console.log("params: ", JSON.stringify(req.params, null, 2));
            console.log("query: ", JSON.stringify(req.query, null, 2));

            // show all response POST body properties
            console.log("\n\n");
            console.log("******** POST BODY *********");
            for (var property in req.body) {
                if (property.toString().includes("custom_")) {
                    console.log("    *** CUSTOM PROPERTIES ***");
                }
                console.log("    " + property + ": " + req.body[property]);
            }

            //lti.ltiLaunch(req, res);

            lti.redirectToCanvasOAuth2(req, res);
        }
    );

router.route('/oauth_complete')
    .get(
        function (req, res, next) {

            //2. oauth2
            // Canvas responses:
            //     OK
            // http://www.example.com/oauth2response?code=XXX&state=YYY
            //     Error
            // http://www.example.com/oauth2response?error=access_denied

            console.log("\n\n");
            console.log("******* GET Request /oauth2/oauth_complete ******");
            console.log("url: ", req.url);
            console.log("originalUrl: ", req.originalUrl);
            console.log("params: ", req.params);
            console.log("query: ", req.query);

            if(req.query.code) {
                console.log("Getting Access Token!");
                lti.getAccessTokenAndCallApi(req, res);
            }
            else {
                console.log("When this should be called?");
                res.send(req.body);
            }


            //res.send('<h3>This is GET at /oauth2/oauth_complete</h3><div>' + req.url + '</div>');

        }
    );

router.route('/grade')
    .get(
        function (req, res, next) {
            console.log("\n\n");
            console.log("******* GET Request ******");
            console.log("url: ", req.url);
            console.log("originalUrl: ", req.originalUrl);
            console.log("params: ", JSON.stringify(req.params, null, 2));
            console.log("query: ", JSON.stringify(req.query, null, 2));

            res.send('<h3>This is GET at /grade</h3>');
        }
    )
    .post(
        function (req, res, next) {
            //var firstNameParsed = req.body.firstName ? req.body.firstName : req.body.username;
            console.log("\n\n");
            console.log("******* POST Request ******");
            console.log("url: ", req.url);
            console.log("originalUrl: ", req.originalUrl);
            console.log("params: ", JSON.stringify(req.params, null, 2));
            console.log("query: ", JSON.stringify(req.query, null, 2));

            // show all response POST body properties
            console.log("\n\n");
            console.log("******** POST BODY *********");
            for (var property in req.body) {
                if (property.toString().includes("custom_")) {
                    console.log("    *** CUSTOM PROPERTIES ***");
                }
                console.log("    " + property + ": " + req.body[property]);
            }

            res.render('gradepass', {
                title: 'Click to pass grade!',
                headers: JSON.stringify(req.headers, null, 2)
            });

            // lti.passContentToCanvas(req, res);
        }
    );

// Register all our routes
app.use(router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
