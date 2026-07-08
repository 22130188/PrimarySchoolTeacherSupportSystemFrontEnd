# Stage 1: Build React App
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (use npm install if package-lock is not synced perfectly, but npm ci is faster if it is)
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Serve the production build with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
