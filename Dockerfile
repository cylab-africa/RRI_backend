FROM node:16

# Create app directory
WORKDIR /usr/src/app

# COPY package.json ./
COPY package*.json ./

COPY ./src/db/configs/prisma ./src/prisma

RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

COPY . .


EXPOSE 8081

CMD [ "npm", "run" ]
# CMD ["node", "index.js"]