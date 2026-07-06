/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

const {ipcRenderer} = require('electron');

const nightMode = require('./nightMode.js');

/* UI components */

/* Switch between display modes */

function setNightMode (nm) {

    nightMode.setNightMode(nm);

}

exports.setNightMode = setNightMode;

function toggleNightMode () {

    nightMode.toggle();

}

exports.toggleNightMode = toggleNightMode;

exports.isNightMode = nightMode.isEnabled;

ipcRenderer.on('poll-night-mode', function () {

    ipcRenderer.send('night-mode-poll-reply', nightMode.isEnabled());

});
