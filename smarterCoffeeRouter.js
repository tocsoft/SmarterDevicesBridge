'use strict';

var express    = require('express');

module.exports = function(smarterCoffee){
        
    var smarterCoffeeRouter = express.Router();
 
    smarterCoffeeRouter.get('/', function(req, res) {
        smarterCoffee.getStatus(
            function(err, status) {
                if (err) {
                    res.status(400);
                    res.json({ message: err });
                    return;
                }
                res.json(status);
            });
    });
    
    smarterCoffeeRouter.post('/numberOfCups/:numberOfCups', function(req, res) {
        smarterCoffee.setNumberOfCups(req.params.numberOfCups,
            function(err, numberOfCups) {
                if (err) {
                    res.status(400);
                    res.json({ message: err });
                    return;
                }
                res.json({ numberOfCups: numberOfCups });
            });
    });
    
    smarterCoffeeRouter.get('/coffeeStrength', function(req, res) {
        smarterCoffee.getCoffeeStrength(
            function(err, coffeeStrength) {
                if (err) {
                    res.status(400);
                    res.json({ message: err });
                    return;
                }
                res.json({ coffeeStrength: coffeeStrength });
            });
    });
    smarterCoffeeRouter.post('/coffeeStrength', function(req, res) {
        smarterCoffee.setCoffeeStrength(req.body.coffeeStrength,
            function(err, coffeeStrength) {
                if (err) {
                    res.status(400);
                    res.json({ message: err });
                    return;
                }
                res.json({ coffeeStrength: coffeeStrength });
            });
    });

    smarterCoffeeRouter.post('/keepWarm/:numberOfMins', function(req, res) {
        smarterCoffee.setKeepWarm(req.params.numberOfMins, 
            function(err, numberOfMins) {
                if (err) {
                    res.status(400);
                    res.json({ message: err });
                    return;
                }
                res.json({ numberOfMins: numberOfMins });
            });
    });

   return smarterCoffeeRouter; 
}
