import { resolve as resolvePath } from 'path';
import getFolderContent from 'vamtiger-get-directory-content';
import createFile from 'vamtiger-create-file';
import Args from 'vamtiger-argv/build/main';
const format = require('beautify');

interface IPackage {
    name: string;
    scripts: {
        'bundle-source-main': string;
        'bundle-source'?: string;
    }
}

type scriptName = keyof IPackage['scripts']

const { stringify } = JSON;
const { cwd } = process;
const args = new Args();
const config = {
    format: 'json'
};
const packagePath = resolvePath(
    cwd(),
    'package'
);
const packageJson = getPackageJson();
const sourceFolder = args.has('sourceFolder') && args.get('sourceFolder')
    || args.has('s') && args.get('s')
    || 'source';
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
    const folderContent = await getFolderContent(sourceFolder);
    const scriptFiles = folderContent.filter(file => file.match(fileName));
    const generatedBundleScript = scriptFiles
        .map(fileName => `vamtiger-bundle-typescript --relativePath --entryFilePath source/${fileName} --bundleFilePath build/${fileName.split('.')[0]}.js --format iife --sourcemap true --copySourceMap --minify`)
        .join(' && ');
    const script = `${mainBundleScript} && ${generatedBundleScript}`;
    const newScripts = {} as IPackage['scripts'];

    let scriptNames: scriptName[];

    if (packageJson && script) {
        packageJson.scripts['bundle-source'] = script;

        scriptNames = Object
            .keys(packageJson.scripts)
            .sort() as scriptName[];

        scriptNames.forEach(scriptName => {
            if (packageJson.scripts[scriptName]) {
                newScripts[scriptName] = packageJson.scripts[scriptName] as string;
            }
        });

        packageJson.scripts = newScripts;

        await createFile(`${packagePath}.json`, format(stringify(packageJson), config));
    }
}
