/****************************************************************************
 * nightMode.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

const electron = require('electron');

var nightMode = false;

exports.isEnabled = () => {

    return nightMode;

};

function setNightMode (nm) {

    nightMode = nm;

    const oldLink = document.getElementById('uiCSS');
    const newLink = document.createElement('link');

    newLink.setAttribute('id', 'uiCSS');
    newLink.setAttribute('rel', 'stylesheet');
    newLink.setAttribute('type', 'text/css');

    if (nightMode) {

        newLink.setAttribute('href', electron.remote.app.getAppPath() + '/uiNight.css');

    } else {

        newLink.setAttribute('href', electron.remote.app.getAppPath() + '/ui.css');

    }

    document.getElementsByTagName('head').item(0).replaceChild(newLink, oldLink);

}

exports.setNightMode = setNightMode;

exports.toggle = () => {

    setNightMode(!nightMode);

};
