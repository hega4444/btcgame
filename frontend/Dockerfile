FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ENV VITE_BET_TIMER_SECONDS=60
ENV VITE_API_URL=https://btc.hega4444.com/api
ENV VITE_USE_MOCK_DATA=false
ENV VITE_FORGET_USER=false
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 