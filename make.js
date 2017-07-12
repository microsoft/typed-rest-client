require('shelljs/make');
var path = require('path');
var fs = require('fs');

var rp = function (relPath) {
    return path.join(__dirname, relPath);
}

var buildPath = path.join(__dirname, '_build');
var testPath = path.join(__dirname, '_test');

var run = function (cl) {
    console.log('> ' + cl);
    var rc = exec(cl).code;
    if (rc !== 0) {
        echo('Exec failed with rc ' + rc);
        exit(rc);
    }
}

target.clean = function () {
    rm('-Rf', buildPath);
    rm('-Rf', testPath);
};

target.build = function () {
    target.clean();

    run(path.join(__dirname, 'node_modules/.bin/tsc') + ' --outDir ' + buildPath);
    // cp(rp('dependencies/typings.json'), buildPath);
    cp('-Rf', rp('lib/opensource'), buildPath);
    cp(rp('package.json'), buildPath);
    cp(rp('README.md'), buildPath);
    cp(rp('LICENSE'), buildPath);
    // just a bootstrap file to avoid /// in final js and .d.ts file
    // rm(path.join(buildPath, 'index.*'));
}

// test is just building samples
target.test = function () {
    target.build();

    var modPath = path.join(__dirname, 'samples', 'node_modules');
    rm('-Rf', modPath);
    mkdir('-p', modPath);
    pushd('samples');
    run('npm install ../_build --production');
    popd();
    run(path.join(__dirname, 'node_modules/.bin/tsc') + ' -p ' + 'samples');
}

target.samples = function () {
    target.test();

    pushd('samples');
    run('node samples.js');
    popd();
    console.log('done');
}