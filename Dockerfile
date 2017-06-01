# Node only packaging for the application
#   Requires a MongoDB connection string.
#   Scale node app horizontally as needed and setup a front-load balancer
#
# Choices:
# 1. Pass it using the DB_URI environmental variable. (uncomment line 20 and set the connection string)
#
# 2. Use Docker linking with alias = DB to link to a MongoDB Docker Container
#    Sample: docker run <image> --link <dbContainer>:DB

FROM google/nodejs
MAINTAINER pjmolina 

ENV NODE_ENV=production

WORKDIR /app
RUN npm install -g grunt-cli 
ADD package.json /app/
RUN npm install
ADD . /app
RUN grunt release

ENV PORT=80
#ENV DB_URI=mongodb://<host>:<port>/<dbName>

EXPOSE 80

CMD []
ENTRYPOINT ["/nodejs/bin/node", "/app/app/server.js"]