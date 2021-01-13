require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const path = require("path");
const {exec} = require("child_process");
const axios = require("axios");

const {CHROME_EXECUTABLE_PATH} = process.env;

puppeteer.use(pluginStealth());

const sessionsPath = path.join(__dirname, "sessions");
const chromePath = CHROME_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";

const initBrowser = async () => {
    // await exec(`${chromePath} --user-data-dir='${path.join(sessionsPath, name)}' --remote-debugging-port=${port}`);
    console.log("getting browser ws endpoint ..");
    const {data: {webSocketDebuggerUrl}} = await axios.get(`http://localhost:2345/json/version`);
    console.log("connecting to browser ..")
    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null,
        slowMo: true,
    });
    console.log("getting open tab ..")
    const pages = await browser.pages();
    const page = pages[pages.length - 1];
    console.log("return browser and tab data ..")
    console.log("page =>", await browser.pages());
    return {browser, page}
}

const ytLogin = async (page, email, password) => {
    let loggedIn = false;
    console.log("opening youtube upload url ..")
    await page.goto("https://youtube.com/upload");
    try {
        console.log("checking logged in or not ..")
        await page.waitForSelector("#identifierId", {timeout: 5000});
    } catch (e) {
        console.log("already logged in ..")
        loggedIn = true;
    }
    if (!loggedIn) {
        console.log("login to google ..")
        await page.type("#identifierId", email + "\n");
        console.log("input password ..")
        await page.waitForSelector(`[name="password"]`, password + "\n")
    }
}

const ytUpload = async (page, videoPath, title, desc) => {
    console.log("opening upload url ..")
    await page.goto("https://youtube.com/upload", {waitUntil: "networkidle0"});
    await page.waitForTimeout(3000);
    console.log("getting element upload ..")
    const elementUpload = await page.$("input[type=\"file\"][name=\"Filedata\"]");
    console.log("uploading video file ..");
    await elementUpload.uploadFile(videoPath);
    console.log("wait for selector #basic ..")
    await page.waitForTimeout(10000);
    console.log("entering title ..")
    await page.type(".title-textarea > #container > div > #child-input > #input > #textbox", title);
    console.log("entering description ..")
    await page.type(".description-textarea > #container > div > #child-input > #input > #textbox", desc);
    console.log("wait upload process ..")
    await page.waitForFunction(`!document.querySelector(".progress-label").innerText.includes("%")`, {timeout: 0});
    console.log("upload selesai ..")
}

(async () => {
    const {page} = await initBrowser();
    await ytLogin(page, "", "");
    await ytUpload(
        page,
        "/home/hq/Videos/Screencast from 13-01-21 16:46:25.webm",
        "Coba Upload Video YouTube Menggunakan Puppeteer",
        "Coba Upload Video YouTube Menggunakan Puppeteer",
    );
})()

module.exports = {
    initBrowser,
    ytLogin,
};