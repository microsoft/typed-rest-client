var fs = require('fs');
var ncp = require('child_process');
var path = require('path');
var process = require('process');
var shell = require('shelljs');
const { exception } = require('console');

/**
 * Function to run command line via child_process.execSync
 * @param {*} cl Command line to run
 * @param {*} inheritStreams - Inherit/pipe stdio streams
 * @param {*} noHeader - Don't print command line header
 * @returns 
 */
var run = function (cl, inheritStreams, noHeader) {
    if (!noHeader) {
        console.log();
        console.log('> ' + cl);
    }

    var options = {
        stdio: inheritStreams ? 'inherit' : 'pipe'
    };
    var rc = 0;
    var output;
    try {
        output = ncp.execSync(cl, options);
    }
    catch (err) {
        if (!inheritStreams) {
            console.error(err.output ? err.output.toString() : err.message);
        }

        throw new Error(`Command '${cl}' failed`)
    }

    return (output || '').toString().trim();
}
exports.run = run;

class CreateReleaseError extends Error {
  constructor(message) {
      super(message);
      this.name = 'CreateReleaseError';
      Error.captureStackTrace(this, CreateReleaseError)
  }
}

exports.CreateReleaseError = CreateReleaseError;
/**
* Function to form task changes from PRs
* @param {Array<object>} PRs - PRs to get the release notes for
* @returns {Object} - Object containing the task changes where key is a task and values - changes for the task
*/
function getChangesFromPRs(PRs) {
  const changes = [];
  PRs.forEach(PR => {

    const closedDate = PR.pull_request.merged_at;
      const date = new Date(closedDate).toISOString().split('T')[0];
      changes.push(` - ${PR.title} (#${PR.number}) (${date})`);
  });
  
  return changes;
}
exports.getChangesFromPRs = getChangesFromPRs;

/**
* Function to get current version of the package
* @param {String} package - Package name
* @returns {String} - version of the package
**/

function getCurrentPackageVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
      throw new CreateReleaseError(`package.json not found.`)
  }
  const packageJson = require(packagePath);
  return packageJson.version;
}
exports.getCurrentPackageVersion = getCurrentPackageVersion;