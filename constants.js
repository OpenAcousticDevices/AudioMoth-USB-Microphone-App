/****************************************************************************
 * recordingConfigurations.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

/* Setting parameters */

exports.configurations = [{
    trueSampleRate: 8,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 48
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 24
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 12
}, {
    trueSampleRate: 48,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8
}, {
    trueSampleRate: 96,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4
}, {
    trueSampleRate: 192,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2
}, {
    trueSampleRate: 250,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 250000,
    sampleRateDivider: 1
}, {
    trueSampleRate: 384,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1
}];

/* Packet lengths for each version */

exports.packetLengthVersions = [{
    firmwareVersion: '1.0.0',
    packetLength: 18
},
{
    firmwareVersion: '1.2.0',
    packetLength: 19
}];

const FIRMWARE_OFFICIAL_RELEASE = 0;
const FIRMWARE_OFFICIAL_RELEASE_CANDIDATE = 1;
const FIRMWARE_UNSUPPORTED = 2;

exports.FIRMWARE_OFFICIAL_RELEASE = FIRMWARE_OFFICIAL_RELEASE;
exports.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE = FIRMWARE_OFFICIAL_RELEASE_CANDIDATE;
exports.FIRMWARE_UNSUPPORTED = FIRMWARE_UNSUPPORTED;

/* Remove trailing digit and check if description is in list of supported firmware descriptions */

exports.getFirmwareClassification = (desc) => {

    /* If official firmware or a release candidate of the official firmware */

    if (desc === 'AudioMoth-USB-Microphone') {

        return FIRMWARE_OFFICIAL_RELEASE;

    }

    if (desc.replace(/-RC\d+$/, '-RC') === 'AudioMoth-USB-Microphone-RC') {

        return FIRMWARE_OFFICIAL_RELEASE_CANDIDATE;

    }

    return FIRMWARE_UNSUPPORTED;

};

/* Version number for the latest firmware */

exports.latestFirmwareVersionArray = ['1', '2', '0'];
exports.latestFirmwareVersionString = '1.2.0';
