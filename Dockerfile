FROM --platform=linux/aarch64 node:18
RUN npm install pm2 -g
# Working Dir
RUN mkdir -p /[project_name]
WORKDIR /[project_name]
# Copy Package Json Files
COPY package*.json /[project_name]/
# Copy .env File
# COPY .env /[project_name]/
# Install Files
RUN npm ci
# Copy Source Files
COPY . /[project_name]/
# Build
RUN npm run build
CMD [ "npm", "run", "serve:prod" ]