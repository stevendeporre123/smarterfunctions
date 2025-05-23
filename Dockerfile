# Use Node.js base image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
