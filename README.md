<img src="packages/selenium-ide/src/icons/icon128.png" alt="logo" height="128" align="right" />
+
<img src="packages/selenium-ide/src/icons/percy_icon_128.png" alt="logo" height="128" align="right" />

# Percy-Selenium IDE

_[WIP] An integrated development environment for Percy_

## Introduction

This project is  work in progress, towards a integration between Percy and Selenium IDE.

Note: This is not an official integration from either Percy or Selenium IDE. It is a personal project I am working on.


## Installation

### Pre-packaged
 To be added

## Prerequisites

- `git` has to be in `$PATH` for the installation to pass

- [yarn](https://yarnpkg.com/en/docs/install) `npm` might work as well (untested)

- [peru](https://github.com/buildinspace/peru#installation)

## Building

`peru` requires a POSIX machine to work, for the time being you can only properly build the extension on macOS and Linux.

- Install the dependencies
`peru sync`  
`yarn` or if using Node 10 `yarn --ignore-engines`
- Build the extension  
`yarn build` and then
`yarn watch` for faster incremental builds
`yarn build:ext:prod` to build only the extension or `yarn build:ext` for faster development build (also includes beta features)
- Install as developer on [Google Chrome](https://developer.chrome.com/extensions/getstarted#unpacked) or [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox)  

Manifest located in `<Project Directory>/packages/selenium-ide/build/manifest.json`
