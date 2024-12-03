#!/bin/bash

# 输出调试信息
echo "Script started at $(date)"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"

# 设置错误处理
set -e
trap 'echo "Error on line $LINENO"' ERR

# 后端服务
cd /home/devbox/project/file-manage-sys-backend || exit 1
echo "Installing backend dependencies..."
npm install
echo "Starting backend service..."
node app.js &

# 等待后端服务启动
sleep 5

# 前端服务
cd /home/devbox/project || exit 1
echo "Installing frontend dependencies..."
npm install --include=dev
echo "Installing serve package..."
npm install serve --save-dev
echo "Building frontend..."
./node_modules/.bin/vue-cli-service build
echo "Starting frontend service..."
# 确保监听所有网络接口并添加健康检查
./node_modules/.bin/serve -s dist --listen 8080 --no-clipboard --cors &

# 等待前端服务启动
sleep 5

# 检查服务是否正常运行
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "Frontend service is not running properly"
    exit 1
fi

echo "All services started successfully"

# 保持容器运行并输出日志
exec tail -f /dev/null