# 在 n8n 中使用 Nstdata Crawl

[English](README.md)

把表格、Webhook 或上游节点中的网页地址交给 **Nstdata Crawl**，就能在工作流中得到 Markdown 正文、HTML 或链接列表。每条输入记录对应一个抓取任务。你可以在同一个节点等待正文，也可以先拿到任务 ID，稍后再查询。

## 下载 0.1.1

[下载仓库 ZIP](https://github.com/nstdata-ai/n8n-nodes-nstdata/archive/refs/heads/main.zip)，解压后在包含这个 README 的目录打开终端。ZIP 里有源码、安装脚本，以及已经编译好的 [0.1.1 安装包](https://github.com/nstdata-ai/n8n-nodes-nstdata/raw/refs/heads/main/downloads/n8n-nodes-nstdata-0.1.1.tgz)，可以直接安装。下文命令适用于 macOS、Linux 或 Windows 的 WSL 环境。

本指南适用于已启用社区节点的**自托管 n8n**，需要能操作部署 n8n 的电脑或容器。已在 **n8n 2.47.4** 上验证。

## 方式一 · Docker 或 Docker Compose

1. 运行 `docker ps`，找到运行 n8n 主程序的容器名。下例使用 `n8n-local`。官方镜像的数据目录为 `/home/node/.n8n`；将它挂载到持久卷或宿主机目录后，重建容器也能保留节点。
2. 在刚解压的仓库目录运行下列命令。请把第一行改成你的容器名，并等当前工作流执行完毕后再重启。

```sh
container=n8n-local
archive=n8n-nodes-nstdata-0.1.1.tgz
docker cp "downloads/$archive" "$container:/tmp/$archive"
docker exec -i -u node "$container" sh -s -- "/tmp/$archive" /home/node/.n8n < scripts/install-local.sh
docker restart "$container"
```

3. 重新打开 n8n 编辑器，点击 **Add node（添加节点）**，搜索 **Nstdata Crawl**。如果另外部署了执行工作流的 worker，请在各个执行进程使用相同版本的节点，并重启对应进程。

## 方式二 · 直接在电脑上运行 n8n

如果是用 Node.js 在本机启动 n8n，先等当前工作流执行完毕并停止服务。用平时启动 n8n 的系统用户，在解压后的仓库目录运行下列命令。若数据目录经过自定义，请把 `$HOME/.n8n` 换成实际存在的目录。脚本使用系统中的 `node`、`tar` 和 `sh`。

```sh
sh scripts/install-local.sh downloads/n8n-nodes-nstdata-0.1.1.tgz "$HOME/.n8n"
```

按原来的命令或服务管理方式重新启动 n8n，刷新编辑器并搜索 **Nstdata Crawl**。这两种安装方式都会把节点放到选定数据目录下的 `nodes/node_modules/n8n-nodes-nstdata`。

## 连接你的 Nstdata 账号

1. 登录 [Nstdata 控制台](https://app.nstdata.io/)，获取具有 Crawl 权限的 API Key。
2. 在画布上添加 **Nstdata Crawl**，凭据类型使用 **Nstdata API Key**。打开凭据选择框，选择 **Create new credential（新建凭据）**，输入 Key 并点击 **Save（保存）**。
3. 看到 **Connection tested successfully** 就表示 Key 验证成功。连接测试读取账号信息。执行抓取时，服务会使用这把 Key 所属账号的 Crawl 权限与额度。

其他工作流可以直接选择这份已保存的凭据。如果你已有 n8n 的 **Simplified Custom Auth** 凭据，并已将 Nstdata Key 配置到 `X-API-Key` 请求头，可选择 **Reuse HTTP Request Credential** 复用。

## 第一次抓取网页

连接 **Manual Trigger（手动触发）→ Nstdata Crawl**。操作选择 **Scrape a Page**，URL 填 `https://example.org/`，输出选择 **Markdown**，返回方式保留 **Wait for Content**，然后执行工作流。成功时，输出中会有 `status: "completed"`、`taskId` 和 `markdown`。下一节点用 `{{ $json.markdown }}` 就能读取正文。

| 节点操作 | 输入 | 输出 |
| --- | --- | --- |
| Scrape a Page · 抓取网页 | 每条记录一个 HTTP(S) 地址，如 `{{ $json.url }}` | 所选格式的内容，或立即返回任务 ID |
| Get Scrape Result · 查询结果 | 已提交任务的 `taskId` | 当前任务状态，完成后返回结果 |
| Read Referenced Content · 读取引用 | `markdownRef` 或 `htmlRef`，以及对应内容类型 | `markdown` 或 `html` 字段里的正文 |

等待超时时，节点会保留原任务 ID，并返回 `timedOut: true`。把该 ID 传给 **Get Scrape Result** 可以续查。再次执行 **Scrape a Page** 会创建新任务，可能再次使用额度。下游节点应先判断任务已完成，再读取正文。服务端返回内容截断标记时，输出会带上 `truncated: true`。

要试多条 URL，在 n8n 工作流菜单中选择 **Import from File（从文件导入）**，打开[示例工作流](examples/multiple-urls-to-markdown.json)，在 **Scrape each URL** 节点中选好自己的凭据再执行。每条结果都能对应回原始输入行。

## 后续更新与回退

下载目标版本的仓库和 `downloads/` 中对应的安装包，将上面的文件名换成新版本，然后重复安装步骤。脚本会先检查安装包，并在替换时打印旧版节点的备份路径。它只替换节点文件，已保存的工作流和凭据保存在 n8n 数据目录中。建议保留上一次验证可用的安装包。

重启后，打开节点检查已保存凭据，再抓取一个网页验收。需要回退时，使用旧版安装包重复安装并重启。如果搜不到节点，请检查实际数据目录、`nodes/node_modules/` 中的安装位置和 n8n 启动日志。如果凭据验证失败，请核对 Key，并确认 n8n 能连接 `api.nstdata.io`。

## 从源码构建

开发者可在已安装 Node.js 和 npm 的环境中运行以下命令。项目使用 n8n node CLI 和 TypeScript，测试通过模拟 API 响应运行。`npm pack` 会在当前目录生成本地安装包，可用同一脚本安装。

```sh
npm ci
npm run lint
npm test
npm pack
```

[Crawl API 文档](https://docs.nstdata.io/docs/crawl) · [n8n 自托管节点安装文档](https://docs.n8n.io/integrations/creating-nodes/deploy/install-private-nodes/) · [MIT 许可证](LICENSE)
