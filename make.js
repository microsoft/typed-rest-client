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
    var minimumNpmVersion = '3.10.10';
    var currentNpmVersion = ncp.execSync('npm -v', { encoding: 'utf-8' });
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

    cp(rp('LICENSE'), buildPath);
    cp(rp('package.json'), buildPath);
    cp(rp('package-lock.json'), buildPath);
    cp(rp('README.md'), buildPath);
    cp(rp('ThirdPartyNotice.txt'), buildPath);
}

target.units = function() {
    // install the just built lib into the test proj
    pushd('test')
    run('npm install ../_build');
    popd();

    console.log("-------Unit Tests-------");
    run('tsc -p ./test/units');
    run('mocha test/units');
}

target.test = function() {
    // install the just built lib into the test proj
    target.units();

    console.log("-------Integration Tests-------");
    run('tsc -p ./test/tests');
    // Increases timeout for each test, which fixes flaky errors in integration tests.
    run('mocha test/tests --timeout 60000');
}

//Deprecated since we automatically build in units before testing, keeping for back compat
target.buildtest = function() {
    target.test();
}

target.samples = function () {
    pushd('samples');
    run('npm install ../_build');
    run('tsc');
    run('node samples.js');
    run('npm install');
    run('npm run react');
    popd();
    console.log('done');
}

target.validate = function() {
    target.test();
    target.samples();
}