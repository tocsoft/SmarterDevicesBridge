'use strict';

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var smarterCoffee    = require('./smarterCoffee.js').SmarterCoffee;
var smarterCoffeeRouterConfig    = require('./smarterCoffeeRouter.js');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var router = express.Router();
var smarterCoffeeRouter = smarterCoffeeRouterConfig(smarterCoffee);

router.get('/', function(req, res) {
    res.json({ message: 'ok' });   
});

app.use("/", router);

app.use('/coffee', smarterCoffeeRouter);
    

smarterCoffee.discover(function(err, ip) {
    if(err) {
        console.log("Error discovering SmarterCoffee: " + err);
        return;
    }
    console.log("Discovered SmarterCoffee: " + ip);

    smarterCoffee.connect(ip, function(err) {
        if(err) {
            console.log("Error connecting to SmarterCoffee: " + err);
            return;
        }
    });
});

app.listen(port);
// START THE SERVER
console.log('Listening on port ' + port);

