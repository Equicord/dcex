import fs from "fs";
import path from "path";
import unzipper from "unzipper";
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
    const splitApkDir = path.join(baseDir, 'splits');

    if (fs.existsSync(splitApkDir)) {
        fs.rmSync(splitApkDir, { recursive: true, force: true });
    }
    fs.mkdirSync(splitApkDir, { recursive: true });

    await new Promise((resolve, reject) => {
        fs.createReadStream(bundleFile)
            .pipe(unzipper.Parse())
            .on('entry', function (entry) {
                const fileName = entry.path;
                if (fileName.endsWith('.apk')) {
                    const outputPath = path.join(splitApkDir, fileName);
                    entry.pipe(fs.createWriteStream(outputPath));
                } else {
                    entry.autodrain();
                }
            })
            .on('close', resolve)
            .on('error', reject);
    });

    const mergedPath = path.join(baseDir, 'merged.apk');
    const modPath = path.join(utilsDir, 'app-debug.apk');
    const jksPath = path.join(utilsDir, 'github.jks');
    const outPath = path.join(baseDir, 'patchapk');

    try {
        execSync(`java -jar utils/apkedit.jar m -i "${splitApkDir}" -o "${mergedPath}"`, { stdio: 'inherit' });
        execSync(`java -jar utils/lspatch.jar "${mergedPath}" --force -m "${modPath}" -o "${outPath}" -k "${jksPath}" "${key}" discordex "${key}"`, { stdio: 'inherit' });
        console.log('Patch completed successfully.');
    } catch (err) {
        console.error('Error during merge or patch:', err.message);
    }
}
