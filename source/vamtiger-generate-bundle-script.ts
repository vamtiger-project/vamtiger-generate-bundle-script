import { resolve as resolvePath } from 'path';
import getFolderContent from 'vamtiger-get-directory-content';
import createFile from 'vamtiger-create-file';

interface IPackage {
    name: string;
    scripts: {
        'bundle-source-main': string;
        'bundle-source'?: string;
    }
}

const { stringify } = JSON;
const { cwd } = process;
const format = require('beautify');
const config = {
    format: 'json'
};
const packagePath = resolvePath(cwd(), 'package');
const packageJson = getPackageJson();
const { name = '', scripts = {'bundle-source-main': ''} } = packageJson || {};
const { 'bundle-source-main': mainBundleScript } = scripts;
const fileName = new RegExp(name);

if (!name) {
    console.warn(`Failed to reference package name`);
} else if (!scripts) {
    console.warn(`Failed to reference package scripts`);
} else if (!mainBundleScript) {
    console.warn(`Failed to reference package.scripts['bundle-source-main']`);
} else {
    generateBundleScript();
}

function getPackageJson() {
    try {
        return require(packagePath) as IPackage;
    } catch(error) {
        console.warn(`Failed to load packge.json: ${packagePath}`);
    }
}

async function generateBundleScript() {
    const folderContent = await getFolderContent(cwd());
    const scriptFiles = folderContent.filter(file => file.match(fileName));
    const generatedBundleScript = scriptFiles
        .map(fileName => `vamtiger-bundle-typescript --relativePath --entryFilePath source/${fileName} --bundleFilePath build/${fileName}.js --format iife --sourcemap true --copySourceMap --minify`)
        .join(' && ');
    const script = `${mainBundleScript} && ${generatedBundleScript}`;

    if (packageJson && script) {
        packageJson.scripts['bundle-source'] = script;

        await createFile(`${packagePath}.json`, format(stringify(packageJson), config));
    }
}