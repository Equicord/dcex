import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default async function patchVersion(key) {
    const baseDir = process.cwd();
    const utilsDir = path.join(baseDir, "utils/")
    const versionFile = path.join(baseDir, 'version.txt');

    let previousVersion = 0;
    if (fs.existsSync(versionFile)) {
        previousVersion = parseInt(fs.readFileSync(versionFile, 'utf-8').trim(), 10);
    }

    const bundleFile = path.join(baseDir, 'bundle.apkm');
    const mergedPath = path.join(baseDir, 'merged.apk');
    const modPath = path.join(utilsDir, 'app-debug.apk');
    const jksPath = path.join(utilsDir, 'github.jks');
    const outPath = path.join(baseDir, 'patchapk');

    try {
        execSync(`java -jar utils/apkedit.jar m -i "${bundleFile}" -o "${mergedPath}"`, { stdio: 'inherit' });
        execSync(`java -jar utils/lspatch.jar "${mergedPath}" --force -m "${modPath}" -o "${outPath}" -k "${jksPath}" "${key}" discordex "${key}"`, { stdio: 'inherit' });
        console.log('Patch completed successfully.');
    } catch (err) {
        console.error('Error during merge or patch:', err.message);
    }
}
