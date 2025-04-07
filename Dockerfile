# Stage 1: Build React App with Vite
FROM node:18 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY ./package*.json ./

# Copy the entire project into the container
COPY . .

RUN mkdir -p /.local/

# Install dependencies
RUN npm install --force

# Step 6: Expose the port that your app will run on
EXPOSE 3000

# Step 7: Define the command to run your app
CMD ["npm", "start"]