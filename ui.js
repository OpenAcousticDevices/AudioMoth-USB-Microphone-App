/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

/* global document */

const {ipcRenderer} = require('electron');
const { Menu } = require('@electron/remote');

const nightMode = require('./nightMode.js');

/* UI components */

const applicationMenu = Menu.getApplicationMenu();

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
