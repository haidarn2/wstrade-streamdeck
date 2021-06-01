var websocket = null;
var pluginUUID = null;
var settingsCache = {};
var DestinationEnum = Object.freeze({ "HARDWARE_AND_SOFTWARE": 0, "HARDWARE_ONLY": 1, "SOFTWARE_ONLY": 2 })

// constants
const textColor = "white";
const font = "Lato";
const multiplier = 1.0;
const digits = 0;
const textPadding = 10;
const backgroundColor = "black";

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
		Client.accountHistory(settings["oauthToken"], settings["accountId"], "1d")
			.then(data => {
				let values = calculateValues(data)
				clearCanvas()
				drawLast(values)
				drawHighLow(values)
				drawHighLowBar(values)
				renderCanvas(context)
			});
		
	},
	onWillAppear: function (context, settings, coordinates) {
		this.initCanvas();
		//this.SetTitle(context, "yo.");
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
function clearCanvas() {
	canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
	canvasContext.fillStyle = backgroundColor;
	canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
}
function drawLast(values) {
	canvasContext.save()
	canvasContext.font = "25px "+font;
	canvasContext.fillStyle = textColor;
	canvasContext.textAlign = "left";
	canvasContext.fillText(values.accType, 10, 25);
	canvasContext.font = "bold 35px "+font;
	canvasContext.fillText(
		"$" + this.getRoundedValue(values.last, digits, multiplier),
		textPadding,
		60
	);
	canvasContext.restore()
}
function drawHighLow(values) {
	canvasContext.save();
	canvasContext.textAlign = "start";
	canvasContext.fillStyle = textColor;
	canvasContext.font = "25px "+font;
	canvasContext.fillText(
		this.getRoundedValue(values.low, digits, multiplier),
		textPadding,
		90
	);
	canvasContext.textAlign = "right";
	canvasContext.fillText(
		this.getRoundedValue(values.high, digits, multiplier),
		canvasWidth-textPadding,
		135
	);
	canvasContext.restore();
}
function drawHighLowBar(values) {
	const lineY = 104;
	const padding = 5;
	const lineWidth = 6;
	const percent = (values.last - values.low)/(values.high - values.low);
	const lineLength = canvasWidth-padding*2;
	const cursorPositionX = padding+Math.round(lineLength*percent);
	const triangleSide = 12;
	const triangleHeight = Math.sqrt(3/4*Math.pow(triangleSide,2));
	canvasContext.save();
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
	canvasContext.restore();
}
function getRoundedValue (value, digits, multiplier) {
	const digitPow = Math.pow(10, digits);

	let valueString = ""+Math.round(value*multiplier*digitPow)/digitPow;

	if (digits>0) {
		// Make sure we always have the correct number of digits, even when rounded
		let digitPosition = valueString.indexOf(".");
		if (digitPosition<0) {
			valueString+=".";
			digitPosition = valueString.length - 1;
		}

		let actualDigits = valueString.length - digitPosition - 1;
		while (actualDigits<digits) {
			valueString+="0";
			actualDigits++;
		}
	}
	return valueString;
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
function calculateValues(data) {
	let last = data.previous_close_net_liquidation_value.amount;
	return {
		accType: "PERSONAL", 
		last: last, 
		low: 6100, 
		high: 7500
	}
}
