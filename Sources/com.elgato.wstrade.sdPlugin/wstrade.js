var websocket = null;
var pluginUUID = null;
var settingsCache = {};
var DestinationEnum = Object.freeze({ "HARDWARE_AND_SOFTWARE": 0, "HARDWARE_ONLY": 1, "SOFTWARE_ONLY": 2 })

const textColor = "white";

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
		let values = {last: 94.0, low: 20.30, high: 300.30}
		drawHighLowBar(values)
		renderCanvas(context);
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
function drawHighLowBar(values) {
	const lineY = 104;
	const padding = 5;
	const lineWidth = 6;
	const percent = (values.last - values.low)/(values.high - values.low);
	const lineLength = canvasWidth-padding*2;
	const cursorPositionX = padding+Math.round(lineLength*percent);
	const triangleSide = 12;
	const triangleHeight = Math.sqrt(3/4*Math.pow(triangleSide,2));
	canvasContext.beginPath();
	canvasContext.moveTo(padding, lineY);
	canvasContext.lineTo(cursorPositionX, lineY);
	canvasContext.lineWidth = lineWidth;
	canvasContext.strokeStyle = "green";
	canvasContext.stroke();
	canvasContext.beginPath();
	canvasContext.moveTo(cursorPositionX, lineY);
	canvasContext.lineTo(canvasWidth-padding, lineY);
	canvasContext.lineWidth = lineWidth;
	canvasContext.strokeStyle = "red";
	canvasContext.stroke();
	canvasContext.beginPath();
	canvasContext.moveTo(cursorPositionX - triangleSide/2, lineY - triangleHeight/3);
	canvasContext.lineTo(cursorPositionX + triangleSide/2, lineY - triangleHeight/3);
	canvasContext.lineTo(cursorPositionX, lineY + triangleHeight*2/3);
	canvasContext.fillStyle = textColor;
	canvasContext.fill();
}
function renderCanvas(context) {
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
