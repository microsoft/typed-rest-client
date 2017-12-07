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

// enforce minimum Node version
var minimumNodeVersion = '4.8.6';
var currentNodeVersion = process.versions.node;
if (semver.lt(currentNodeVersion, minimumNodeVersion)) {
    fail('requires node >= ' + minimumNodeVersion + '.  installed: ' + currentNodeVersion);
}

// enforce minimum npm version
// NOTE: We are enforcing this version of npm because we use package-lock.json
var minimumNpmVersion = '5.5.1';
var currentNpmVersion = ncp.execSync('npm -v', { encoding: 'utf-8' });
if (semver.lt(currentNpmVersion, minimumNpmVersion)) {
    fail('requires npm >= ' + minimumNpmVersion + '.  installed: ' + currentNpmVersion);
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