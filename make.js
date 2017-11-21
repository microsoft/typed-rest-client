require('shelljs/make');
var path = require('path');
var fs = require('fs');

var rp = function (relPath) {
    return path.join(__dirname, relPath);
}

var buildPath = path.join(__dirname, '_build');
var testPath = path.join(__dirname, 'test');

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
};

target.build = function () {
    target.clean();

    run(path.join(__dirname, 'node_modules/.bin/tsc') + ' --outDir ' + buildPath);
    cp('-Rf', rp('lib/opensource'), buildPath);
    cp(rp('package.json'), buildPath);
    cp(rp('README.md'), buildPath);
    cp(rp('LICENSE'), buildPath);
}

target.test = function() {
    target.build();

    // install the just built lib into the test proj
    pushd('test')
    run('npm install ../_build');
    popd();

    run('tsc -p ./test');
    run('mocha test');
}

target.samples = function () {
    target.build();

    pushd('samples');
    run('node samples.js');
    popd();
    console.log('done');
}