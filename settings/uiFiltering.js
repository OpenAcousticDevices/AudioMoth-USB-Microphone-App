/****************************************************************************
 * uiFiltering.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

const constants = require('../constants.js');

const Slider = require('bootstrap-slider');

const FILTER_SLIDER_STEPS = [100, 100, 100, 100, 200, 500, 500, 1000];

const filterTypeLabel = document.getElementById('filter-type-label');
const filterRadioButtons = document.getElementsByName('filter-radio');
const filterRadioLabels = document.getElementsByName('filter-radio-label');

const highPassRow = document.getElementById('high-pass-row');
const lowPassRow = document.getElementById('low-pass-row');
const bandPassRow = document.getElementById('band-pass-row');

const bandPassMaxLabel = document.getElementById('band-pass-filter-max-label');
const bandPassMinLabel = document.getElementById('band-pass-filter-min-label');
const lowPassMaxLabel = document.getElementById('low-pass-filter-max-label');
const lowPassMinLabel = document.getElementById('low-pass-filter-min-label');
const highPassMaxLabel = document.getElementById('high-pass-filter-max-label');
const highPassMinLabel = document.getElementById('high-pass-min-label');

const filterCheckbox = document.getElementById('filter-checkbox');
const highPassFilterSlider = new Slider('#high-pass-filter-slider', {});
const lowPassFilterSlider = new Slider('#low-pass-filter-slider', {});
const bandPassFilterSlider = new Slider('#band-pass-filter-slider', {});

const filterLabel = document.getElementById('filter-label');

/* Only scale filter sliders if the filter has been enabled this session */
var filterHasBeenEnabled = false;

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

    previousSelectionType = newSelectionType;

}

/* Update the text on the label which describes the range of frequencies covered by the filter */

function updateFilterLabel () {

    if (!filterCheckbox.checked) {

        return;

    }

    let currentBandPassLower, currentBandPassHigher, currentHighPass, currentLowPass;

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

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

exports.setFilters = (enabled, lowerSliderValue, higherSliderValue, filterType) => {

    filterCheckbox.checked = enabled;

    filterHasBeenEnabled = enabled;

    if (enabled) {

        switch (filterType) {

        case FILTER_LOW:
            setLowPassSliderValue(higherSliderValue);
            break;

        case FILTER_HIGH:
            setHighPassSliderValue(lowerSliderValue);
            break;

        case FILTER_BAND:
            setBandPass(lowerSliderValue, higherSliderValue);
            break;

        }

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].checked = (i === filterType);

        }

        updateFilterLabel();

    }

};

/* External functions for obtaining values */

exports.filteringIsEnabled = () => {

    return filterCheckbox.checked;

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

/* Check if the filtering UI should be enabled and update accordingly */

function updateFilterUI () {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

        case FILTER_LOW:
            lowPassRow.style.display = 'flex';
            highPassRow.style.display = 'none';
            bandPassRow.style.display = 'none';
            break;
        case FILTER_HIGH:
            lowPassRow.style.display = 'none';
            highPassRow.style.display = 'flex';
            bandPassRow.style.display = 'none';
            break;
        case FILTER_BAND:
            lowPassRow.style.display = 'none';
            highPassRow.style.display = 'none';
            bandPassRow.style.display = 'flex';
            break;

    }

    if (filterCheckbox.checked) {

        filterTypeLabel.classList.remove('grey');

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].classList.remove('grey');
            filterRadioButtons[i].disabled = false;
            filterRadioLabels[i].classList.remove('grey');

        }

        bandPassFilterSlider.enable();
        lowPassFilterSlider.enable();
        highPassFilterSlider.enable();

        bandPassMaxLabel.classList.remove('grey');
        bandPassMinLabel.classList.remove('grey');
        lowPassMaxLabel.classList.remove('grey');
        lowPassMinLabel.classList.remove('grey');
        highPassMaxLabel.classList.remove('grey');
        highPassMinLabel.classList.remove('grey');

        filterLabel.classList.remove('grey')

    } else {

        filterTypeLabel.classList.add('grey');

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].classList.add('grey');
            filterRadioButtons[i].disabled = true;
            filterRadioLabels[i].classList.add('grey');

        }

        bandPassFilterSlider.disable();
        lowPassFilterSlider.disable();
        highPassFilterSlider.disable();

        bandPassMaxLabel.classList.add('grey');
        bandPassMinLabel.classList.add('grey');
        lowPassMaxLabel.classList.add('grey');
        lowPassMinLabel.classList.add('grey');
        highPassMaxLabel.classList.add('grey');
        highPassMinLabel.classList.add('grey');

        filterLabel.textContent = 'Samples will not be filtered.';
        filterLabel.classList.add('grey')

    }

}

exports.updateFilterUI = updateFilterUI;

/* When sample rate changes, so does the slider step. Update values to match the corresponding step */

function roundToSliderStep (value, step) {

    return Math.round(value / step) * step;

}

/* Update UI according to new sample rate selection */

function sampleRateChange () {

    const sampleRateIndex = getSelectedRadioValue('sample-rate-radio');

    const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;
    const maxFreq = sampleRate / 2;

    const labelText = (maxFreq / 1000) + 'kHz';

    lowPassMaxLabel.textContent = labelText;
    highPassMaxLabel.textContent = labelText;
    bandPassMaxLabel.textContent = labelText;

    highPassFilterSlider.setAttribute('max', maxFreq);
    lowPassFilterSlider.setAttribute('max', maxFreq);
    bandPassFilterSlider.setAttribute('max', maxFreq);

    highPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);
    lowPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);
    bandPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);

    /* Get current slider values */

    const currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
    const currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());
    const currentLowPass = lowPassFilterSlider.getValue();
    const currentHighPass = highPassFilterSlider.getValue();

    if (filterHasBeenEnabled) {

        /* Validate current band-pass filter values */

        const newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;
        const newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;
        setBandPass(roundToSliderStep(Math.max(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRateIndex]), roundToSliderStep(Math.min(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRateIndex]));

        /* Validate current low-pass filter value */

        const newLowPass = currentLowPass > maxFreq ? maxFreq : currentLowPass;
        setLowPassSliderValue(roundToSliderStep(newLowPass, FILTER_SLIDER_STEPS[sampleRateIndex]));

        /* Validate current high-pass filter value */

        const newHighPass = currentHighPass > maxFreq ? maxFreq : currentHighPass;
        setHighPassSliderValue(roundToSliderStep(newHighPass, FILTER_SLIDER_STEPS[sampleRateIndex]));

    } else {

        /* Set high/low-pass sliders to 1/4 and 3/4 of the bar if filtering has not yet been enabled */

        const newLowPassFreq = maxFreq / 4;
        const newHighPassFreq = 3 * maxFreq / 4;

        /* Set band-pass filter values */

        setBandPass(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRateIndex]), roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRateIndex]));

        /* Set low-pass filter value */

        setLowPassSliderValue(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRateIndex]));

        /* Set high-pass filter value */

        setHighPassSliderValue(roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRateIndex]));

    }

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

        });

    }

}

/* Prepare UI */

exports.prepareUI = () => {

    addRadioButtonListeners();

    filterCheckbox.addEventListener('change', () => {

        updateFilterLabel();

        if (filterCheckbox.checked) {

            filterHasBeenEnabled = true;
            sampleRateChange();

        }

        updateFilterUI();

    });

    bandPassFilterSlider.on('change', updateFilterLabel);
    lowPassFilterSlider.on('change', updateFilterLabel);
    highPassFilterSlider.on('change', updateFilterLabel);

    updateFilterUI();

};
