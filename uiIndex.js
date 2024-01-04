
/****************************************************************************
 * uiIndex.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

/* global document */

const audiomoth = require('audiomoth-hid');
const packetReader = require('./packetReader.js');

const util = require('util');
const electron = require('electron');
const { dialog, Menu, BrowserWindow } = require('@electron/remote');

const ui = require('./ui.js');

const constants = require('./constants.js');

const uiSettings = require('./settings/uiSettings.js');

const versionChecker = require('./versionChecker.js');

const UINT16_MAX = 0xFFFF;

const MILLISECONDS_IN_SECOND = 1000;

/* UI components */

const applicationMenu = Menu.getApplicationMenu();

const firmwareVersionDisplay = document.getElementById('firmware-version-display');
const firmwareVersionLabel = document.getElementById('firmware-version-label');

const firmwareDescriptionDisplay = document.getElementById('firmware-description-display');
const firmwareDescriptionLabel = document.getElementById('firmware-description-label');

const samplerateDisplay = document.getElementById('samplerate-display');
const samplerateLabel = document.getElementById('samplerate-label');

const gainDisplay = document.getElementById('gain-display');
const gainLabel = document.getElementById('gain-label');

const filterSettingDisplay = document.getElementById('filter-setting-display');
const filterSettingLabel = document.getElementById('filter-setting-label');

const additionalDisplay = document.getElementById('additional-display');
const additionalLabel = document.getElementById('additional-label');

const configureButton = document.getElementById('configure-button');

const packetLabels = [samplerateLabel, gainLabel, filterSettingLabel, additionalLabel];
const packetDisplays = [samplerateDisplay, gainDisplay, filterSettingDisplay, additionalDisplay];

const firmwareLabels = [firmwareVersionLabel, firmwareDescriptionLabel];
const firmwareDisplays = [firmwareVersionDisplay, firmwareDescriptionDisplay];

/* Store version number for packet size checks and description for compatibility check */

var firmwareVersion = '0.0.0';

var firmwareDescription = '-';

/* If the ID of the current device differs from the previous one, then warning messages can be reset */

let previousID = '';

/* Indicate whether the firmware should be updated */

let updateRecommended = false;

/* Whether or not a warning about the version number has been displayed for this device */

let versionWarningShown = false;

/* Whether or not a warning about the firmware has been displayed for this device */

let firmwareWarningShown = false;

/* Whether or not communication with device is currently happening */

let communicating = false;

/* Communication constants */

const MAXIMUM_RETRIES = 10;
const DEFAULT_RETRY_INTERVAL = 100;

/* Compare two semantic versions and return true if older */

function isOlderSemanticVersion (aVersion, bVersion) {

    for (let i = 0; i < aVersion.length; i++) {

        const aVersionNum = parseInt(aVersion[i]);
        const bVersionNum = parseInt(bVersion[i]);

        if (aVersionNum > bVersionNum) {

            return false;

        } else if (aVersionNum < bVersionNum) {

            return true;

        }

    }

    return false;

}


/* Utility functions */

async function callWithRetry (funcSync, argument, milliseconds, repeats) {

    let result;

    let attempt = 0;

    while (attempt < repeats) {

        try {

            if (argument) {
                
                result = await funcSync(argument);

            } else {

                result = await funcSync();

            }

            break;

        } catch (e) {

            const interval = milliseconds / 2 + milliseconds / 2 * Math.random();

            await delay(interval);

            attempt += 1;

        }

    }

    if (result === undefined) throw ('Error: Repeated attempts to access the device failed.');

    if (result === null) throw ('No device detected');

    return result;

}

async function delay (milliseconds) {

    return new Promise(resolve => setTimeout(resolve, milliseconds));

}

/* Promisified versions of AudioMoth-HID calls */

const getFirmwareDescription = util.promisify(audiomoth.getFirmwareDescription);

const getFirmwareVersion = util.promisify(audiomoth.getFirmwareVersion);

const getPacket = util.promisify(audiomoth.getPacket);

const setPacket = util.promisify(audiomoth.setPacket);

const getID = util.promisify(audiomoth.getID);

/* Device interaction functions */

async function getAudioMothPacket () {

    try {

        /* Read from AudioMoth */

        const id = await callWithRetry(getID, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const description = await callWithRetry(getFirmwareDescription, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const versionArr = await callWithRetry(getFirmwareVersion, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const packet = await callWithRetry(getPacket, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        /* No exceptions have occurred so update display */

        if (id !== previousID) {

            firmwareWarningShown = false;

            versionWarningShown = false;

            previousID = id;

        }

        firmwareDescription = description;
 
        firmwareVersion = versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2];

        const supported = checkVersionCompatibility();

        updateFirmwareDisplay(firmwareVersion, firmwareDescription);

        enableFirmwareDisplay();

        if (supported) {

            if (communicating === false) usePacketValues(packet);

        } else {

            disablePacketDisplay();

            clearPacketDisplay();

            disableButton();

        }

    } catch (e) {

        /* Problem reading from AudioMoth or no AudioMoth */

        disableFirmwareDisplay();

        disablePacketDisplay();

        disableButton();

    }

    const milliseconds = Date.now() % MILLISECONDS_IN_SECOND;

    let delay = MILLISECONDS_IN_SECOND / 2 - milliseconds;

    if (delay < 0) delay += MILLISECONDS_IN_SECOND;

    setTimeout(getAudioMothPacket, delay);

}


/* Check the version and description to see if the firmware is compatible or equivalent to an equivalent version of firmware */

function checkVersionCompatibility () {

    /* This version array may be replaced if the firmware is custom with an equivalent official version */

    let trueVersionArr = firmwareVersion.split('.');

    const classification = constants.getFirmwareClassification(firmwareDescription);

    let versionWarningText, versionWarningTitle;

    switch (classification) {

    case constants.FIRMWARE_OFFICIAL_RELEASE:
    case constants.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE:
    
        versionWarningTitle = 'Firmware update recommended';
        versionWarningText = 'Update to at least version ' + constants.latestFirmwareVersionString + ' of AudioMoth-USB-Microphone firmware to use all the features of this version of the AudioMoth USB Microphone App.';
        
        break;

    case constants.FIRMWARE_UNSUPPORTED:

        updateRecommended = false;

        if (firmwareWarningShown === false) {

            firmwareWarningShown = true;

            setTimeout(function () {

                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: 'Unsupported firmware',
                    message: 'The firmware installed on your AudioMoth is not supported by the AudioMoth USB Microphone App.'
                });

            }, 100);

        }

        return false;

    }

    /* If OFFICIAL_RELEASE, OFFICIAL_RELEASE_CANDIDATE or CUSTOM_EQUIVALENT */

    if (isOlderSemanticVersion(trueVersionArr, constants.latestFirmwareVersionArray)) {

        updateRecommended = true;

        if (versionWarningShown === false) {

            versionWarningShown = true;

            setTimeout(function () {

                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: versionWarningTitle,
                    message: versionWarningText
                });

            }, 100);

        }

    } else {

        updateRecommended = false;

    }

    return true;

}

/* Fill in time/date, ID, battery state, firmware version */

function usePacketValues (packet) {

    const config = packetReader.read(packet.splice(1));

    samplerateDisplay.textContent = (config.sampleRate / config.sampleRateDivider / 1000) + 'kHz';

    const gains = ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'];

    gainDisplay.textContent = gains[config.gain];

    if (config.lowerFilterFreq === 0 && config.higherFilterFreq === 0) {

        filterSettingDisplay.textContent = 'None';

    } else if (config.lowerFilterFreq === UINT16_MAX) {

        filterSettingDisplay.textContent = 'Low-pass (' + Math.floor(config.higherFilterFreq / 10) + '.' + (config.higherFilterFreq % 10) + 'kHz)';

    } else if (config.higherFilterFreq === UINT16_MAX) {

        filterSettingDisplay.textContent = 'High-pass (' + Math.floor(config.lowerFilterFreq / 10) + '.' + (config.lowerFilterFreq % 10) + 'kHz)';

    } else {

        filterSettingDisplay.textContent = 'Band-pass (' + Math.floor(config.lowerFilterFreq / 10) + '.' + (config.lowerFilterFreq % 10) + ' - ' + Math.floor(config.higherFilterFreq / 10) + '.' + (config.higherFilterFreq % 10) + 'kHz)';

    }

    var count = 0;

    var textContent = '';

    if (config.disable48DCFilter === 1) {

        textContent += 'Disable 48Hz DC filter';

        count += 1;

    }

    if (config.energySaverModeEnabled === 1) {

        if (count > 0) textContent += ' / ';

        textContent += 'Energy saver mode';

        count += 1;

    }

    if (config.lowGainRangeEnabled === 1) {

        if (count > 0) textContent += ' / ';

        textContent += 'Low gain range';

        count += 1;

    }

    if (count === 0) textContent = 'None';

    additionalDisplay.textContent = textContent;

    enablePacketDisplay();

    enableButton();

}

/* Send configuration packet to AudioMoth */

async function sendAudioMothPacket (packet) {

    const showError = () => {

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'error',
            title: 'Configuration failed',
            message: 'The connected AudioMoth did not respond correctly and the configuration may not have been applied. Please try again.'
        });

        configureButton.style.color = '';

    };

    try {

        const data = await callWithRetry(setPacket, packet, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        /* Check if the firmware version of the device being configured has a known packet length */
        /* If not, the length of the packet sent/received is used */

        let packetLength = Math.min(packet.length, data.length - 1);

        const firmwareVersionArr = firmwareVersion.split('.');

        for (let k = 0; k < constants.packetLengthVersions.length; k++) {

            const possibleFirmwareVersion = constants.packetLengthVersions[k].firmwareVersion;

            if (isOlderSemanticVersion(firmwareVersionArr, possibleFirmwareVersion.split('.'))) {

                break;

            }

            packetLength = constants.packetLengthVersions[k].packetLength;

        }

        console.log('Using packet length', packetLength);

        /* Verify the packet sent was read correctly by the device by comparing it to the returned packet */

        let matches = true;

        for (let j = 0; j < packetLength; j++) {

            if (packet[j] !== data[j + 1]) {

                console.log('(' + j + ')  ' + packet[j] + ' - ' + data[j + 1]);

                matches = false;

                break;

            }

        }

        if (matches === false) throw ('Packet does not match');

    } catch (e) {

        showError();

    }

}

/* Write bytes into a buffer for transmission */

function writeLittleEndianBytes (buffer, start, byteCount, value) {

    for (let i = 0; i < byteCount; i++) {

        buffer[start + i] = (value >> (i * 8)) & 255;

    }

}

/* Build configuration packet */

function configureDevice () {

    const USB_LAG = 20;

    const MINIMUM_DELAY = 100;

    disablePacketDisplay();

    console.log('Configuring device');

    const settings = uiSettings.getSettings();

    /* Build configuration packet */

    let index = 0;

    /* Packet length is only increased with updates, so take the size of the latest firmware version packet */

    const maxPacketLength = constants.packetLengthVersions.slice(-1)[0].packetLength;

    const packet = new Uint8Array(maxPacketLength);

    /* Increment to next second transition */

    const sendTime = new Date();

    let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Make the data packet */

    writeLittleEndianBytes(packet, index, 4, Math.round(sendTime.valueOf() / 1000));
    index += 4;

    packet[index++] = settings.gain;

    const sampleRateConfiguration = constants.configurations[settings.sampleRateIndex];

    packet[index++] = sampleRateConfiguration.clockDivider;

    packet[index++] = sampleRateConfiguration.acquisitionCycles;

    packet[index++] = sampleRateConfiguration.oversampleRate;

    writeLittleEndianBytes(packet, index, 4, sampleRateConfiguration.sampleRate);
    index += 4;

    packet[index++] = sampleRateConfiguration.sampleRateDivider;

    let lowerFilter, higherFilter;

    if (settings.passFiltersEnabled) {

        switch (settings.filterTypeIndex) {

        case 0:
            /* Low-pass */
            lowerFilter = UINT16_MAX;
            higherFilter = settings.higherFilter / 100;
            break;
        case 1:
            /* Band-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = settings.higherFilter / 100;
            break;
        case 2:
            /* High-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = UINT16_MAX;
            break;

        }

    } else {

        lowerFilter = 0;
        higherFilter = 0;

    }

    writeLittleEndianBytes(packet, index, 2, lowerFilter);
    index += 2;

    writeLittleEndianBytes(packet, index, 2, higherFilter);
    index += 2;

    const disableLED = settings.enableLED ? 0 : 1;

    const energySaverModeEnabled = settings.energySaverModeEnabled ? 1 : 0;

    const disable48DCFilter = settings.disable48DCFilter ? 1 : 0;

    const enableLowGainRange = settings.lowGainRangeEnabled ? 1 : 0;

    packet[index++] = energySaverModeEnabled | (disable48DCFilter << 1) | (enableLowGainRange << 2) | (disableLED << 3);

    console.log('Packet length: ', index);

    /* Send packet to device */

    console.log('Sending packet:');
    console.log(packet);

    let config = packetReader.read(packet);

    packetReader.print(config);

    const now = new Date();

    const sendTimeDiff = sendTime.getTime() - now.getTime();

    /* Calculate when to re-enable time display */

    disableButton();

    communicating = true;

    const updateDelay = sendTimeDiff <= 0 ? MILLISECONDS_IN_SECOND : sendTimeDiff;

    setTimeout(function () {

        communicating = false;

    }, updateDelay);

    /* Either send immediately or wait until the transition */

    if (sendTimeDiff <= 0) {

        console.log('Sending...');

        sendAudioMothPacket(packet);

    } else {

        console.log('Sending in', sendTimeDiff);

        setTimeout(function () {

            sendAudioMothPacket(packet);

        }, sendTimeDiff);

    }

}

/* Initialise device information displays */

function initialiseDisplay () {

    firmwareVersionDisplay.textContent = '-';
    firmwareDescriptionDisplay.textContent = '-';

}

/* Disable/enable device information display */

function disableFirmwareDisplay () {

    firmwareLabels.forEach(label => label.classList.add('grey'));
    firmwareDisplays.forEach(display => display.classList.add('grey'));

};

function clearPacketDisplay() {

    packetDisplays.forEach(display => display.textContent = '-');

}

function disablePacketDisplay () {

    packetLabels.forEach(label => label.classList.add('grey'));
    packetDisplays.forEach(display => display.classList.add('grey'));

};

function disableButton () {

    configureButton.disabled = true;

}

function enableFirmwareDisplay () {

    firmwareLabels.forEach(label => label.classList.remove('grey'));
    firmwareDisplays.forEach(display => display.classList.remove('grey'));

};

function enablePacketDisplay () {

    packetLabels.forEach(label => label.classList.remove('grey'));
    packetDisplays.forEach(display => display.classList.remove('grey'));

}

function enableButton () {

    configureButton.disabled = false;

}

/* Insert retrieved values into device information display */

function updateFirmwareDisplay (version, description) {

    firmwareVersionDisplay.textContent = version;

    if (updateRecommended) {

        firmwareVersionDisplay.textContent += ' (Update recommended)';

    }

    firmwareDescriptionDisplay.textContent = description;

};

function toggleNightMode () {

    ui.toggleNightMode();

}

/* Add listeners to update menu options */

electron.ipcRenderer.on('update-check', function () {

    versionChecker.checkLatestRelease(function (response) {

        if (response.error) {

            console.error(response.error);

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Failed to check for updates',
                message: response.error
            });

            return;

        }

        if (response.updateNeeded === false) {

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'info',
                buttons: ['OK'],
                title: 'Update not needed',
                message: 'Your app is on the latest version (' + response.latestVersion + ').'
            });

            return;

        }

        const buttonIndex = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Download newer version',
            message: 'A newer version of this app is available (' + response.latestVersion + '), would you like to download it?'
        });

        if (buttonIndex === 0) {

            electron.shell.openExternal('https://www.openacousticdevices.info/applications');

        }

    });

});

/* Prepare UI */

disableFirmwareDisplay();
disablePacketDisplay();
disableButton();

initialiseDisplay();

getAudioMothPacket();

electron.ipcRenderer.on('night-mode', toggleNightMode);

configureButton.addEventListener('click', () => {

    configureDevice();

});

uiSettings.prepareUI();
