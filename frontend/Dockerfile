FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install
COPY . /app
RUN npm run build

FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install
COPY . /app
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
