const oauthSign = require('oauth-sign');
const oauthSignature = require('oauth-signature');
const crypto = require('crypto');
const request = require('request');
var tools = require('./tools');

const LTI_ID = process.env.LTI_ID;
const LTI_SHARED_SECRET = process.env.LTI_SHARED_SECRET;
const LTI_ENDPOINT_URL = process.env.LTI_ENDPOINT_URL;
const ASSIGN_SCORE = "0.23";

const LTI_DEV_TOKEN_ID = process.env.LTI_DEV_TOKEN_ID;
const LTI_DEV_TOKEN = process.env.LTI_DEV_TOKEN;

var nonces = [];

exports.ltiLaunch = function (req, res) {
    // check timestamp
    console.log("\n\n");
    console.log("********** CHECK TIMESTAMP **********");
    var secsDif = tools.secsDif(req.body.oauth_timestamp);
    console.log("timestamp diff: ", tools.getUnixTimestamp() + " - " + req.body.oauth_timestamp + " = " + tools.toHHMMSS(secsDif));

    // check oauth signature
    console.log("\n\n");
    console.log("********** CHECK OAUTH SIGN ***********");
    var httpMethod = 'POST',
        url = LTI_ENDPOINT_URL,
        parameters = {};

    // TODO: test params

    // taking all params from request body except oauth_signature
    for (var property in req.body) {
        if (property.toString() != "oauth_signature") { // && property.toString().includes("oauth_")) {
            parameters[property] = req.body[property];
        }
    }

    // parameters['oauth_consumer_key']=req.body['oauth_consumer_key'];
    // parameters['oauth_signature_method']=req.body['oauth_signature_method'];
    // parameters['oauth_timestamp']=req.body['oauth_timestamp'];
    // parameters['oauth_nonce']=req.body['oauth_nonce'];
    // parameters['oauth_version']=req.body['oauth_version'];
    // parameters['oauth_signature']=req.body['oauth_signature'];
    // parameters['oauth_callback']=req.body['oauth_callback'];

    console.log("url:               ", url);
    console.log("httpMethod:        ", httpMethod);
    console.log("parameters:        ", parameters);
    console.log("LTI_SHARED_SECRET: ", LTI_SHARED_SECRET);


    var signature = oauthSign.hmacsign(httpMethod, url, parameters, LTI_SHARED_SECRET);
    console.log("generated signature: ", signature);
    console.log("oauth_signature:     ", req.body.oauth_signature);
    console.log("sign matches:        ", signature.toString() === req.body.oauth_signature.toString());

    // TODO: test oauth generation
    var base = httpMethod + "&" + encodeURIComponent(url);
    for (var param in parameters) {
        base += encodeURIComponent("&" + param + "=" + parameters[param]);
    }

    var cryptoSign = crypto.createHmac('sha1', encodeURIComponent(LTI_SHARED_SECRET) + "&").update(base).digest('base64');
    console.log("cryptoSign:          ", cryptoSign);

    // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
    var encodedSignature2 = oauthSignature.generate(httpMethod, url, parameters, LTI_SHARED_SECRET, "");
    console.log("encodedSignature2:   ", encodedSignature2);
    // generates a BASE64 encode HMAC-SHA1 hash
    var signature2 = oauthSignature.generate(httpMethod, url, parameters, LTI_SHARED_SECRET, "", {encodeSignature: false});
    console.log("signature2:          ", signature2);

    res.render('index', {
        title: 'POST LTI requested + API call!',
        headers: JSON.stringify(req.headers, null, 2),
        body: JSON.stringify(req.body, null, 2),
        timestamp: tools.getUnixTimestamp() + " - " + req.body.oauth_timestamp + " = " + tools.toHHMMSS(secsDif),
        oauth: req.body.oauth_signature,
        queryParams: JSON.stringify(req.params, null, 2),
        urlParams: JSON.stringify(req.query, null, 2),
        reqUrl: req.url
    });

    //res.redirect(req.body.launch_presentation_return_url + "?lti_msg=Most things in here don't react well to bullets.");
    //res.redirect(req.body.launch_presentation_return_url + "&lti_log=One ping only.");
    //res.redirect(req.body.launch_presentation_return_url + "?lti_errormsg=Who's going to save you, Junior?!");
    //res.redirect(req.body.launch_presentation_return_url + "&lti_errorlog=" + encodeURIComponent("The floor's on fire... see... *&* the chair."));

    // var params;
    // console.log("link:");
    // params = "embed_type=link" +
    //     "&url=http://www.bacon.com" +
    //     "&text=bacon";

    // console.log("image:");
    // params = "embed_type=image" +
    //     "&url=http://www.bacon.com/bacon.png" +
    //     "&alt=bacon" +
    //     "&width=200" +
    //     "&height=100";

    // console.log("iframe:");
    // params = "embed_type=iframe" +
    //     "&url=http://www.bacon.com" +
    //     "&width=200&height=100";

    // console.log("file: ");
    // console.log("ext_content_file_extensions: ", req.body.ext_content_file_extensions);
    // params = "embed_type=file" +
    //     "&url=http://www.bacon.com/bacon.docx" +
    //     "&text=bacon.docx" +
    //     "&content_type=application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // console.log("basic_lti:");
    // params = "embed_type=basic_lti&url=http://www.bacon.com/bacon_launch";

    // console.log("oembed:");
    // params = "embed_type=oembed&url=http://www.flickr.com/photos/bees/2341623661/&endpoint=http://www.flickr.com/services/oembed/";
    //
    // var redirectUrl = req.body.launch_presentation_return_url + "?" + params;
    // console.log("redirectUrl: ", redirectUrl);
    // res.redirect(redirectUrl);
};

exports.redirectToCanvasOAuth2 = function (req, res) {
    // 1. oauth2
    // Send to Canvas:
    //     GET https://<canvas-install-url>/login/oauth2/auth
    //         ?client_id=XXX
    //     &response_type=code
    //     &state=YYY
    //     &redirect_uri=https://example.com/oauth_complete
    var redirect_url = "https://utah.test.instructure.com/login/oauth2/auth"
        + "?client_id=" + LTI_DEV_TOKEN_ID
        + "&response_type=code"
        + "&state=HOHOSTATE"
        + "&redirect_uri=https://sandbox.tlt.utah.edu/ltitest/oauth_complete";
    res.redirect(redirect_url);
};

exports.getAccessTokenAndCallApi = function (req, res) {
    var code = req.query.code;

    //3. oauth2
    // use above code along with the client_id and client_secret to obtain the final access_key
    // POST https://<canvas-install-url>/login/oauth2/token
    //         ?grant_type=authorization_code
    //     &client_id=XXX
    //     &client_secret=Your client_secret
    //     &redirect_uri=If a redirect_uri was passed to the initial request in step 1, the same redirect_uri must be given here.
    // &code=code from canvas
    // &replace_tokens=(optional) If this option is provided, existing access tokens issued for this developer key/secret will be destroyed and replaced with the new token that is returned from this request
    //
    // Canvas responses:
    // {
    //     "access_token": "1/fFAGRNJru1FTz70BzhT3Zg",
    //     "token_type": "Bearer",
    //     "user": {"id":42, "name": "Jimi Hendrix"},
    //     "refresh_token": "tIh2YBWGiC0GgGRglT9Ylwv2MnTvy8csfGyfK2PqZmkFYYqYZ0wui4tzI7uBwnN2",
    //     "expires_in": 3600
    // }

    var options = {
        url: "https://utah.test.instructure.com/login/oauth2/token"
        + "?grant_type=authorization_code"
        + "&client_id=" + LTI_DEV_TOKEN_ID
        + "&client_secret=" + LTI_DEV_TOKEN
        + "&redirect_uri=https://sandbox.tlt.utah.edu/ltitest/oauth_complete"
        + "&code=" + code,
        method: 'POST'
    };

    request(options, function (error, response, body) {
        console.log("\n\n");
        console.log("body: ", body);
        if (!error && response.statusCode == 200) {
            console.log("POST oauth2/token body:\n", body);
            var access_token = JSON.parse(body).access_token;

            // 4. oauth2
            // use access token to get resources
            // curl -H "Authorization: Bearer <ACCESS-TOKEN>" "https://canvas.instructure.com/api/v1/courses"

            options = {
                url: "https://utah.test.instructure.com/api/v1/courses",
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Content-Type': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                console.log("\n\n");
                console.log("body: ", body);
                if (!error && response.statusCode == 200) {
                    res.send("<h2>API Call</h2><div>" + body + "</div>");
                } else {
                    console.log("error: ", error);
                }
            });



            //res.send("access token: " + JSON.parse(body).access_token);
        } else {
            console.log("error: ", error);
        }
    });
};


exports.passContentToCanvas = function (req, res) {
    // Returning content from TP to TC
    console.log("\n\n");
    console.log("**** RETURNING CONTENT TP -> TC");
    // 1st way - possible types image,iframe,link,file,basic_lti,oembed
    console.log("ext_content_return_types: ", req.body.ext_content_return_types);
    // 2nd way - possible sets of types
    console.log("selection_directive: ", req.body.selection_directive);
    var directive = tools.getSelectionDirective(req.body.selection_directive);
    if (directive) console.log("directive: ", directive);
    console.log("launch_presentation_return_url: ", req.body.launch_presentation_return_url);

    // passing grades from TP -> TC
    console.log("\n\n");
    console.log("***** PASSBACK GRADE *****");
    console.log("lis_outcome_service_url: ", req.body.lis_outcome_service_url);
    console.log("lis_result_sourcedid:", req.body.lis_result_sourceid);
    console.log("ext_outcome_data_values_accepted: ", req.body.ext_outcome_data_values_accepted);
    console.log("ext_outcome_result_total_score_accepted: ", req.body.ext_outcome_result_total_score_accepted);

    // sent back to the learning platform is a POST request where the body is XML
    var xmlBody = "<?xml version = \"1.0\" encoding = \"UTF-8\"?>" +
        "<imsx_POXEnvelopeRequest xmlns=\"http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0\">" +
        "    <imsx_POXHeader>" +
        "        <imsx_POXRequestHeaderInfo>" +
        "            <imsx_version>V1.0</imsx_version>" +
        "            <imsx_messageIdentifier>999999123</imsx_messageIdentifier>" +
        "        </imsx_POXRequestHeaderInfo>" +
        "    </imsx_POXHeader>" +
        "    <imsx_POXBody>" +
        "        <replaceResultRequest>" +
        "            <resultRecord>" +
        "                <sourcedGUID>" +
        "                    <sourcedId>" + req.body.lis_result_sourceid + "</sourcedId>" +
        "                </sourcedGUID>" +
        "                <result>" +
        "                    <resultScore>" +
        "                        <language>en</language>" +
        "                        <textString>" + ASSIGN_SCORE + "</textString>" +
        "                    </resultScore>" +
        "                </result>" +
        "            </resultRecord>" +
        "        </replaceResultRequest>" +
        "    </imsx_POXBody>" +
        "</imsx_POXEnvelopeRequest>";

    // SHA1 hash only
    var oauth_body_hash = crypto.createHash('sha1').update(xmlBody).digest('base64');
    console.log("oauth_body_hash: ", oauth_body_hash);

    // PUT
    // &http://www.example.com/resource
    // &oauth_body_hash=Lve95gjOVATpfV8EL5X4nxwjKHE%3D
    // &oauth_consumer_key=consumer
    // &oauth_nonce=10369470270925
    // &oauth_signature_method=HMAC-SHA1
    // &oauth_timestamp=1236874236
    // &oauth_token=token
    // &oauth_version=1.0

    var timestamp = tools.getUnixTimestamp();
    var httpMethod = 'POST';
    var url = req.body.lis_outcome_service_url;
    var parameters = {};
    parameters["realm"] = req.body.lti_endpoint_url;
    parameters["oauth_body_hash"] = oauth_body_hash;
    parameters["oauth_consumer_key"] = LTI_ID;
    parameters["oauth_signature_method"] = req.body.oauth_signature_method;
    parameters["oauth_timestamp"] = req.body.oauth_timestamp;
    parameters["oauth_nonce"] = req.body.oauth_nonce;
    parameters["oauth_version"] = req.body.oauth_version;

    var oauth_signature = oauthSign.hmacsign(httpMethod, url, parameters, LTI_SHARED_SECRET);
    console.log("oauth_signature: " + oauth_signature);

    var oauthParams =
        'realm="' + encodeURIComponent(LTI_ENDPOINT_URL) + '", ' +
        'oauth_body_hash="' + encodeURIComponent(oauth_body_hash) + '", ' +
        'oauth_consumer_key="' + encodeURIComponent(LTI_ID) + '", ' +
        'oauth_signature_method="' + encodeURIComponent(req.body.oauth_signature_method) + '", ' +
        'oauth_timestamp="' + encodeURIComponent(timestamp) + '", ' +
        'oauth_nonce="' + encodeURIComponent(timestamp) + '", ' +
        'oauth_version="' + encodeURIComponent(req.body.oauth_version) + '", ' +
        'oauth_signature="' + encodeURIComponent(oauth_signature) + '"';

    console.log("oauthParams: ", oauthParams);

    var options = {
        url: req.body.lis_outcome_service_url,
        method: 'POST',
        headers: {
            'Authorization': 'OAuth ' + oauthParams,
            'Content-Type': 'application/xml'
        },
        body: xmlBody
    };

    var secsDif = tools.secsDif(timestamp);

    request(options, function (error, response, body) {
        console.log("\n\n");
        console.log("body: ", body);
        if (!error && response.statusCode == 200) {
            res.render('index', {
                title: 'Success! POST LTI requested + API call! Your Assignment Score = ' + ASSIGN_SCORE,
                headers: JSON.stringify(req.headers, null, 2),
                body: JSON.stringify(req.body, null, 2),
                timestamp: tools.getUnixTimestamp() + " - " + req.body.oauth_timestamp + " = " + tools.toHHMMSS(secsDif),
                oauth: req.body.oauth_signature,
                queryParams: JSON.stringify(req.params, null, 2),
                urlParams: JSON.stringify(req.query, null, 2),
                reqUrl: req.url,
                apiResBody: body
            });
        } else {
            console.log("error: ", error);
            res.render('index', {
                title: 'Error! POST LTI requested + API call!',
                headers: JSON.stringify(req.headers, null, 2),
                body: JSON.stringify(req.body, null, 2),
                timestamp: tools.getUnixTimestamp() + " - " + req.body.oauth_timestamp + " = " + tools.toHHMMSS(secsDif),
                oauth: req.body.oauth_signature,
                queryParams: JSON.stringify(req.params, null, 2),
                urlParams: JSON.stringify(req.query, null, 2),
                reqUrl: req.url,
                apiResBody: "statusCode: " + response.statusCode
            });
        }
    });
};

exports.testHmacSign = function () {
    var clientSec = "kd94hf93k423kf44";
    var tokenSecret = "pfkkdhi9sl3r4s00";
    var base = "GET&http%3A%2F%2Fphotos.example.net%2Fphotos&file%3Dvacation.jpg%26oauth_consumer_key%3Ddpf43f3p2l4k3l03%26oauth_nonce%3Dkllo9940pd9333jh%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1191242096%26oauth_token%3Dnnch734d00sl2jdk%26oauth_version%3D1.0%26size%3Doriginal";
    var secret = encodeURIComponent(clientSec) + "&" + encodeURIComponent(tokenSecret);
    var cryptoSign = crypto.createHmac('sha1', secret).update(base).digest('base64');
    console.log("cryptoSign: ", cryptoSign);
};


