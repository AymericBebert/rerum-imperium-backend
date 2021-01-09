FROM node:14.15.3-stretch-slim AS builder

RUN mkdir /rerum-imperium
WORKDIR /rerum-imperium

COPY package.json package-lock.json tsconfig.json jest.config.js ./

RUN npm ci

COPY . .

ARG VERSION=untagged
ARG BUILD_CONFIGURATION=production
RUN echo "export const version = '$VERSION';\nexport const configuration = '$BUILD_CONFIGURATION';\n" > ./src/version.ts

RUN npm run build

#
# Go back from clean node image
#
FROM node:14.15.3-stretch-slim

RUN mkdir /rerum-imperium /rerum-imperium/node_modules /rerum-imperium/dist
WORKDIR /rerum-imperium

COPY --from=builder ["/rerum-imperium/package.json", "/rerum-imperium/package-lock.json", "./"]
COPY --from=builder /rerum-imperium/node_modules ./node_modules/
COPY --from=builder /rerum-imperium/dist ./dist/

EXPOSE 4060

CMD ["npm", "run", "serve"]
