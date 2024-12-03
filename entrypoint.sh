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

# 清理 node_modules（如果存在）
rm -rf node_modules
rm -rf package-lock.json

# 全局安装必要的 CLI 工具
npm install -g @vue/cli@5.0.8

# 安装项目依赖
echo "Installing project dependencies..."
npm install

echo "Building frontend..."
# 使用全局安装的 vue-cli-service
vue-cli-service build

echo "Starting frontend service..."
# 使用 node 的 http-server（更轻量级）
npm install -g http-server
http-server dist -p 8080 --cors -a 0.0.0.0

# 不需要后台运行和健康检查，因为 serve 本身会保持进程运行