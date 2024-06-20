/****************************************************************************
 * uiFiltering.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

const constants = require('../constants.js');

const Slider = require('bootstrap-slider');

const FILTER_SLIDER_STEPS = {8000: 100, 16000: 100, 32000: 100, 48000: 100, 96000: 200, 192000: 500, 250000: 500, 384000: 1000};

const filterTypeLabel = document.getElementById('filter-type-label');
const filterRadioButtons = document.getElementsByName('filter-radio');
const filterRadioLabels = document.getElementsByName('filter-radio-label');

const disabledRow = document.getElementById('disabled-row');
const highPassRow = document.getElementById('high-pass-row');
const lowPassRow = document.getElementById('low-pass-row');
const bandPassRow = document.getElementById('band-pass-row');

const disabledMaxLabel = document.getElementById('disabled-filter-max-label');
const disabledMinLabel = document.getElementById('disabled-filter-min-label');
const bandPassMaxLabel = document.getElementById('band-pass-filter-max-label');
const bandPassMinLabel = document.getElementById('band-pass-filter-min-label');
const lowPassMaxLabel = document.getElementById('low-pass-filter-max-label');
const lowPassMinLabel = document.getElementById('low-pass-filter-min-label');
const highPassMaxLabel = document.getElementById('high-pass-filter-max-label');
const highPassMinLabel = document.getElementById('high-pass-min-label');

const disabledFilterSliderHolder = document.getElementById('disabled-filter-slider-holder');
const disabledFilterSlider = new Slider('#disabled-filter-slider', {});

const highPassFilterSlider = new Slider('#high-pass-filter-slider', {});
const lowPassFilterSlider = new Slider('#low-pass-filter-slider', {});
const bandPassFilterSlider = new Slider('#band-pass-filter-slider', {});

const filterLabel = document.getElementById('filter-label');

/* Only scale frequency sliders if they have been changed this session */
let passFiltersObserved = false;

const FILTER_NONE = 3;
const FILTER_LOW = 0;
const FILTER_BAND = 1;
const FILTER_HIGH = 2;
exports.FILTER_LOW = FILTER_LOW;
exports.FILTER_BAND = FILTER_BAND;
exports.FILTER_HIGH = FILTER_HIGH;

var previousSelectionType = 1;

/* Add last() to Array */

if (!Array.prototype.last) {

    Array.prototype.last = () => {

        return this[this.length - 1];

    };

};

/**
 * If any of the frequency filter sliders have been observed
 */
exports.getPassFiltersObserved = () => {

    return passFiltersObserved;

}

/* Retrieve the radio button selected from a group of named buttons */

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value, 10);

}

function updateFilterSliders () {

    const newSelectionType = getSelectedRadioValue('filter-radio');

    if (previousSelectionType === FILTER_LOW) {

        if (newSelectionType === FILTER_BAND) {

            bandPassFilterSlider.setValue([0, lowPassFilterSlider.getValue()]);

        } else if (newSelectionType === FILTER_HIGH) {

            highPassFilterSlider.setValue(lowPassFilterSlider.getValue());

        }

    } else if (previousSelectionType === FILTER_HIGH) {

        if (newSelectionType === FILTER_BAND) {

            bandPassFilterSlider.setValue([highPassFilterSlider.getValue(), bandPassFilterSlider.getAttribute('max')]);

        } else if (newSelectionType === FILTER_LOW) {

            lowPassFilterSlider.setValue(highPassFilterSlider.getValue());

        }

    } else if (previousSelectionType === FILTER_BAND) {

        if (newSelectionType === FILTER_LOW) {

            lowPassFilterSlider.setValue(Math.max(...bandPassFilterSlider.getValue()));

        } else if (newSelectionType === FILTER_HIGH) {

            highPassFilterSlider.setValue(Math.min(...bandPassFilterSlider.getValue()));

        }

    }

    if (newSelectionType !== FILTER_NONE) {

        previousSelectionType = newSelectionType;

    }

}

/* Update the text on the label which describes the range of frequencies covered by the filter */

function updateFilterLabel () {

    let currentBandPassLower, currentBandPassHigher, currentHighPass, currentLowPass;

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_NONE:
        return;
    case FILTER_HIGH:
        currentHighPass = highPassFilterSlider.getValue() / 1000;
        filterLabel.textContent = 'Samples will be filtered to frequencies above ' + currentHighPass.toFixed(1) + ' kHz.';
        break;
    case FILTER_LOW:
        currentLowPass = lowPassFilterSlider.getValue() / 1000;
        filterLabel.textContent = 'Samples will be filtered to frequencies below ' + currentLowPass.toFixed(1) + ' kHz.';
        break;
    case FILTER_BAND:
        currentBandPassLower = Math.min(...bandPassFilterSlider.getValue()) / 1000;
        currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue()) / 1000;
        filterLabel.textContent = 'Samples will be filtered to frequencies between ' + currentBandPassLower.toFixed(1) + ' and ' + currentBandPassHigher.toFixed(1) + ' kHz.';
        break;

    }

}

/* Set the high-pass filter values to given value */

function setHighPassSliderValue (value) {

    highPassFilterSlider.setValue(value);

}

/* Set the low-pass filter values to given value */

function setLowPassSliderValue (value) {

    lowPassFilterSlider.setValue(value);

}

/* Set the band-pass filter values to 2 given values */

function setBandPass (lowerSliderValue, higherSliderValue) {

    lowerSliderValue = (lowerSliderValue === -1) ? 0 : lowerSliderValue;
    higherSliderValue = (higherSliderValue === -1) ? bandPassFilterSlider.getAttribute('max') : higherSliderValue;

    bandPassFilterSlider.setValue([lowerSliderValue, higherSliderValue]);

}

/* Exported functions for setting values */
function setFilters (enabled, lowerSliderValue, higherSliderValue, filterType) {

    passFiltersObserved = enabled;

    let filterTypeIndex = FILTER_NONE;

    setLowPassSliderValue(higherSliderValue);
    setHighPassSliderValue(lowerSliderValue);
    setBandPass(lowerSliderValue, higherSliderValue);

    switch (filterType) {

    case 'low':
        filterTypeIndex = FILTER_LOW;
        break;

    case 'high':
        filterTypeIndex = FILTER_HIGH;
        break;

    case 'band':
        filterTypeIndex = FILTER_BAND;
        break;

    }

    for (let i = 0; i < filterRadioButtons.length; i++) {

        if (parseInt(filterRadioButtons[i].value) === filterTypeIndex) {

            filterRadioButtons[i].checked = true;

        }

    }

    updateFilterLabel();

}

exports.setFilters = setFilters;

/* External functions for obtaining values */

/**
 * Is pre-threshold filtering enabled
 * @returns Boolean reflecting if pre-threshold filtering is enabled
 */
exports.filteringIsEnabled = () => {

    const filterIndex = getFilterRadioValue();

    return filterIndex !== FILTER_NONE;

};

exports.getFilterType = () => {

    return getSelectedRadioValue('filter-radio');

};

exports.getLowerSliderValue = () => {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return highPassFilterSlider.getValue();
    case FILTER_LOW:
        return 0;
    case FILTER_BAND:
        return Math.min(...bandPassFilterSlider.getValue());

    }

};

exports.getHigherSliderValue = () => {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return 65535;
    case FILTER_LOW:
        return lowPassFilterSlider.getValue();
    case FILTER_BAND:
        return Math.max(...bandPassFilterSlider.getValue());

    }

};

function getFilterRadioValue () {

    return getSelectedRadioValue('filter-radio');

}

/* Check if the filtering UI should be enabled and update accordingly */

function updateFilterUI () {

    const filterIndex = getFilterRadioValue();

    switch (filterIndex) {

    case FILTER_NONE:
        disabledRow.style.display = 'flex';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_LOW:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'flex';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_HIGH:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'flex';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_BAND:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'flex';
        break;

    }

    if (filterIndex !== FILTER_NONE) {

        filterLabel.classList.remove('grey');

    } else {

        filterLabel.textContent = 'Recordings will not be filtered.';
        filterLabel.classList.add('grey');

    }

}

exports.updateFilterUI = updateFilterUI;

/* When sample rate changes, so does the slider step. Update values to match the corresponding step */

function roundToSliderStep (value, step) {

    return Math.round(value / step) * step;

}

/**
 * Update UI according to new sample rate selection
 * @param {bool} resetPassSliders Whether or not to set pass sliders back to defaults
 * @param {int} sampleRate New sample rate
 */
function sampleRateChange (resetPassSliders, sampleRate) {

    const maxFreq = sampleRate / 2;

    const labelText = (maxFreq / 1000) + 'kHz';

    disabledMaxLabel.textContent = labelText;
    lowPassMaxLabel.textContent = labelText;
    highPassMaxLabel.textContent = labelText;
    bandPassMaxLabel.textContent = labelText;

    highPassFilterSlider.setAttribute('max', maxFreq);
    lowPassFilterSlider.setAttribute('max', maxFreq);
    bandPassFilterSlider.setAttribute('max', maxFreq);

    const filterSliderStep = FILTER_SLIDER_STEPS[sampleRate];

    highPassFilterSlider.setAttribute('step', filterSliderStep);
    lowPassFilterSlider.setAttribute('step', filterSliderStep);
    bandPassFilterSlider.setAttribute('step', filterSliderStep);

    /* Get current slider values */

    const currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
    const currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());
    const currentLowPass = lowPassFilterSlider.getValue();
    const currentHighPass = highPassFilterSlider.getValue();

    /* Reset pass sliders */

    if (resetPassSliders) {

        /* Set high/low-pass sliders to 1/4 and 3/4 of the bar if filtering has not yet been enabled */

        const newLowPassFreq = maxFreq / 4;
        const newHighPassFreq = 3 * maxFreq / 4;

        /* Set band-pass filter values */

        setBandPass(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRate]), roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

        /* Set low-pass filter value */

        setLowPassSliderValue(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

        /* Set high-pass filter value */

        setHighPassSliderValue(roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

    } else {

        /* Validate current band-pass filter values */

        const newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;
        const newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;
        setBandPass(roundToSliderStep(Math.max(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRate]), roundToSliderStep(Math.min(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRate]));

        /* Validate current low-pass filter value */

        const newLowPass = currentLowPass > maxFreq ? maxFreq : currentLowPass;
        setLowPassSliderValue(roundToSliderStep(newLowPass, FILTER_SLIDER_STEPS[sampleRate]));

        /* Validate current high-pass filter value */

        const newHighPass = currentHighPass > maxFreq ? maxFreq : currentHighPass;
        setHighPassSliderValue(roundToSliderStep(newHighPass, FILTER_SLIDER_STEPS[sampleRate]));

    }

    /* Update labels */

    updateFilterLabel();

}

exports.sampleRateChange = sampleRateChange;

/* Add listeners to all radio buttons which update the filter sliders */

function addRadioButtonListeners () {

    for (let i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].addEventListener('change', function () {

            updateFilterUI();
            updateFilterSliders();
            updateFilterLabel();

            if (filterRadioButtons[i].value !== FILTER_NONE) {

                passFiltersObserved = true;

            }

        });

    }

}

/* Prepare UI */

exports.prepareUI = () => {

    // Disable interactions with disabled slider

    disabledFilterSlider.disable();

    const children = disabledFilterSliderHolder.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {

        if (children[i].style) {

            children[i].style.cursor = 'not-allowed';

        }

    }

    addRadioButtonListeners();

    bandPassFilterSlider.on('change', updateFilterLabel);
    lowPassFilterSlider.on('change', updateFilterLabel);
    highPassFilterSlider.on('change', updateFilterLabel);

    updateFilterUI();

};
