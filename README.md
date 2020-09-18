# MatterJS-poc - a simple editor

[![Demo](https://img.shields.io/badge/demo-online-blue.svg)](https://matterjs-poc.surge.sh)

The goal of this project is to make a poc of a game where you would have:

- An editor mode to position bricks and balls
- A runtime mode to see them fall

The physics part is based on [matter-js](https://brm.io/matter-js/). The source code is written in TypeScript and transpiled with [snowpack](https://www.snowpack.dev), a new lightweight bundler for development (this poc was the occasion of testing it).

You can read the [snowpack generated README](README.snowpack.md).

## Install

```sh
yarn
```

You may also use `npm`

## Run

```sh
npm start
```

## Build

```sh
npm run build
```
