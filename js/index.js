
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

const USER_AGENT = "APKUpdater-v2.0.5";
const AUTH_HEADER = "Basic YXBpLWFwa3VwZGF0ZXI6cm01cmNmcnVVakt5MDRzTXB5TVBKWFc4";

const versionFilePath = path.resolve("../version.txt");
let previousVersion = 0;
try {
    const content = fs.readFileSync(versionFilePath, "utf-8").trim();
    previousVersion = parseInt(content, 10);
    if (isNaN(previousVersion)) {
        previousVersion = 0;
    }
} catch (err) {
    previousVersion = 0;
}

async function downloadAPK(previousVersion, versionFilePath) {
    const postResp = await fetch("https://www.apkmirror.com/wp-json/apkm/v1/app_exists/", {
        method: "POST",
        headers: {
            "User-Agent": USER_AGENT,
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pnames: ["com.discord"] }),
    });
    if (!postResp.ok) throw new Error(`POST failed: ${postResp.statusText}`);

    const json = await postResp.json();
    const apk = json.data[0].apks[0];
    const versionCode = parseInt(apk.version_code, 10);
    if (previousVersion >= versionCode) {
        throw new Error("No new version available.");
    }
    fs.writeFileSync(versionFilePath, versionCode.toString(), "utf-8");

    const downloadPageResp = await fetch("https://www.apkmirror.com" + apk.link + "download/", {
        headers: {
            "User-Agent": USER_AGENT,
            "Authorization": AUTH_HEADER,
        },
    });
    if (!downloadPageResp.ok) throw new Error(`Download page fetch failed: ${downloadPageResp.statusText}`);

    const downloadPageHtml = await downloadPageResp.text();

    const dom = new JSDOM(downloadPageHtml);
    const downloadButton = dom.window.document.querySelector("a.downloadButton");
    if (!downloadButton) throw new Error("Download button not found");

    const newUrl = downloadButton.href;
    const idPageResp = await fetch("https://www.apkmirror.com" + newUrl, {
        headers: {
            "User-Agent": USER_AGENT,
            "Authorization": AUTH_HEADER,
        },
    });
    if (!idPageResp.ok) throw new Error(`ID page fetch failed: ${idPageResp.statusText}`);

    const idPageHtml = await idPageResp.text();
    const idDom = new JSDOM(idPageHtml);

    const downloadLinkElement = idDom.window.document.querySelector("#download-link");
    if (!downloadLinkElement) throw new Error("Download link element not found");

    const href = downloadLinkElement.href.replace("&amp;", "&");

    const apkResp = await fetch("https://www.apkmirror.com" + href, {
        headers: {
            "User-Agent": USER_AGENT,
            "Authorization": AUTH_HEADER,
        },
    });
    if (!apkResp.ok) throw new Error(`APK download failed: ${apkResp.statusText}`);

    const arrayBuffer = await apkResp.arrayBuffer();
    fs.writeFileSync("../bundle.apkm", Buffer.from(arrayBuffer));

    console.log("APK downloaded successfully.");
}

downloadAPK(previousVersion, versionFilePath).catch(console.error);
