# Building the Code

## Pre-requisites

To build and test you need LTS Node >= 6.12.0 and Npm 5.5.1 (we use lock files).  You can download from [nodejs.org](https://nodejs.org).

For contributions, we recommend using Node 10.15.1 and Npm 6.9.0 in order to minimize friction between package-lock formatting.

## Build

```
$ npm install
$ npm run build
```

## Test

You should test with node 6.x, 8.x and 16.x LTS.  We recommend using nvm ([linux](https://github.com/creationix/nvm) / [windows](https://github.com/coreybutler/nvm-windows))

```
npm test
```

## Convenience

Build and test

```
npm run bt
```

Validate.  Run build, test and samples

```
npm run validate
```

## Run Samples

```
npm run samples
```

# Instructions for Logging Issues

## 1. Search for Duplicates

[Search the existing issues](https://github.com/Microsoft/typed-rest-client/issues) before logging a new one.

## 2. Did you find a bug?

When logging a bug, please be sure to include the following:
 * What version are you using?
 * If at all possible, an *isolated* way to reproduce the behavior
 * The behavior you expect to see, and the actual behavior
 * Ensure it doesn't reproduce on the latest version or master
 * An http trace from fiddler or charles if possible (the relevant parts)

## 5. Do you have a suggestion?

We also accept suggestions in the issue tracker.

In general, things we find useful when reviewing suggestions are:
* A description of the problem you're trying to solve
* An overview of the suggested solution
* Examples of how the suggestion would work in various places
  * Code examples showing e.g. "this would be an error, this wouldn't"
  * Code examples showing the generated JavaScript (if applicable)
* If relevant, precedent in other languages can be useful for establishing context and expected behavior

# Instructions for Contributing Code

## Contributing bug fixes

We are currently accepting contributions in the form of bug fixes. A bug must have an issue tracking it in the issue tracker. Your pull request should include a link to the bug that you are fixing. If you've submitted a PR for a bug, please post a comment in the bug to avoid duplication of effort.

## Contributing features

Features (things that add new or improved functionality) may be accepted, but will need to first be approved in the form of a suggestion issue.

Design changes will not be accepted at this time. If you have a design change proposal, please log a suggestion issue.

## Legal

You will need to complete a Contributor License Agreement (CLA). Briefly, this agreement testifies that you are granting us permission to use the submitted change according to the terms of the project's license, and that the work being submitted is under appropriate copyright.

Please submit a Contributor License Agreement (CLA) before submitting a pull request. You may visit https://cla.microsoft.com to sign digitally. 

## Housekeeping

Your pull request should: 

* Include a description of what your change intends to do
* Be a child commit of a reasonably recent commit in the **master** branch 
    * Requests need not be a single commit, but should be a linear sequence of commits (i.e. no merge commits in your PR)
* It is desirable, but not necessary, for the tests to pass at each commit
* Have clear commit messages 
    * e.g. "Refactor feature", "Fix issue", "Add tests for issue"
* Include samples if appropriate
* Include adequate tests 
    * At least one test should fail in the absence of your non-test code changes. If your PR does not match this criteria, please specify why
    * Tests should include reasonable permutations of the target fix/change
    * Include baseline changes with your change
    * All changed code must have 100% code coverage
