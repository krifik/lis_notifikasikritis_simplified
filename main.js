const { app, Tray, BrowserWindow, Menu } = require("electron");
const redis = require('redis');
const winston = require("winston");
require("dotenv").config();

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
});

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 200,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.setMenuBarVisibility(false);

    mainWindow.loadFile("src/index.html");
    // mainWindow.webContents.openDevTools();

    tray = new Tray("alert.png");
    tray.on("click", () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Exit', type: 'normal', click: () => { app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);

    // mainWindow.on('close', function (evt) {
    //     evt.preventDefault();
    //     mainWindow.hide();
    // });
});