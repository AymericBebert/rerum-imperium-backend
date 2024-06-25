FROM node:20.15.0-bookworm-slim AS builder

RUN mkdir /rerum-imperium
WORKDIR /rerum-imperium

COPY package.json package-lock.json tsconfig.json jest.config.js ./

RUN npm ci

COPY . .

RUN npm run build

#
# Go back from clean node image
#
FROM node:20.15.0-bookworm-slim

RUN mkdir /rerum-imperium /rerum-imperium/node_modules /rerum-imperium/dist
WORKDIR /rerum-imperium

COPY --from=builder ["/rerum-imperium/package.json", "/rerum-imperium/package-lock.json", "./"]
COPY --from=builder /rerum-imperium/node_modules ./node_modules/
COPY --from=builder /rerum-imperium/dist ./dist/

ARG APP_VERSION=untagged
RUN echo "APP_VERSION=$APP_VERSION" >/rerum-imperium/dist/.env

EXPOSE 4060

CMD ["npm", "run", "serve"]
