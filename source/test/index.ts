import { resolve as resolvePath } from 'path';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import bash from 'vamtiger-bash';

const { cwd } = process;
const generateBundleScriptPath = resolvePath(
    __dirname,
    '../vamtiger-generate-bundle-script'
);
const generateBundleScript = `node ${generateBundleScriptPath}`;

describe('vamtiger-generate-bundle-script', function () {
    before(async function () {
        await bash(generateBundleScript, {cwd: __dirname});
    });

    it('generate bundle script', async function () {
        const updatedPackageJson = require('./package.json');

        expect(updatedPackageJson.scripts['bundle-source-main']).to.be.ok;
    });
});