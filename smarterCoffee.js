'use strict';

const pad = require('pad');
const EventEmitter = require('events');
const util = require('util');


var SMARTER_PORT = 2081
var BROADCAST_ADDRESS = '255.255.255.255'
var DISCOVER_REPLY_BYTE = 0x65
var SMARTER_DEVICE_TYPE = 0x02

var debug = require('debug')('smarterCoffee');
var Socket = require('net').Socket;
var dgram = require('dgram'); 
var os = require('os');
var _ = require('lodash');

var statusMessageType = {
	'0x4' : "Filter, ?",
	'0x5' : "Grinder, ?",
	'0x6' : "Filter, OK to start",
	'0x7' : "Grinder, OK to start",
	'0x20' : "Filter, No carafe",
	'0x22' : "Grinder, No carafe",
	'0x45' : "Filter, Done",
	'0x47' : "Grinder, Done",
	'0x53' : "Boiling",
	'0x60' : "Filter, No carafe, Hotplate On",
	'0x61' : "Filter, Hotplate On",
	'0x62' : "Grinder, No carafe, Hotplate On",
	'0x63' : "Grinder, Hotplate On",	
}


var SmarterCoffee = function() {
    EventEmitter.call(this);
    this.SMARTER_NOT_CONNECTED = 'smarter-not-connected';
}
util.inherits(SmarterCoffee, EventEmitter);

SmarterCoffee.prototype._checkCall = function(callback) {
    if (this.machine) return true;
    
    callback(this.SMARTER_NOT_CONNECTED);
    return false;
}

SmarterCoffee.prototype.discover = function(callback) {
    
    var self = this;
    
    self.udpsocket = dgram.createSocket('udp4');

    self.localAddresses = getLocalAddresses();

    self.udpsocket.on('listening', function () {
        var address = self.udpsocket.address();
        debug('UDP client listening on ' + address.address + ":" + address.port);
        self.udpsocket.setBroadcast(true)

        var message = new Buffer ([100, 126]);
        self.udpsocket.send(message, 0, message.length, SMARTER_PORT, BROADCAST_ADDRESS);
        debug("Sent " + message + " to the wire...");
    });
      
    self.udpsocket.on('message', function (message, remote) {
        if (_.includes(self.localAddresses, remote.address)) return;
        debug('UDP message received from ' + remote.address +' - ' + message);
        if (message.length >= 2
            && message[0] == DISCOVER_REPLY_BYTE
            && message[1] == SMARTER_DEVICE_TYPE) {
            debug('Found machine at ' + remote.address);
            self.udpsocket.close();
            callback(null, remote.address);
        }
    });

    self.udpsocket.bind(SMARTER_PORT);
}

function getLocalAddresses() {

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses;
}

SmarterCoffee.prototype.connect = function(ip, callback) {

    var self = this;
    debug('Connecting to machine at ' + ip);
    var client = new Socket();
    client.connect(SMARTER_PORT, ip, function() {
        self.machine = client;
        debug('Connected');
        callback(null)
    });
    
    
    client.on("data", function(b){
        if(b[0] != 50){
            //status update
            return;
        }
        var deviceMessage = b[0];
        var statusMessage = pad(8,b[1].toString(2), '0');
        var waterLevelMessage = pad(8,b[2].toString(2), '0');
        var wifiStrenghtMessage = b[3];
        var strenghtMessage = b[4];
        var cupsMessage = pad(8,b[5].toString(2), '0');
        var msgHash = b.toString('hex');
        // 8 = carraff or filter door open
        //6= read yo brew
        
        // 2+4=brewing
        self.status = {};
        
        self.status.readyToBrew =(statusMessage[4] === "1");        
        self.status.grindBeans = (statusMessage[6] === "1" );        
        self.status.carraffDetected = (statusMessage[7] === "1");
        self.status.hotPlate = (statusMessage[1] === "1");
        self.status.brewing = (statusMessage[3] === "1");
        
        var extraCupNumber = cupsMessage[1];
        cupsMessage = cupsMessage.substring(4);//remove the exta random??? bits      
        self.status.cups = parseInt(cupsMessage, 2);
        
        switch (strenghtMessage) {
            case 0:
            self.status.coffeeStrength = 'weak';
                break;
            case 1:
            self.status.coffeeStrength = 'medium';
                break;
            case 2:
                self.status.coffeeStrength = 'strong';
                break;
            default:
                self.status.coffeeStrength = 'unknown';
                return;
            };
        
        if(b[2] === 19){
            self.status.waterLevel = 1;
        } else if(b[2] === 18){
            self.status.waterLevel = 0.5;
        }  else if(b[2] === 10){
            self.status.waterLevel = 0;
        } 
        if(self.lastStatusHash !== msgHash)
        { 
            self.lastStatusHash  = msgHash;
            
            debug(statusMessage, {  
                    grindBeans : self.status.grindBeans, 
                    readyToBrew : self.status.readyToBrew,
                    brewing : self.status.brewing,
                    hotPlate : self.status.hotPlate
            });
            
            debug(waterLevelMessage, {  
                    waterLevel : self.status.waterLevel
            }); 
            
            debug(strenghtMessage, {  
                    coffeeStrength : self.status.coffeeStrength
            });
            ;
            debug(cupsMessage, {  
                    cups : self.status.cups
            });
            
            self.emit("status", self.status);
        }
        
    });
}
function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
SmarterCoffee.prototype.waitStatusUpdate = function(timeoutOrCallback, callback){
    var timeout = timeoutOrCallback;
    
    if(isFunction(timeout)){
        callback = timeout;
        timeout = 3000;
    }
    
    var beenCalled = false;
    var fireCallback = function(){
        if(!beenCalled){
            beenCalled = true;
            clearTimeout(to); 
            callback();
        }
    }
    
    var to = setTimeout(fireCallback, timeout)    
    this.once("status", fireCallback);
}

SmarterCoffee.prototype.getStatus = function(callback) {
    if (!this._checkCall(callback)) return;
        var self = this;
      self.waitStatusUpdate(250, function(){   
        callback(null, self.status)
      })
}

SmarterCoffee.prototype.getCoffeeStrength = function(callback) {
    if (!this._checkCall(callback)) return;
        var self = this;
      self.waitStatusUpdate(250, function(){   
        callback(null, self.status.coffeeStrength)
      })
}
SmarterCoffee.prototype.setCoffeeStrength = function(coffeeStrength, callback) {
    if (!this._checkCall(callback)) return;

    var code = -1;
    switch (coffeeStrength) {
    case 'weak':
        code = 0;
        break;
    case 'medium':
        code = 1;
        break;
    case 'strong':
        code = 2;
        break;
    default:
        callback('Strength must be "weak", "medium", or "strong"');
        return;
    };

    debug('Setting coffee strength to ' + coffeeStrength);
    var command = new Buffer([53, code, 126]);
    var self = this;
    this.machine.write(command, function() {
        self.status.coffeeStrength = coffeeStrength;
        self.waitStatusUpdate(function(){            
            callback(null, self.status.coffeeStrength);
        });
    });     
}

SmarterCoffee.prototype.setNumberOfCups = function(numberOfCups, callback) {
    if (!this._checkCall(callback)) return;

    if (numberOfCups < 1 || numberOfCups > 12) {
        callback('Invalid number of cups provided, valid values are 1 to 12');
        return;
    }

    debug('Setting number of cups to ' + numberOfCups);
    var command = new Buffer([54, numberOfCups, 126]);
    this.machine.write(command, function() {
        callback(null, numberOfCups);
    });     
}

SmarterCoffee.prototype.setKeepWarm = function(numberOfMins, callback) {
    if (!this._checkCall(callback)) return;

    if (numberOfMins < 0 || numberOfMins > 30) {
        callback('Invalid number of mins to keep warm, valid values are 0 to 30');
        return;
    }

    if (numberOfMins == 0) {
        var command = new Buffer([74, 126]);
    } else {
        var command = new Buffer([62, numberOfMins, 126]);
    }

    this.machine.write(command, function() {
        callback(null, numberOfMins);
    });     
}


SmarterCoffee.prototype.status = function(callback) {
    if (!this._checkCall(callback)) return;

    if (numberOfMins < 0 || numberOfMins > 30) {
        callback('Invalid number of mins to keep warm, valid values are 0 to 30');
        return;
    }

    if (numberOfMins == 0) {
        var command = new Buffer([74, 126]);
    } else {
        var command = new Buffer([62, numberOfMins, 126]);
    }

    this.machine.write(command, function() {
        callback(null, numberOfMins);
    });     
}

module.exports.SmarterCoffee = new SmarterCoffee();
