/****************************************************************************
 * main.js
 * openacousticdevices.info
 * August 2021
 *****************************************************************************/

'use strict';

const {app, Menu, shell, ipcMain, BrowserWindow} = require('electron');

require('@electron/remote/main').initialize();

const path = require('path');

require('electron-debug')({
    showDevTools: true,
    devToolsMode: 'undocked'
});

var mainWindow, aboutWindow;

const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';
const standardWindowSettings = {
    resizable: false,
    fullscreenable: false,
    minimizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, iconLocation),
    useContentSize: true,
    webPreferences: {
        enableRemoteModule: true,
        nodeIntegration: true,
        contextIsolation: false
    }
};

/* Generate settings objects for windows and progress bars */

function generateSettings (width, height, title) {

    const uniqueSettings = {
        width,
        height,
        title
    };

    const settings = Object.assign({}, standardWindowSettings, uniqueSettings);
    settings.parent = mainWindow;

    return settings;

}

function openAboutWindow () {

    if (aboutWindow) {

        aboutWindow.show();
        return;

    }

    let windowWidth = 400;
    let windowHeight = 310;

    if (process.platform === 'linux') {

        windowWidth = 395;
        windowHeight = 310;

    } else if (process.platform === 'darwin') {

        windowWidth = 395;
        windowHeight = 310;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'About');
    aboutWindow = new BrowserWindow(settings);

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(path.join('file://', __dirname, '/about.html'));

    require('@electron/remote/main').enable(aboutWindow.webContents);

    aboutWindow.on('close', (e) => {

        e.preventDefault();

        aboutWindow.hide();

    });

    aboutWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (aboutWindow) {

            aboutWindow.webContents.send('night-mode', nightMode);

        }

    });

}

function toggleNightMode () {

    mainWindow.webContents.send('night-mode');

    if (aboutWindow) {

        aboutWindow.webContents.send('night-mode');

    }

}

app.on('ready', function () {

    let windowWidth = 565;
    let windowHeight = 675;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 654;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 656;

    }

    mainWindow = new BrowserWindow({
        title: 'AudioMoth USB Microphone App',
        width: windowWidth,
        height: windowHeight,
        resizable: false,
        fullscreenable: false,
        useContentSize: true,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    require('@electron/remote/main').enable(mainWindow.webContents);

    const menuTemplate = [{
        label: 'File',
        submenu: [{
            id: 'copyid',
            label: 'Copy Device ID',
            accelerator: 'CommandOrControl+I',
            click: () => {

                mainWindow.webContents.send('copy-id');

            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'nightmode',
            label: 'Night Mode',
            accelerator: 'CommandOrControl+N',
            checked: false,
            click: toggleNightMode
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'CommandOrControl+Q',
            click: function () {

                app.quit();

            }
        }]
    }, {
        label: 'Help',
        submenu: [{
            label: 'About',
            click: function () {

                openAboutWindow();

            }
        }, {
            label: 'Check For Updates',
            click: function () {

                mainWindow.webContents.send('update-check');

            }
        }, {
            type: 'separator'
        }, {
            label: 'AudioMoth Play Website',
            click: function () {

                shell.openExternal('https://play.openacousticdevices.info/');

            }
        }, {
            type: 'separator'
        }, {
            label: 'Open Acoustic Devices Website',
            click: function () {

                shell.openExternal('https://openacousticdevices.info');

            }
        }]
    }];

    const menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

});

app.on('window-all-closed', function () {

    app.quit();

});

app.disableHardwareAcceleration();
