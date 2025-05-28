
import fs from "fs";
import path from "path";

import downloadVersion from "./utils/downloadVersion.js";
import patchVersion from "./utils/patchVersion.js";

const key = process.env.key;
const versionFilePath = path.resolve("./version.txt");
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

downloadVersion(previousVersion, versionFilePath)
    .then(() => patchVersion(key))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

