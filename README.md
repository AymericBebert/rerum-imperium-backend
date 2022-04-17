# Rerum Imperium Backend

Backend for Rerum Imperium project

## Installation

`cp .env.dist .env`

## Run the server

`npm run start`

## Run tests

`npm run test`

## Run lint

`npm run lint`

With auto fix
`npm run lint:fix`

## Build new version

We use GitHub Actions on tags to build the docker image

```shell
git tag 1.0.0
git push origin 1.0.0
```
