
/* global addDynamicStyles, $SD, Utils */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-else-return */

/**
 * cache the static SDPI-WRAPPER, which contains all your HTML elements.
 * Please make sure, you put all HTML-elemenets into this wrapper, so they
 * are drawn properly using the integrated CSS.
 */

let sdpiWrapper = document.querySelector('.sdpi-wrapper');

/**
 * Since the Property Inspector is instantiated every time you select a key
 * in Stream Deck software, we can savely cache our settings in a global variable.
 */

let settings;

/**
 * The 'connected' event is the first event sent to Property Inspector, after it's instance
 * is registered with Stream Deck software. It carries the current websocket, settings,
 * and other information about the current environmet in a JSON object.
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on('connected', (jsn) => {
    /**
     * The passed 'applicationInfo' object contains various information about your
     * computer, Stream Deck version and OS-settings (e.g. colors as set in your
     * OSes display preferences.)
     */

    console.log("connected");

    /**
     * Current settings are passed in the JSON node
     * {actionInfo: {
     *      payload: {
     *          settings: {
     *                  yoursetting: yourvalue,
     *                  otherthings: othervalues
     * ...
     * To conveniently read those settings, we have a little utility to read
     * arbitrary values from a JSON object, eg:
     *
     * const foundObject = Utils.getProp(JSON-OBJECT, 'path.to.target', defaultValueIfNotFound)
     */

    settings = Utils.getProp(jsn, 'actionInfo.payload.settings', false);
    refreshSettings();
});
 
/**
 * The 'sendToPropertyInspector' event can be used to send messages directly from your plugin
 * to the Property Inspector without saving these messages to the settings.
 */

$SD.on('sendToPropertyInspector', jsn => {
    const pl = jsn.payload;
    /**
     *  This is an example, how you could show an error to the user
     */
    if (pl.hasOwnProperty('error')) {
        sdpiWrapper.innerHTML = `<div class="sdpi-item">
            <details class="message caution">
            <summary class="${pl.hasOwnProperty('info') ? 'pointer' : ''}">${pl.error}</summary>
                ${pl.hasOwnProperty('info') ? pl.info : ''}
            </details>
        </div>`;
    } else {

        /**
         *
         * Do something with the data sent from the plugin
         * e.g. update some elements in the Property Inspector's UI.
         *
         */
    }
});
 
 
function saveSettings(sdpi_collection) {

    if (typeof sdpi_collection !== 'object') return;

    if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
            console.log(sdpi_collection.key, " => ", sdpi_collection.value);
            settings[sdpi_collection.key] = sdpi_collection.value;
            console.log('setSettings....', settings);
            $SD.api.setSettings($SD.uuid, settings);
        }
    }
}
 
/**
 * 'sendValueToPlugin' is a wrapper to send some values to the plugin
 *
 * It is called with a value and the name of a property:
 *
 * sendValueToPlugin(<any value>), 'key-property')
 *
 * where 'key-property' is the property you listen for in your plugin's
 * 'sendToPlugin' events payload.
 *
 */
function sendValueToPlugin(value, prop) {
    console.log("sendValueToPlugin", value, prop);
    if ($SD.connection && $SD.connection.readyState === 1) {
        const json = {
            action: $SD.actionInfo['action'],
            event: 'sendToPlugin',
            context: $SD.uuid,
            payload: {
                [prop]: value,
                targetContext: $SD.actionInfo['context']
            }
        };

        $SD.connection.send(JSON.stringify(json));
    }
}

function refreshSettings() {
    let timeWindow = settings["timeWindow"] || "1d"
    document.getElementById("setting_window_" + timeWindow).checked = true;
    let moneyFormat = settings["moneyFormat"] || "long"
    document.getElementById("setting_money_" + moneyFormat).checked = true;
    let refresh_token = settings["x-access-token-expires"];
    let authStatus = refresh_token ? 
    (new Date() > new Date(refresh_token) ? "Authentication expired!" : "Authenticated") 
    : "Not authenticated"
    document.getElementById("auth_status").innerHTML = authStatus;
}

function updateSettings(){
    let window = [...document.getElementsByName("setting_window")].find((e) => e.checked).value
    let moneyFormat = [...document.getElementsByName("setting_money")].find((e) => e.checked).value
    saveSettings({
        key: "timeWindow",
        value: window
    });
    saveSettings({
        key: "moneyFormat",
        value: moneyFormat
    });
}

function openExternalLogin() {
    window.xtWindow = window.open('login_pi.html', "WS Trade Login");
    setTimeout(() => window.xtWindow.postMessage('initPropertyInspector', '*'), 1500);
}
