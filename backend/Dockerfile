FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Create SSL directory
RUN mkdir -p /app/ssl

COPY . .
RUN npm run build

# Add environment variable for HTTPS
ENV NODE_ENV=production
ENV HTTPS=true

EXPOSE 5000

CMD ["node", "dist/dev-server.js"] 