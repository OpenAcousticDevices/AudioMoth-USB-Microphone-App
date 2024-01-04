/****************************************************************************
 * uiAdvanced.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

const enableLED = document.getElementById('enable-LED-checkbox');
const energySaverModeCheckbox = document.getElementById('energy-saver-mode-checkbox');
const disable48DCFilterCheckbox = document.getElementById('disable-48-dc-filter-checkbox');
const lowGainRangeCheckbox = document.getElementById('low-gain-range-checkbox');

exports.isLEDEnabled = () => {

    return enableLED.checked;

};

exports.isEnergySaverModeEnabled = () => {

    return energySaverModeCheckbox.checked;

};

exports.is48DCFilterDisabled = () => {

    return disable48DCFilterCheckbox.checked;

};

exports.isLowGainRangeEnabled = () => {

    return lowGainRangeCheckbox.checked;

}
