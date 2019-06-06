FROM node:10

# Create app directory
WORKDIR /usr/src/app


RUN apt-get update && \
 apt-get install -y build-essential && \
 mkdir -p /home/node/app/node_modules

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD ./docker-entry.sh
