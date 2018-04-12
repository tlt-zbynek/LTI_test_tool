var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express',
        headers: 'headers',
        body: 'body',
        timestamp: 'timestamp',
        oauth: 'oauth',
        queryParams: 'queryParams',
        urlParams: 'urlParams',
        reqUrl: 'reqUrl',
        apiResBody: 'apiResBody'
    });
});

module.exports = router;
