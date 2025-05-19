# Clash Converter

[![Go Version](https://img.shields.io/badge/Go-1.24+-blue.svg)](https://golang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Build](https://github.com/cnm-microsoft/clash-converter/actions/workflows/docker-build.yml/badge.svg)](https://github.com/cnm-microsoft/clash-converter/actions/workflows/docker-build.yml)

Clash Converter 是一个灵活的 Clash 订阅转换工具，允许用户通过自定义 JavaScript 脚本和 YAML 模板来处理和转换 Clash 配置文件。

## 目录
- [✨ 功能特性](#功能特性)
- [📂 项目结构](#项目结构)
- [🚀 开始使用](#开始使用)
- [🛠️ 环境变量](#环境变量)
- [⚙️ API 使用](#api-使用)
- [🔧 自定义脚本 (`script.js`)](#自定义脚本-scriptjs)
- [📄 自定义模板 (`template.yaml`)](#自定义模板-templateyaml)
- [🔄 GitHub Actions](#github-actions)
- [🤝 贡献](#贡献)
- [📜 许可证](#许可证)

## ✨ 功能特性

*   **订阅转换**：获取远程 Clash 订阅链接并进行处理。
*   **自定义脚本**：通过 JavaScript 脚本对订阅内容进行高级定制（如节点筛选、重命名、添加代理组等）。
*   **自定义模板**：使用 YAML 模板定义最终输出的 Clash 配置结构。
*   **规则集处理**：自动下载并合并远程 Clash 规则集。
*   **缓存机制**：对获取的远程资源（订阅、脚本、模板、规则集）进行缓存，减少重复请求。
*   **Docker 支持**：提供 Dockerfile，方便快速部署。
*   **Web 界面**：提供一个简单的前端页面进行转换操作。
*   **GitHub Actions**: 自动构建和发布 Docker 镜像到 GHCR。

## 📂 项目结构

```
clash-converter/
├── .github/
│   └── workflows/
│       └── docker-build.yml  # GitHub Actions: Docker 镜像构建与发布
├── .gitignore
├── Dockerfile                # Docker 配置文件
├── LICENSE                   # 项目许可证
├── README.md                 # 项目说明文档
├── dao.go                    # 数据访问对象 (数据库交互、缓存逻辑)
├── example/                  # 示例文件
│   ├── script.js             # 示例 JavaScript 处理脚本
│   └── template.yaml         # 示例 Clash 配置模板
├── go.mod                    # Go 模块依赖
├── go.sum
├── js_runner.go              # JavaScript 执行器
├── logger.go                 # 日志记录器
├── main.go                   # 程序主入口，HTTP 服务设置
├── static/                   # Web 前端静态资源
│   ├── css/
│   │   └── style.css
│   ├── index.html            # 前端主页面
│   └── js/
│       └── main.js
├── utils.go                  # 工具函数 (环境变量、HTTP 请求等)
└── yaml.go                   # YAML 处理逻辑 (解析、构建)
```

## 🚀 开始使用

### 依赖环境

*   Go 1.24+ (用于本地构建)
*   Docker (用于容器化部署)

### 1. 从源码构建和运行

```bash
# 克隆仓库
git clone https://github.com/cnm-microsoft/clash-converter.git
cd clash-converter

# 设置必要的环境变量 (可选, 如果不设置则使用默认值)
# export ACCESS_TOKEN="your_secure_token" # 访问令牌
# export CACHE_EXPIRE_SEC="86400"        # 缓存过期时间 (秒), 默认 24 小时
# export DB_PATH="./data/database.db"    # 数据库文件路径

# 构建
go build

# 运行
./clash-converter
```
服务将在 `http://localhost:8080` 启动。

### 2. 使用 Docker 运行

项目提供了 Dockerfile 用于构建镜像。您也可以直接使用预构建的镜像 (如果已发布到 GHCR)。

**构建 Docker 镜像:**
```bash
docker build -t clash-converter .
```

**运行 Docker 容器:**
```bash
docker run -d -p 8080:8080 \
  -e ACCESS_TOKEN="your_secure_token" \
  -e CACHE_EXPIRE_SEC="86400" \
  -e DB_PATH="/app/data/database.db" \
  -v $(pwd)/data:/app/data \
  clash-converter
```
*   `-d`: 后台运行
*   `-p 8080:8080`: 将容器的 8080 端口映射到主机的 8080 端口
*   `-e ACCESS_TOKEN`: 设置访问令牌 (必需)
*   `-e CACHE_EXPIRE_SEC`: (可选) 设置缓存过期时间
*   `-e DB_PATH`: (可选) 设置数据库文件在容器内的路径
*   `-v $(pwd)/data:/app/data`: (推荐) 将主机当前目录下的 `data` 文件夹挂载到容器的 `/app/data` 目录，用于持久化数据库和缓存。

### 3. 环境变量

*   `ACCESS_TOKEN`: (必需) API 访问令牌，用于验证请求。
*   `CACHE_EXPIRE_SEC`: (可选) 远程资源缓存的过期时间（秒）。默认值为 `86400` (24 小时)。
*   `DB_PATH`: (可选) SQLite 数据库文件的路径。默认值为 `./data/database.db` (相对于程序运行目录)。在 Docker 中，推荐使用 `/app/data/database.db` 并进行卷挂载。
*   `GIN_MODE`: (可选) Gin 框架的运行模式，例如 `release` 或 `debug`。Dockerfile 中默认为 `release`。

## ⚙️ API 使用

### 前端界面

访问 `http://localhost:8080/` 可以使用图形化界面进行转换。

### API 端点

**GET `/sub`**

通过此端点获取转换后的 Clash 配置。

**查询参数:**

*   `sub` (必需): 原始 Clash 订阅链接。
*   `script` (必需): 自定义 JavaScript 脚本的 URL。可以使用 `http://localhost:8080/example/script.js` 作为示例。
*   `template` (必需): 自定义 Clash 配置模板的 URL。可以使用 `http://localhost:8080/example/template.yaml` 作为示例。
*   `token` (必需): `ACCESS_TOKEN` 环境变量中设置的访问令牌。

**示例请求:**

```
http://localhost:8080/sub?sub=<URL_ENCODED_SUB_LINK>&script=http://localhost:8080/example/script.js&template=http://localhost:8080/example/template.yaml&token=your_secure_token
```

**响应:**

*   成功: 返回转换后的 Clash 配置文件内容 (YAML 格式)，HTTP 状态码 `200 OK`。
*   失败: 返回错误信息，HTTP 状态码 `400 Bad Request`, `401 Unauthorized`, 或 `500 Internal Server Error`。

### 示例文件

项目 `example/` 目录下提供了：
*   `script.js`: 一个 JavaScript 脚本示例，展示了如何修改代理节点、添加代理组、定义规则集等。
*   `template.yaml`: 一个 Clash 配置模板示例，定义了配置文件的基本结构。

您可以参考这些示例文件创建自己的脚本和模板。

## 🔧 自定义脚本 (`script.js`)

JavaScript 脚本用于对从原始订阅中提取的代理节点进行处理，并可以定义规则集。脚本中需要实现以下函数：

*   `rulesets(callback)`: (可选) 此函数用于定义需要下载的规则集。
    *   `callback(tag, url)`: 对于每个规则集，调用此回调函数，传入规则集的标签 (用于在 Clash 规则中引用) 和规则集文件的 URL。
*   `buildConfig(config)`: (必需) 此函数接收一个由模板和原始订阅节点构建的基础配置对象，并允许您对其进行修改。
    *   `config`: 一个 JavaScript 对象，包含了从 `template.yaml` 解析的内容以及从 `sub` 参数获取的 `proxies` 列表。您可以在此函数中修改 `config.proxies`, `config.rules`, `config['proxy-groups']` 等。
    *   函数应直接修改传入的 `config` 对象，或返回修改后的对象。

**示例 `script.js` 关键部分:**
```javascript
// example/script.js

// 定义规则集
function rulesets(r) {
    r("DIRECT", "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/LocalAreaNetwork.list");
    // ...更多规则集
}

// 修改配置
function buildConfig(config) {
    // 例如: 筛选特定名称的代理
    config.proxies = config.proxies.filter(p => !/过期|剩余流量/.test(p.name));

    // 例如: 添加自定义代理组
    config['proxy-groups'] = [
        {
            name: 'MyCustomGroup',
            type: 'select',
            proxies: ['ProxyA', 'ProxyB', ...config.proxies.map(p => p.name)]
        },
        ...(config['proxy-groups'] || []) // 保留模板中可能存在的代理组
    ];

    // 例如: 添加自定义规则
    config.rules = [
        'DOMAIN-SUFFIX,google.com,MyCustomGroup',
        ...(config.rules || []) // 保留模板和规则集中的规则
    ];

    return config; // 或者直接修改 config 对象
}
```

## 📄 自定义模板 (`template.yaml`)

模板文件 (`template.yaml`) 是一个标准的 Clash 配置文件片段。转换器会将此模板作为基础，然后将处理过的代理节点和规则合并进去。

**示例 `template.yaml` 关键部分:**
```yaml
# example/template.yaml
port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info
external-controller: '0.0.0.0:9090'
# ... 其他 Clash 配置项

# proxies: 将由脚本和订阅填充
# proxy-groups: 可以预定义，脚本也可以修改或添加
# rules: 将由脚本中的 rulesets 和自定义规则填充
```

## 🔄 GitHub Actions

本项目使用 GitHub Actions 自动构建 Docker 镜像并将其发布到 GitHub Container Registry (GHCR)。
工作流程定义在 `.github/workflows/docker-build.yml`。

当代码推送到 `main` 或 `master` 分支，或者创建了 `v*` 格式的标签时，会自动触发构建和发布。

## 🤝 贡献

欢迎提交 Pull Requests 或 Issues。

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源。

        
