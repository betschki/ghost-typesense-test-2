# Ghost Typesense tools

Ghost Typesense tools offers tools to index and fragment Ghost posts to a Typesense index. It consists of two user facing tools:

- `typesense`, which is a CLI tool to batch index the full content of a Ghost install to a defined Typesense index
- `typesense-netlify`, which uses Netlify Functions to listen to Ghost webhooks and add, update, and remove posts to an Typesense index

> **Note:** This project is based on the work of the [Ghost Foundation's Algolia tools](https://github.com/TryGhost/algolia) and aims to provide a similar experience for [Typesense](https://typesense.org/), an open-source search engine alternative to Algolia.

## Usage

### Typesense Netlify package

You can start using the Typesense Netlify package by clicking on this deploy button. You can find the detailed install and user instructions over [here](https://github.com/magicpages/ghost-typesense/tree/master/packages/typesense-netlify).

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/magicpages/ghost-typesense)

### Ghost Typesense CLI

While the Typesense Netlify tool is useful to maintain your search index, the Ghost Typesense CLI is good for the initial indexing of the full post content of a site. See full install and user instructions in the package description [here](https://github.com/magicpages/ghost-typesense/tree/master/packages/typesense).

## Develop

This is a mono repository, managed with [lerna](https://lernajs.io/).

1. `git clone` this repo & `cd` into it as usual
2. `yarn setup` is mapped to `lerna bootstrap`
   - installs all external dependencies
   - links all internal dependencies

To add a new package to the repo:
   - install [slimer](https://github.com/TryGhost/slimer)
   - run `slimer new <package name>`


## Run

- `yarn dev`


## Test

- `yarn lint` run just eslint
- `yarn test` run lint and tests


## Publish

- `yarn ship` is an alias for `lerna publish`
    - Publishes all packages which have changed
    - Also updates any packages which depend on changed packages


# Copyright & License

Copyright (c) 2025 Magic Pages – Released under the MIT license, and based on the work of the Ghost Foundation (https://github.com/TryGhost/algolia)
