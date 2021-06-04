var websocket = null;
var pluginUUID = null;
var DestinationEnum = Object.freeze({ "HARDWARE_AND_SOFTWARE": 0, "HARDWARE_ONLY": 1, "SOFTWARE_ONLY": 2 })

// timers
var oauthRefresh = null;
var dataRefresh = null;

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

// cache
var settingsCache = null;
var contextCache = null;

var numberdisplayAction = {
	type: "com.elgato.wstrade.action",
	onKeyDown: function (context, settings, coordinates, userDesiredState) {
	},
	onKeyUp: function (context, settings, coordinates, userDesiredState) {
		console.log(settings);
		if (!settings["x-access-token-expires"] || new Date() > new Date(settings["x-access-token-expires"])) {
			console.log("not authenticated!");
			this.showAlert(context);
			return;
		}
	},
	onWillAppear: function (context, settings, coordinates) {
		this.initCanvas();
		refreshData();
		registerTimers();
	},
	onWillDisappear: function (context, settings, coordinates) {
		//deregisterTimers();
	},
	initCanvas: function() {
        canvas = document.getElementById("canvas");
        canvasContext = canvas.getContext("2d");
		canvasWidth = canvas.width
		canvasHeight = canvas.height
    },
	setTitle: function (context, keyPressCounter) {
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
	setSettings: function (context, settings) {
		var json = {
			"event": "setSettings",
			"context": context,
			"payload": settings
		};
		websocket.send(JSON.stringify(json));
	},
	showAlert: function(context) {
		var json = {
			"event": "showAlert",
			"context": context
		};
		websocket.send(JSON.stringify(json));
	},
	onDidReceiveSettings: function(context, settings) {
		refreshData();
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

		settingsCache = jsonPayload['settings'] || settingsCache
		contextCache = context || contextCache

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
		else if (event == "willDisappear") {
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			numberdisplayAction.onWillDisappear(context, settings, coordinates);
		}
		else if (event == "didReceiveSettings") {
			console.log(jsonPayload);
			console.log("didReceiveSettings in plugin!!");
			numberdisplayAction.onDidReceiveSettings(context, settings);
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
function drawDailyChange(values) {
	canvasContext.save()
	const changePercent = (1 - (values.last / values.first)) * 100;
	let digitsPercent = 2;
	if (Math.abs(changePercent)>=10) {
		digitsPercent = 1;
	} else if (Math.abs(changePercent)>=10) {
		digitsPercent = 0;
	}
	let changePercentDisplay = this.getRoundedValue(changePercent, digitsPercent, 1);
	if (changePercent>0) {
		changePercentDisplay = "+" + changePercentDisplay;
		canvasContext.fillStyle = "green";
	} else {
		canvasContext.fillStyle = "red";
	}
	canvasContext.font = "19px "+font;
	canvasContext.textAlign = "right";
	canvasContext.fillText(
		changePercentDisplay + "%",
		canvasWidth-textPadding,
		90
	);
	canvasContext.restore()
}
function drawLast(values, accType) {
	canvasContext.save()
	canvasContext.font = "25px "+font;
	canvasContext.fillStyle = textColor;
	canvasContext.textAlign = "left";
	canvasContext.fillText(accType, 10, 25);
	canvasContext.font = "bold 35px "+font;
	let valStrFormatted = formatCash(this.getRoundedValue(values.last, digits, multiplier))
	canvasContext.fillText(
		"$" + valStrFormatted,
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
	let valStrFormattedLow = formatCash(this.getRoundedValue(values.low, digits, multiplier))
	canvasContext.fillText(
		valStrFormattedLow,
		textPadding,
		90
	);
	canvasContext.textAlign = "right";
	let valStrFormattedHigh = formatCash(this.getRoundedValue(values.high, digits, multiplier))
	canvasContext.fillText(
		valStrFormattedHigh,
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

function formatCash(n) {
	if (n < 1e3) return n;
	if (n >= 1e3 && n < 1e4) return +(n / 1e3).toFixed(2) + "k";
	if (n >= 1e4 && n < 1e5) return +(n / 1e3).toFixed(1) + "k";
	if (n >= 1e5 && n < 1e6) return +(n / 1e3).toFixed(0) + "k";
	if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
	if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
	if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
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
	let first = data.results.reduce((i, acc) => new Date(i.date) < new Date(acc.date) ? i : acc)
	let last = data.results.reduce((i, acc) => new Date(i.date) > new Date(acc.date) ? i : acc)
	let high = data.results.reduce((i, acc) => i.value.amount > acc.value.amount ? i : acc)
	let low = data.results.reduce((i, acc) => i.value.amount < acc.value.amount ? i : acc)
	return {
		last: last.value.amount,
		first: first.value.amount,
		low: low.value.amount,
		high: high.value.amount
	}
}

function refreshToken() {
	console.log("oauth refresh tick: " + new Date())
	// refresh oauth token
	if (!settingsCache["x-refresh-token"]) {
		console.log("missing refresh token, can't refresh!")
		return;
	}
	Client.refresh(settingsCache["x-refresh-token"])
	.then((resp) => resp.getAllResponseHeaders())
	.then((respHeadersStr) => Client.parseResponseHeaders(respHeadersStr))
	.then((headers) => {
		numberdisplayAction.setSettings(contextCache, Object.assign(settingsCache, {
			"x-access-token": headers["x-access-token"] || settings["x-access-token"],
			"x-refresh-token": headers["x-refresh-token"] || settings["x-refresh-token"],
			"x-access-token-expires": new Date(headers["x-access-token-expires"] * 1000) || settings["x-access-token-expires"]
		}));
	});
}

function refreshData() {
	console.log("data refresh tick: " + new Date())
	if (!settingsCache["x-access-token"] || !settingsCache["accountId"]) {
		console.log("missing oauth token or accountId, can't refresh data!")
		return;
	}
	Client.accountHistory(settingsCache["x-access-token"], settingsCache["accountId"], settingsCache["timeWindow"] || "1d")
	.then(data => {
		let values = calculateValues(data);
		clearCanvas();
		drawDailyChange(values);
		drawLast(values, settingsCache["accountType"]);
		drawHighLow(values);
		drawHighLowBar(values);
		renderCanvas(contextCache);
	});
}

function registerTimers() {
	console.log("register Timers")
	if (oauthRefresh) {
		clearTimeout(oauthRefresh);
		oauthRefresh = null;
	}
	if (dataRefresh) {
		clearTimeout(dataRefresh);
		dataRefresh = null;
	}
	oauthRefresh = setInterval(() => refreshToken(), 60 * 60 * 1000);
	dataRefresh = setInterval(() => refreshData(), 15 * 60 * 1000);
}