/****************************************************************************
 * uiSettings.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

const uiFiltering = require('./uiFiltering.js');
const uiAdvanced = require('./uiAdvanced.js');

/* UI components */

const sampleRadioButtons = document.getElementsByName('sample-rate-radio');
const gainRadioButtons = document.getElementsByName('gain-radio');

const sampleRates = [8000, 16000, 32000, 48000, 96000, 192000, 250000, 384000];

/* Add listeners to all radio buttons which update the life display */

function addRadioButtonListeners () {

    for (let i = 0; i < sampleRadioButtons.length; i++) {

        sampleRadioButtons[i].addEventListener('change', function () {

            const sampleRateIndex = parseInt(getSelectedRadioValue('sample-rate-radio'));

            if (sampleRateIndex === i) {

                uiFiltering.sampleRateChange(!uiFiltering.getPassFiltersObserved(), sampleRates[sampleRateIndex]);

            }

        });

    }

}

/* Prepare UI */

exports.prepareUI = () => {

    uiFiltering.prepareUI();

    addRadioButtonListeners();

    const sampleRateIndex = parseInt(getSelectedRadioValue('sample-rate-radio'));
    uiFiltering.sampleRateChange(!uiFiltering.getPassFiltersObserved(), sampleRates[sampleRateIndex]);

};

function getSelectedRadioValue (radioName) {

    return document.querySelector('input[name="' + radioName + '"]:checked').value;

}

exports.getSettings = () => {

    const settings = {
        sampleRateIndex: parseInt(getSelectedRadioValue('sample-rate-radio')),
        gain: parseInt(getSelectedRadioValue('gain-radio')),
        passFiltersEnabled: uiFiltering.filteringIsEnabled(),
        filterTypeIndex: uiFiltering.getFilterType(),
        lowerFilter: uiFiltering.getLowerSliderValue(),
        higherFilter: uiFiltering.getHigherSliderValue(),
        enableLED: uiAdvanced.isLEDEnabled(),
        energySaverModeEnabled: uiAdvanced.isEnergySaverModeEnabled(),
        disable48DCFilter: uiAdvanced.is48DCFilterDisabled(),
        lowGainRangeEnabled: uiAdvanced.isLowGainRangeEnabled()
    };

    return settings;

};

/* Receive message from the menu about which amplitude threshold scale to use */

electron.ipcRenderer.on('amplitude-threshold-scale', (e, indexSelected) => {

    uiFiltering.setAmplitudeThresholdScaleIndex(indexSelected);

});
