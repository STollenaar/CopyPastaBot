FROM node:12.9.0 as nodeb

# Create app directory
WORKDIR /usr/src/app

RUN mkdir -p /home/node/app/node_modules

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
FROM node:12.9.0-alpine

WORKDIR /usr/src/app
RUN apk update && apk add ffmpeg && apk add mysql-client

# Bundle app source
COPY --from=nodeb /usr/src/app/node_modules /usr/src/app/node_modules
COPY . .

CMD ./docker-entry.sh
