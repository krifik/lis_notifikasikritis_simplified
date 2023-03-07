const { app, Tray, BrowserWindow, Menu, screen, ipcMain } = require("electron");
const redis = require('redis');
const winston = require("winston");
require("dotenv").config();
const path = require("path");
const url = require("url");
const remote = require('@electron/remote/main').initialize()

// try {
//     require('electron-reloader')(module);
// } catch (_) { }

let tray = null;
let mainWindow = null;

// Create a logger
const logger = winston.createLogger({
    level: "info",
    maxsize: 5242880, // 5MB
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),

    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

// redis setup
const redisUrl = process.env.REDIS_URL;
const channelName = process.env.CHANNEL_NAME;
const redisClient = redis.createClient({ url: redisUrl });

redisClient.connect();
redisClient.on('connect', function () {
    logger.info("Redis connected");
});

redisClient.on('error', function (err) {
    logger.error(err);
});

redisClient.subscribe(channelName, async (data) => {
    logger.info("Redis data received: " + data);
    mainWindow.webContents.send("notif", data);
    // reset REFRESH ketika ada data masuk
    refreshAt(00,00,00)
});
function refreshAt(hours, minutes, seconds) {
    var now = new Date();
    var then = new Date();

    if(now.getHours() > hours ||
       (now.getHours() == hours && now.getMinutes() > minutes) ||
        now.getHours() == hours && now.getMinutes() == minutes && now.getSeconds() >= seconds) {
        then.setDate(now.getDate() + 1);
    }
    then.setHours(hours);
    then.setMinutes(minutes);
    then.setSeconds(seconds);

    var timeout = (then.getTime() - now.getTime());
    setTimeout(function() { mainWindow.webContents.send('refresh'); }, timeout);
}

app.on("ready", () => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    refreshAt(00,00,00) 
    // refresh pada jam 00:00:00
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, "alert.png"),
        width: Math.round(width / 1.5),
        height: Math.round(height / 1.5),
        show: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // enableRemoteModule: true
        },
    });
    mainWindow.show()
    
    require("@electron/remote/main").enable(mainWindow.webContents)
    // open devtools
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents
    .on("before-input-event",
    (event,input)=>
    { 
        if(input.code=='F4'&&input.alt) {
            event.preventDefault();
        }
    }
    );
    mainWindow.webContents.send('refresh');
   
    mainWindow.setMenuBarVisibility(false);
    // 

    // mainWindow.loadFile("src/index.html");
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "src/index.html"),
            protocol: "file:",
            slashes: true
        })
    );
    if(process.env.DEBUGGING){ 
         mainWindow.webContents.openDevTools();
    }
    

    authWindow = new BrowserWindow({
        icon: path.join(__dirname, "alert.png"),
        width: 400,
        height: 400,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    tray = new Tray(path.join(__dirname, "alert.png"));
    tray.on("click", () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Auto Login', type: 'normal', click: () => {
                authWindow.loadURL(
                    url.format({
                        pathname: path.join(__dirname, "src/auth.html"),
                        protocol: "file:",
                        slashes: true
                    })
                );
                authWindow.show();
            }
        },
        { label: 'Exit', type: 'normal', click: () => { app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);

    // mainWindow.on('close', function (evt) {
    //     evt.preventDefault();
    //     mainWindow.hide();
    // });
});

app.on('close', (event) => {
    event.preventDefault();

})

app.on('window-all-closed', (event) => {
    event.preventDefault();
})

app.on('closed', (event) => {
    event.preventDefault();

})

ipcMain.on("showWindow", (event, arg) => {
    mainWindow.show()
})

ipcMain.on("hideWindow", (event, arg) => {
    mainWindow.hide()
})
