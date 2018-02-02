#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const parseArgs = require('minimist');

// helpers to get parameters:
const commandArgs = parseArgs(process.argv, { '--': true });
const isVerbose = () => (commandArgs.v || commandArgs.verbose);
const dry = commandArgs['dry-run'] || commandArgs.dryRun;
const isDryRun = () => (!!dry && ([true, 'true', 'yes', '1'].indexOf(dry) !== 1) && ([false, 'false', 'no', '0'].indexOf(dry) === -1));
const getDays = () => (commandArgs.d || commandArgs.days);
const getMaxDepth = () => (commandArgs['max-depth'] || commandArgs.maxDepth || 1);
const getPath = () => (commandArgs.path || commandArgs._[2]);

const usage = () => {
  console.log('USAGE: autoclean --days=30 --dry-run=1 /tmp/mypath');
  process.exit(0);
};

if (!getPath() || !getDays()) { usage(); }
if (isVerbose()) {
  console.log('PATH: ', getPath());
  console.log('DAYS: ', getDays());
  console.log('MAX DEPTH: ', getMaxDepth());
  console.log('DRY RUN: ', isDryRun());
}

const filelist = [];
const dirlist = [];
const maxTime = new Date().getTime() - 3600000*24*getDays();

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = dir + path.sep + file;
    const stat = fs.statSync(filePath);
    if (stat.mtime < maxTime) {
      if (stat.isDirectory()) {
        walkSync(filePath);
        dirlist.push(filePath);
      } else {
        filelist.push(filePath);
      }
    } else if (stat.isDirectory()) {
      walkSync(filePath);
    }
  });
};

walkSync(getPath());

filelist.forEach(file => {
  console.log('FILE MATCH: ', file, ' ', new Date(fs.statSync(file).mtime));
  if (!isDryRun()) { fs.removeSync(file); } 
});
dirlist.forEach(dir => {
  console.log('DIR MATCH: ', dir, ' ', new Date(fs.statSync(dir).mtime));
  if (!isDryRun()) { fs.removeSync(dir); } 
});

