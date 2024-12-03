#!/bin/bash

echo "Starting deployment..."

# 后端服务
cd /home/devbox/project/file-manage-sys-backend
echo "Installing backend dependencies..."
npm install
echo "Starting backend service..."
node app.js &

# 前端服务
cd /home/devbox/project
echo "Installing frontend dependencies..."
npm install --include=dev
echo "Installing serve package..."
npm install serve --save-dev
echo "Building frontend..."
./node_modules/.bin/vue-cli-service build
echo "Starting frontend service..."
# 确保监听所有网络接口
./node_modules/.bin/serve -s dist -l tcp://0.0.0.0:8080

# 保持容器运行
tail -f /dev/null