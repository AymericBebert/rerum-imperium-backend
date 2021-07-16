FROM node:14.17.3-buster-slim AS builder

RUN mkdir /rerum-imperium
WORKDIR /rerum-imperium

COPY package.json package-lock.json tsconfig.json jest.config.js ./

RUN npm ci

COPY . .

RUN npm run build

#
# Go back from clean node image
#
FROM node:14.17.3-buster-slim

RUN mkdir /rerum-imperium /rerum-imperium/node_modules /rerum-imperium/dist
WORKDIR /rerum-imperium

COPY --from=builder ["/rerum-imperium/package.json", "/rerum-imperium/package-lock.json", "./"]
COPY --from=builder /rerum-imperium/node_modules ./node_modules/
COPY --from=builder /rerum-imperium/dist ./dist/

ARG VERSION=untagged
RUN echo "VERSION=$VERSION" >/rerum-imperium/dist/.env

EXPOSE 4060

CMD ["npm", "run", "serve"]
