# Use official Node.js runtime
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 8080

# Start command (with instrumentation)
CMD [ "node", "--require", "./instrumentation.js", "app.js" ]
