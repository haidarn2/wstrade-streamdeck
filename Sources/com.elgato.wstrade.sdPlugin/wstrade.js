var websocket = null;
var pluginUUID = null;
var settingsCache = {};
var DestinationEnum = Object.freeze({ "HARDWARE_AND_SOFTWARE": 0, "HARDWARE_ONLY": 1, "SOFTWARE_ONLY": 2 })

// canvas global vars
var canvas;
var canvasContext;
var canvasWidth;
var canvasHeight;

var numberdisplayAction = {
	type: "com.elgato.wstrade.action",
	onKeyDown: function (context, settings, coordinates, userDesiredState) {
	},
	onKeyUp: function (context, settings, coordinates, userDesiredState) {
		draw(context);
		//settingsCache[context] = settings;
		//WsTrade.accountHistory(settings["oauthToken"], settings["accountId"], "1d")
		//	.then(data => {
		//		let account_value = data.previous_close_net_liquidation_value.amount;
		//		this.SetTitle(context, "$" + account_value.toFixed(0));
		//	});
	},
	onWillAppear: function (context, settings, coordinates) {
		this.initCanvas();
		this.SetTitle(context, "yo.");
	},
	initCanvas: function() {
        canvas = document.getElementById("canvas");
        canvasContext = canvas.getContext("2d");
		canvasWidth = canvas.width
		canvasHeight = canvas.height
    },
	SetTitle: function (context, keyPressCounter) {
		var json = {
			"event": "setTitle",
			"context": context,
			"payload": {
				"title": "" + keyPressCounter,
				"target": DestinationEnum.HARDWARE_AND_SOFTWARE
			}
		};
		websocket.send(JSON.stringify(json));
	},
	SetSettings: function (context, settings) {
		var json = {
			"event": "setSettings",
			"context": context,
			"payload": settings
		};
		websocket.send(JSON.stringify(json));
	},
	AddToSettings: function (context, newSettings) {
		settingsCache[context]
	}
};
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
	pluginUUID = inPluginUUID
	// Open the web socket
	websocket = new WebSocket("ws://127.0.0.1:" + inPort);
	function registerPlugin(inPluginUUID) {
		var json = {
			"event": inRegisterEvent,
			"uuid": inPluginUUID
		};
		websocket.send(JSON.stringify(json));
	};
	websocket.onopen = function () {
		// WebSocket is connected, send message
		registerPlugin(pluginUUID);
	};
	websocket.onmessage = function (evt) {
		// Received message from Stream Deck
		var jsonObj = JSON.parse(evt.data);
		var event = jsonObj['event'];
		var action = jsonObj['action'];
		var context = jsonObj['context'];
		var jsonPayload = jsonObj['payload'] || {};
		if (event == "keyDown") {
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			var userDesiredState = jsonPayload['userDesiredState'];
			numberdisplayAction.onKeyDown(context, settings, coordinates, userDesiredState);
		}
		else if (event == "keyUp") {
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			var userDesiredState = jsonPayload['userDesiredState'];
			numberdisplayAction.onKeyUp(context, settings, coordinates, userDesiredState);
		}
		else if (event == "willAppear") {
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			numberdisplayAction.onWillAppear(context, settings, coordinates);
		}
		else if (event == "sendToPlugin") {
			//if (jsonPayload.hasOwnProperty('setValue')) {
			//	var newValue = jsonPayload.setValue;
			//	numberdisplayAction.SetSettings(context, { "keyPressCounter": newValue });
			//	numberdisplayAction.SetTitle(context, newValue);
			//}
			//if (jsonPayload.hasOwnProperty('background-image')) {
			//	const imageName = jsonPayload['background-image'];
			//	loadImageAsDataUri(`${imageName}.png`, function (imgUrl) {
			//		var json = {
			//			"event": "setImage",
			//			"context": context,
			//			"payload": {
			//				image: imgUrl || "",
			//				target: DestinationEnum.HARDWARE_AND_SOFTWARE
			//			}
			//		};
			//		websocket.send(JSON.stringify(json));
			//	})
			//}
			if (jsonPayload.hasOwnProperty('pi-save-button')) {
				const payload = jsonPayload['pi-save-button'];
				numberdisplayAction.SetSettings(context, payload);
			}
		}
	};
	websocket.onclose = function () {
		// Websocket is closed
	};
};
function draw(context) {
	canvasContext.fillStyle = "blue";
	canvasContext.fillRect(0,0,144,144);
	console.log(canvas)
	var json = {
    	"event": "setImage",
    	"context": context,
    	"payload": {
    	    "image": canvas.toDataURL(),
    	    "target": DestinationEnum.HARDWARE_AND_SOFTWARE
    	}
	}
	websocket.send(JSON.stringify(json));
}
function loadImageAsDataUri(url, callback) {
	var image = new Image();
	image.onload = function () {
		var canvas = document.createElement("canvas");
		canvas.width = this.naturalWidth;
		canvas.height = this.naturalHeight;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this, 0, 0);
		callback(canvas.toDataURL("image/png"));
	};
	image.src = url;
};