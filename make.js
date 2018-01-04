require('shelljs/make');
var path = require('path');
var fs = require('fs');
var semver = require('semver');
var ncp = require('child_process');

var rp = function (relPath) {
    return path.join(__dirname, relPath);
}

var fail = function (message) {
    console.error('ERROR: ' + message);
    process.exit(1);
}

var runCommand = function (command) {
    return ncp.execSync(command, { encoding: 'utf-8' });
}

var buildPath = path.join(__dirname, '_build');
var testPath = path.join(__dirname, 'test');

var enforceMinimumVersions = function () {
    // enforce minimum Node version
    var minimumNodeVersion = '4.8.6';
    var currentNodeVersion = process.versions.node;
    if (semver.lt(currentNodeVersion, minimumNodeVersion)) {
        fail('requires node >= ' + minimumNodeVersion + '.  installed: ' + currentNodeVersion);
    }

    // enforce minimum npm version
    // NOTE: We are enforcing this version of npm because we use package-lock.json
    var minimumNpmVersion = '5.5.1';
    var currentNpmVersion = runCommand('npm -v');
    if (semver.lt(currentNpmVersion, minimumNpmVersion)) {
        fail('requires npm >= ' + minimumNpmVersion + '.  installed: ' + currentNpmVersion);
    }
}

var run = function (cl) {
    try {
        console.log('> ' + cl);
        var rc = exec(cl).code;
        if (rc !== 0) {
            echo('Exec failed with rc ' + rc);
            exit(rc);
        }
    }
    catch (err) {
        echo(err.message);
        exit(1);
    }
}

target.clean = function () {
    rm('-Rf', buildPath);
};

target.build = function () {
    enforceMinimumVersions();
    run(path.join(__dirname, 'node_modules/.bin/tsc') + ' --outDir ' + buildPath);
    cp('-Rf', rp('lib/opensource'), buildPath);
    cp(rp('package.json'), buildPath);
    cp(rp('README.md'), buildPath);
    cp(rp('LICENSE'), buildPath);
}

target.test = function() {
    // install the just built lib into the test proj
    pushd('test')
    run('npm install ../_build');
    popd();

    run('tsc -p ./test');
    run('mocha test');
}

// TODO: Add notes to documentation that this needs to run as admin. And how to use it.
target.testall = function() {
    // make sure we have nvm
    var nvmList = runCommand('nvm');
    if (nvmList.indexOf('Running version') === -1) {
        // nvm isn't installed
        fail('requires nvm to be installed');
    }
    
    // ensure all versions of node are installed
    var versionsToTest = ['8.9.1', '6.12.0', '4.8.6'];

    // store the current version of node so we can switch back to it later
    var nodeVersionAtStart;

    
    var versionList = runCommand('nvm list');
    var versionListArray = versionList.split('\n');
    var sanitizedList = [];

    // sanitize values
    versionListArray.forEach(function (version) {
        var cleaned = version.trim();

        // 6.12.0 (Currently using 64-bit executable)
        var openIndex = cleaned.indexOf('(');
        if (openIndex !== -1) {
            cleaned = cleaned.substring(0, openIndex - 1);
        }

        // * 6.12.0
        var starIndex = cleaned.indexOf('*');
        if (starIndex !== -1) {
            cleaned = cleaned.substring(2);
            nodeVersionAtStart = cleaned;
        }

        if (cleaned) {
            sanitizedList.push(cleaned);
        }
    });

    // console.log('LENGTH ' + sanitizedList.length);
    // for (i = 0; i < sanitizedList.length; i++) {
    //     console.log('|' + sanitizedList[i] + '|');
    // }

    // test all versions of node are installed
    // TODO: O(n^2), fix it?
    for (i = 0; i < versionsToTest.length; i++) {
        var versionIsInstalled = false;
        for (j = 0; j < sanitizedList.length; j++) {
            if (versionsToTest[i] === sanitizedList[j]) {
                versionIsInstalled = true;
                break;
            }
        }

        if (!versionIsInstalled) {
            fail('node version ' + versionsToTest[i] + ' is not installed, please install and run again');
        }
    }

    // test each version
    sanitizedList.forEach(function(nodeVersion) {
        // switch to the version we want to test
        console.log('running tests with node version ' + nodeVersion);

        // TODO: BUG.... we need to set this in the same place we run the tests... not a new child process each time.
        //runCommand('nvm use ' + nodeVersion);
        run('nvm use ' + nodeVersion);

        // run the test, TODO: this isnt running the tests...
        //target.test();
        //run('tsc -p ./test');
        run('mocha test');
    });

    // switch back to version being used before we ran
    if (nodeVersionAtStart) {
        runCommand('nvm use ' + nodeVersionAtStart);
    }

    console.log('Test all versions complete.');
}

target.buildtest = function() {
    target.build();
    target.test();
}

target.samples = function () {
    pushd('samples');
    run('npm install ../_build');
    run('tsc');
    run('node samples.js');
    popd();
    console.log('done');
}

target.validate = function() {
    target.build();
    target.test();
    target.samples();
}