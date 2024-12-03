#!/bin/bash

# 安装依赖
cd /home/devbox/project/file-manage-sys-backend
npm install

# 启动后端服务
node app.js &

# 安装前端依赖并构建
cd /home/devbox/project
npm install
npm run build

# 使用 serve 启动前端构建结果
npm install -g serve
serve -s dist -l 8080