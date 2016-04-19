# SmarterDevicesBridge

* __Smarter Coffee__ - A WiFi coffee machine that can be controlled with binary commands over TCP sockets and UDP broadcasts
* __SmarterDevicesBridge__ - A node.js web server that will bridge SmartThings and Smarter Coffee

### Status
* SmarterDevicesBridge is currently under development and probably won't work for you yet.
* The node server will attempt to discover the machine on your network via UDP broadcast. It only supports discovery of a single device at this time.
* There is no SmartThings device type yet. You have to call the HTTP endpoints manually.

### API
| API                                          | Verb | Desc                              | Body Format |
|----------------------------------------------|------|-----------------------------------|------|
| /coffee/coffeeStrength | POST | Sets the strength of the coffee   | { "coffeeStrength" :"[weak,medium,strong]" } |
| /coffee/coffeeStrength | GET | Gets the strength of the coffee   | { "coffeeStrength" :"[weak,medium,strong]" } |
| /coffee | GET | Gets the general status of the coffee machine   | { readyToBrew: false, grindBeans: true, carraffDetected: true, hotPlate: false, brewing: false, cups: 5, coffeeStrength: "strong", waterLevel: 1 } |

