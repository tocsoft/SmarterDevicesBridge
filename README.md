# SmartThingsSmarterCoffee

* __SmartThings__ - home automation system that communicates with devices over ZigBee, Z-Wave, or HTTP
* __Smarter Coffee__ - A WiFi coffee machine that can be controlled with binary commands over TCP sockets and UDP broadcasts
* __SmartThingsSmarterCoffee__ - A node.js web server that will bridge SmartThings and Smarter Coffee

### Status
* SmartThingsSmarterCoffee is currently under development and probably won't work for you yet.
* The node server will attempt to discover the machine on your network via UDP broadcast. It only supports discovery of a single device at this time.
* There is no SmartThings device type yet. You have to call the HTTP endpoints manually.

### API
| API                                          | Verb | Desc                              |
|----------------------------------------------|------|-----------------------------------|
| /smarter/coffeeStrength/[weak,medium,strong] | POST | Sets the strength of the coffee   |
| /smarter/keepWarm/[1-30]                     | POST | Turns on the hotplate for x mins  |
| /smarter/keepWarm/[0]                        | POST | Turns off the hotplate            |
| /smarter/numberOfCups/[1-12]                 | POST | Sets the number of cups of coffee |

