# Gunakan Node.js versi LTS
FROM node:22-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json & lock terlebih dahulu untuk cache layer
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn

# Copy semua source code
COPY . .

# Ekspos port 
EXPOSE 3000

# Jalankan server
CMD ["yarn", "dev"]
