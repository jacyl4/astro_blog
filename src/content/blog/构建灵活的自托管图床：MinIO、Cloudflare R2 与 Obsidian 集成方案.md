---
title: "构建灵活的自托管图床：MinIO、Cloudflare R2 与 Obsidian 集成方案"
pubDate: 2025-06-08
category: "存储"
tags: ["图床", "MinIO", "Cloudflare R2", "Obsidian", "对象存储"]
description: "本文探讨了如何构建灵活的自托管图床，结合 MinIO、Cloudflare R2 和 Obsidian，实现高效的图片存储和管理。"
---
1. 引言

构建一个既满足本地快速访问与管理，又能便捷分享至公网的图床系统，是许多内容创作者和知识管理爱好者的共同需求。本方案旨在为用户提供一个全面的技术指南，详细阐述如何自建一个支持桌面浏览器和手机上传（手机端可弱化）的图床。该系统将采用 Cloudflare R2 作为公网存储，本地 MinIO 作为私有存储与同步节点，实现本地与公网链接使用不同域名（前缀）但保持相同访问路径，从而方便在不同环境间无缝切换。最终目标是能够将图片快速粘贴（非附件形式）到 Obsidian 笔记中，并将 Obsidian 特定文件夹内容平滑生成博客。本报告将深入探讨架构设计、关键组件配置、工作流程以及相关的安全与维护考量。
2. 核心存储后端：MinIO 与 Cloudflare R2

构建图床系统的基石是稳定可靠的存储后端。本方案采用混合云存储策略，结合本地 MinIO 和公有云 Cloudflare R2，以兼顾访问速度、数据冗余和成本效益。
2.1. 本地 MinIO 服务器搭建与配置

MinIO 是一款开源的高性能对象存储服务器，兼容 Amazon S3 API，非常适合作为本地图床的存储核心 。  

    安装 MinIO:
        推荐使用 Docker 进行部署，便于管理和版本控制。可以使用以下命令启动 MinIO 容器 ：
        Bash

docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=YOUR_MINIO_ACCESS_KEY" \
  -e "MINIO_ROOT_PASSWORD=YOUR_MINIO_SECRET_KEY" \
  -v /path/to/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"

将 /path/to/minio/data 替换为本地数据存储路径，YOUR_MINIO_ACCESS_KEY 和 YOUR_MINIO_SECRET_KEY 替换为自定义的访问凭证。  
MinIO 默认 API 端口为 9000，控制台端口为 9001 。  

    基本配置:
        存储桶 (Bucket) 创建: 通过 MinIO 控制台 (例如 http://localhost:9001) 创建一个用于存储图片的存储桶，例如命名为 images。
        访问策略: 根据需求设置存储桶的访问策略。对于本地访问，初始可以设置为私有。后续通过反向代理和 Obsidian 插件访问时，需要确保应用程序具有相应的读写权限。公开访问策略应谨慎设置，通常公网访问会通过 Cloudflare R2 进行。

本地部署 MinIO 为图片提供了一个快速、私有的存储空间。由于其 S3 兼容性，众多 S3 工具和 SDK 均可与之交互 ，这为后续的同步和上传工具选择提供了极大的便利。选择 Docker 部署方式，不仅简化了安装升级流程 ，也使得环境配置和迁移更为便捷。  

2.2. Cloudflare R2 存储桶设置

Cloudflare R2 提供与 S3 兼容的对象存储服务，其主要优势在于免除出口带宽费用，非常适合用作公共图床的存储和分发 。  

    创建 R2 存储桶:
        登录 Cloudflare 控制台，导航至 R2 部分 。   

创建一个新的存储桶，例如也命名为 images，以保持与 MinIO 的一致性。选择合适的地理位置（或自动选择）。
记下存储桶的 S3 API 端点 (Endpoint URL) 和账户 ID (Account ID)，这些信息在后续配置同步工具和 Obsidian 插件时会用到 。  

获取 API 令牌:

    在 R2 管理界面，创建 R2 API 令牌 。   

    授予该令牌对目标存储桶的读写权限（例如 Admin Read & Write 或更细粒度的 Object Read & Write）。
    妥善保存生成的 Access Key ID 和 Secret Access Key。

配置 CORS (跨源资源共享):
如果图片需要直接从浏览器中通过脚本访问（例如某些预览功能或高级博客特性），则需要在 R2 存储桶设置中配置 CORS 规则，允许来自博客域名或本地开发环境的请求 。
示例 CORS 配置 (JSON 格式，根据实际域名修改)：  

JSON

    [
      {
        "AllowedOrigins": ["https://your-blog-domain.com", "http://localhost:1313"],
        "AllowedMethods":,
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
      }
    ]

Cloudflare R2 作为公共存储层，其 S3 兼容性是关键 。这意味着为 MinIO 配置的同步工具和上传客户端，理论上也可以无缝对接 R2。R2 的另一个重要特性是允许绑定自定义域名，这对于实现用户期望的公网链接前缀至关重要 。  

2.3. MinIO 与 Cloudflare R2 之间的数据同步

为了确保本地 MinIO 和公网 R2 的数据一致性，并实现图片在两个存储位置具有相同的相对路径，需要配置一个可靠的同步机制。

    选择同步工具:
        Rclone: 是一款功能强大的命令行工具，支持在多种云存储服务之间同步文件，包括 S3 兼容服务如 MinIO 和 R2 。Rclone 支持单向和双向同步 (rclone sync 和 rclone bisync) 。   

MinIO Client (mc): MinIO 自带的命令行工具，提供 mc mirror 命令用于同步数据 。mc mirror 也支持监控模式 (--watch) 实时同步变更。  

对于本方案，推荐使用 Rclone，因为它在社区中以其灵活性和对多种后端的广泛支持而闻名。虽然 mc mirror 也能完成任务，但 Rclone 在复杂场景下的配置选项和性能调优方面可能更具优势 。  

配置同步 (以 Rclone 为例):

    安装 Rclone: 根据 Rclone 官网指南安装。
    配置 Rclone Remotes: 运行 rclone config 创建两个 remotes：一个指向本地 MinIO，另一个指向 Cloudflare R2。 示例 rclone.conf 文件片段 (~/.config/rclone/rclone.conf) ：
    Ini, TOML

[minio_local]
type = s3
provider = MinIO
env_auth = false
access_key_id = YOUR_MINIO_ACCESS_KEY
secret_access_key = YOUR_MINIO_SECRET_KEY
endpoint = http://localhost:9000 # 或 MinIO 服务器地址
acl = private

[cloudflare_r2]
type = s3
provider = Cloudflare
access_key_id = YOUR_R2_ACCESS_KEY_ID
secret_access_key = YOUR_R2_SECRET_ACCESS_KEY
endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
acl = private # 如果对象默认通过 R2 公开，则为 public-read

 
执行同步命令: 推荐使用单向同步，以 MinIO 作为源，R2 作为目标，确保本地上传的图片最终同步到公网。
Bash

    rclone sync minio_local:images cloudflare_r2:images --progress --checksum

    其中 images 是之前创建的存储桶名称。--checksum 确保基于文件内容而非仅时间和大小进行同步，更为可靠。

确保路径一致性:
同步工具如 Rclone 和 mc mirror 在正确配置后，会自然地保持源和目标之间的路径一致性。关键在于同步整个相关的存储桶或存储桶内的特定前缀（文件夹）。例如，如果 MinIO 中的图片路径是 images/post-assets/image1.jpg，同步到 R2 后，其在 R2 中的路径也将是 images/post-assets/image1.jpg。

调度同步任务:
为了实现自动化同步，可以使用操作系统的任务调度功能：

    Linux/macOS: 使用 cron 作业。
    Windows: 使用任务计划程序 (Task Scheduler)。 例如，每 5 分钟执行一次同步的 cron 表达式：

代码段

    */5 * * * * /usr/bin/rclone sync minio_local:images cloudflare_r2:images --checksum >> /var/log/rclone_sync.log 2>&1

同步机制是整个双存储、双 URL 系统的核心。如果同步中断或配置错误，本地和公网的图片内容将出现不一致，直接影响用户体验。例如，若同步失败，新上传到 MinIO 的图片将无法通过公共 R2 URL 访问。选择单向同步 (MinIO 到 R2) 相较于双向同步，其逻辑更简单，能有效避免复杂的冲突解决场景，从而提高系统的稳定性和可维护性 。  

此外，同步时使用如 rclone sync 的 --checksum 选项或 mc mirror 的 --overwrite 选项，并配合 --remove (或 Rclone sync 的默认行为，即删除目标端多余文件)，对于实现真正的镜像至关重要 。若不移除目标端已在源端删除的文件，会导致 R2 上积累陈旧或已删除的图片，破坏路径和内容的一致性。  

最后，对于大型图库，同步工具的性能可能成为瓶颈。一些比较指出，mc mirror 在某些情况下可能慢于 rclone sync ，而 Rclone 本身也需要通过调整参数（如 --checkers 和 --transfers）来优化 S3 性能 。因此，用户应关注同步性能，并根据实际情况调整工具参数。  

3. 统一图片访问：域名与 URL 管理

实现本地与公网链接前缀域名不同但路径相同的目标，关键在于对域名和 URL 生成的精细管理。
3.1. 为本地 MinIO 访问配置自定义域名

为了使本地访问 MinIO 的 URL 更规范，并与公共 URL 结构上更相似，可以为其配置一个本地自定义域名（例如 minio.img.local 或 img.lan），而不是直接使用 localhost:9000 或 IP 地址。

    方法：使用反向代理:
        Caddy: Caddy 以其配置简单和自动 HTTPS 功能（对本地开发可选，纯本地 HTTP 亦可）而著称。可以参考 Caddy 为 S3 兼容存储配置反向代理的示例进行调整 。 示例 Caddyfile (假设 Caddy 与 MinIO 在同一台机器上运行)：
        代码段

minio.img.local {
    reverse_proxy localhost:9000
}

 
Nginx: Nginx 也是常用的反向代理服务器。以下是一个基础配置示例 ：
Nginx

server {
    listen 80;
    server_name minio.img.local;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 如果 MinIO 在代理后使用预签名 URL，以下头部可能需要
        proxy_set_header X-Amz-Content-Sha256 $http_x_amz_content_sha256;
        proxy_set_header Authorization $http_authorization;
    }
}

 

    本地 DNS 解析:
    为了使 minio.img.local 这样的域名在本地网络中生效，需要在访问设备上进行 DNS 解析。方法包括：
        修改操作系统的 hosts 文件 (例如，在 Windows 的 C:\Windows\System32\drivers\etc\hosts 或 Linux/macOS 的 /etc/hosts 文件中添加 127.0.0.1 minio.img.local)。
        使用本地 DNS 服务器，如 Pi-hole、AdGuard Home，或在局域网路由器中配置 DNS 记录（如果路由器支持）。

通过本地自定义域名访问 MinIO，不仅提升了 URL 的美观性和一致性（例如，本地 http://minio.img.local/images/path/to/image.jpg 对比公网 https://img.yourpublicdomain.com/images/path/to/image.jpg），也为 Obsidian 插件配置提供了便利，如果插件支持仅切换 URL 的域名部分。然而，引入反向代理也意味着增加了一个需要维护和排错的组件。反向代理的配置（特别是头部转发，以确保与 S3 API 的兼容性）必须正确无误。
3.2. 为公共 R2 访问配置自定义域名

为了提供专业且品牌化的公网图片访问链接，应为 Cloudflare R2 存储桶配置自定义域名（例如 img.yourpublicdomain.com），而非使用 R2 默认的 r2.dev URL。

    Cloudflare 设置步骤:
        域名归属: 待使用的自定义域名必须已添加到与 R2 存储桶相同的 Cloudflare 账户下，并作为活动区域 (zone) 。   

连接自定义域名到 R2 存储桶:

    在 Cloudflare 控制台的 R2 存储桶设置页面，找到“自定义域 (Custom Domains)”选项，点击“连接域 (Connect Domain)”或“添加 (Add)” 。   

            输入希望使用的自定义域名（如 img.yourpublicdomain.com）。
            Cloudflare 会自动或引导用户创建一个 CNAME DNS 记录，将自定义域名指向 R2 存储桶的服务端点。
        验证与激活: 等待 DNS 记录生效，状态变为“活动 (Active)”。

配置自定义域名不仅提升了品牌形象，缩短了 URL 长度，更重要的是能够利用 Cloudflare 提供的 CDN 缓存、WAF 防火墙、访问控制等高级功能来优化和保护图片访问 。这对于一个面向公众的博客系统而言，是必不可少的步骤。  

3.3. 实现不同前缀与相同路径

用户期望的核心功能——本地与公网链接前缀域名不同但路径相同——主要通过以下方式实现：

    数据层路径一致性: MinIO 和 R2 中的对象存储路径通过第 2.3 节的同步机制确保完全一致。例如，一张图片在 MinIO 中的对象键 (object key) 是 images/uploads/2024/my-image.png，同步到 R2 后，其对象键依然是 images/uploads/2024/my-image.png。
    访问层前缀差异化:
        本地访问: 通过配置好的本地自定义域名和反向代理（第 3.1 节），图片 URL 格式为 http://minio.img.local/images/uploads/2024/my-image.png。这里的 http://minio.img.local/ 是本地前缀，images 是存储桶名。
        公网访问: 通过配置好的 R2 自定义域名（第 3.2 节），图片 URL 格式为 https://img.yourpublicdomain.com/images/uploads/2024/my-image.png。这里的 https://img.yourpublicdomain.com/ 是公网前缀，images 同样是存储桶名（如果 R2 自定义域名直接映射到存储桶，则 URL 可能不包含桶名，如 https://img.yourpublicdomain.com/uploads/2024/my-image.png，这取决于 R2 自定义域名的具体配置方式和是否在路径中包含了桶名）。
    客户端（Obsidian 插件/上传器）处理: 关键在于图片上传工具和 Obsidian 插件能够根据当前操作环境（本地查阅或准备发布）生成或使用正确的 URL 前缀，同时保持相对路径 uploads/2024/my-image.png 不变。

这种设计将路径一致性的维护交给了后端同步，而前缀的差异化则由前端或客户端应用（如 Obsidian 插件）在生成链接时处理。这避免了在反向代理或 Cloudflare层面进行复杂的 URL 重写来适配路径。

如果 Obsidian 插件无法动态切换基础 URL 或使用可配置的 URL 模板，那么在本地编辑和生成博客文章时，可能需要手动调整链接前缀，或者寻找更高级的链接管理方案。这是后续选择和配置 Obsidian 插件时需要重点考察的方面。
4. 简化图片上传工作流程

为了方便地将图片上传至图床系统（主要上传到本地 MinIO，再由其同步至 R2），需要一个合适的上传解决方案。
4.1. 选择图片上传器方案

用户主要需求是桌面浏览器上传，手机端需求较弱。

    避免过度复杂的方案: 除非用户有额外的需求，否则不必部署功能全面的相册管理软件如 Chevereto 、Lychee  或 PhotoPrism 。这些软件通常包含用户管理、相册、标签等高级功能，对于仅需上传和链接的场景可能过于臃肿。   

    Chevereto 考量: Chevereto (V3/V4 AGPL 版本) 确实支持 S3 兼容的外部存储和 API 。如果用户希望在 Obsidian 之外有一个独立的网页上传界面，Chevereto 可以作为一个选项。其界面响应式设计，支持移动端上传 。但需确认免费版在 S3 和 API 功能上无限制 。V4 版本特性列表显示支持外部存储和 API 。   

轻量级选项/自定义脚本:

    S3 客户端工具: 如 Cyberduck (GUI) 或 s3cmd/s5cmd (CLI) 可以直接上传文件到 MinIO，但它们并非浏览器内嵌的上传器。   

支持 S3 的自托管文件管理器: TagSpaces 支持 S3，并能作为浏览器、查看器和上传器。FileBrowser 主要定位是文件管理器，其作为图床上传器的适用性有待商榷 。  
简单网页上传脚本: 一个简洁的 HTML 表单配合 JavaScript，使用 AWS SDK for JS 或预签名 URL (Presigned URL) 机制 直接上传到 MinIO，是开销最小且控制力最强的方案。 提供了一个 Node.js Lambda 生成预签名 URL 的例子，可以改编为一个本地小型 Node.js 服务。  

    Obsidian 插件作为主要上传器: 一个重要的考虑是，如果选用的 Obsidian 插件（详见第 5 节）本身就支持通过粘贴或拖拽图片直接上传到 MinIO/R2，那么一个独立的、专门的“图床上传应用”对于主要的桌面端工作流程而言可能就不是必需的了。这种情况下，独立的上传器仅用于批量上传或在 Obsidian 环境之外上传。

4.2. 上传 API 配置

无论选择何种上传器，其目标都应是本地 MinIO 服务器。图片上传到 MinIO 后，再由后台同步任务（第 2.3 节）复制到 Cloudflare R2。这种策略简化了上传客户端的逻辑，使其只需关注单一上传目标，并能充分利用本地网络的上传速度。

    S3 API 认证: 上传器需要配置 MinIO 的服务地址（例如，经过反向代理的 http://minio.img.local）、Access Key、Secret Key 以及目标存储桶名称（如 images）。
    预签名 URL (推荐用于浏览器上传):
        概念: 浏览器前端向一个受信任的后端服务（该服务安全存储 MinIO 凭证）请求一个临时的、带有签名的 URL。浏览器随后使用这个预签名 URL 直接将文件上传到 MinIO 。   

优势: MinIO 的主凭证不会暴露给浏览器客户端，增强了安全性；同时减轻了中转服务器的负载 。  

        实现: 可以搭建一个轻量级的本地后端服务（例如 Node.js + Express 或 Python + Flask），使用 MinIO SDK (AWS S3 SDK) 来生成这些预签名 URL。

上传凭证的安全性至关重要。若不采用预签名 URL 机制，而是由前端应用直接发起 S3 API 调用，则存在凭证泄露的风险。预签名 URL 是客户端直接上传到 S3 兼容存储的标准安全实践。
5. Obsidian 集成：无缝图片粘贴

要在 Obsidian 中实现图片的快速粘贴（非附件形式）并自动上传、替换链接，需要依赖特定的社区插件。
5.1. 推荐的 Obsidian 插件

以下是一些有潜力满足用户需求的 Obsidian 插件：

    "Image Upload Toolkit" by addozhang:
        明确支持 Cloudflare R2、Amazon S3 等多种存储服务，表明其对 S3 兼容存储（如 MinIO）有良好支持 。   

核心功能是将 Markdown 中的本地图片上传后，将更新后的图片 URL 复制到剪贴板，原始笔记中的本地引用保持不变 。同时，该插件也提供“可选的就地替换 (Optional In-Place Replacement)”功能 ，这更符合用户“快速贴入”的期望。  
配置项中包含针对 S3 和 R2 的 "Custom Domain" (自定义域名) 选项 ，这对于实现用户的双 URL 前缀需求至关重要。  

"S3 Image Uploader" by jvsteiner:

    专为“用户自己的 S3 存储”设计 。   

默认生成的链接格式为 AWS 标准格式，如 https://<your-bucket>.s3.<your-region>.amazonaws.com/... 。其对完全自定义域名（用于本地 MinIO 或公网 R2）的支持程度需要进一步验证。虽然 中提到“支持 S3 兼容存储”是未来目标，但 也指出其“与 S3 兼容提供商集成”。  

        该插件似乎直接在笔记中插入链接，符合“快速贴入”的描述。

选择插件时，应重点评估以下几点：

    S3 兼容性: 是否能良好支持 MinIO（自定义端点、路径样式/虚拟主机样式访问）。
    URL 自定义能力: 能否为生成的链接配置完整的基础 URL 或域名，以满足 http://minio.img.local/... 和 https://img.yourpublicdomain.com/... 的需求。
    配置便捷性: Access Key、Secret Key、Region (R2 通常为 auto)、Bucket 等参数的配置是否清晰。
    工作流程: 是否支持粘贴/拖拽上传，并自动替换链接。
    维护状态和社区支持。

Obsidian 图片上传插件功能对比
功能	Image Upload Toolkit (addozhang)	S3 Image Uploader (jvsteiner)
S3 端点配置 (MinIO)	支持 (通过 S3 通用配置) 	需要验证是否能灵活配置非 AWS S3 端点
Cloudflare R2 支持	明确支持 	可能通过 S3 兼容方式支持，但需验证
自定义基础 URL/域名	是，为多种服务提供 "Custom Domain" 选项 	默认 AWS URL 格式，自定义能力待验证
存储桶内路径自定义	支持 "Target Path" 配置 	支持 "folder" 配置
粘贴上传	支持 (触发上传和链接处理)	支持
拖拽上传	支持	支持 (可选)
链接替换方式	主要为导出到剪贴板，提供可选的“就地替换” 	似乎是直接在笔记中插入/替换链接
活动维护状态 (根据资料)	较新提及，有持续讨论 	提及为较早的插件，但仍被列出
 

插件中“自定义域名”的具体含义非常关键。它究竟是指替换标准 S3 路径中的域名部分，还是允许指定一个完整的基础 URL 前缀？这直接影响到是否能精确构造出用户所需的两种 URL 格式。例如，"Image Upload Toolkit" 提供的 "Endpoint" 和 "Custom Domain" 选项  为这种定制化提供了可能。  

5.2. 配置 Obsidian 插件以支持双 URL 前缀

理想情况下，所选插件应支持以下任一方式来管理本地和公共 URL 前缀：

    配置文件切换或基础 URL 覆写: 插件允许定义多个配置档案（例如“本地”和“公共”），每个档案对应不同的基础 URL。用户在日常笔记时使用“本地”配置（链接指向 minio.img.local），在准备发布博客时切换到“公共”配置（链接指向 img.yourpublicdomain.com）。
    利用插件的“自定义域名”和“S3 端点”组合:
        将插件的 S3 端点设置指向本地 MinIO 的自定义域名 http://minio.img.local。
        如果插件的“自定义域名”字段用于 生成最终 URL (例如，在上传到 R2 时，将 R2 的 S3 API 端点作为“S3 端点”，然后将 https://img.yourpublicdomain.com 作为“自定义域名”)，则可以实现 URL 切换。
        "Image Upload Toolkit" 似乎提供了这种灵活性，其针对 Cloudflare R2 的配置项包括 Endpoint, Access Key ID, Secret Access Key, Bucket Name, Target Path, 和 Custom Domain Name。用户可以为本地 MinIO 配置一套（将 MinIO 地址作为 Endpoint），为 R2 配置另一套（使用 R2 的 Endpoint 和公共 Custom Domain）。切换可能意味着在插件设置中更改当前活动的存储配置。   

如果插件不支持便捷的 URL 前缀切换，用户可能需要在准备发布内容时手动修改插件配置，或者在 Markdown原文中进行查找替换，这将显著降低工作流程的“平滑度”。因此，插件如何组合端点、存储桶、自定义域名等信息来构建最终 URL，是配置成功的关键，可能需要实际测试来验证。
6. 从 Obsidian 平滑生成博客

用户希望将 Obsidian 特定文件夹内容平滑生成博客，并确保图片链接正确。
6.1. Obsidian 内容发布到静态站点生成器的工作流程

将 Obsidian 中的 Markdown 笔记转换为博客，通常采用静态站点生成器 (SSG)，如 Hugo, Jekyll, Eleventy, Next.js (配合 MDX) 等。

    通用方法:
        SSG 直接处理 Obsidian 内容: 将 SSG 的内容源目录指向 Obsidian 笔记库中的特定博客文件夹。 提供了一个将 Obsidian 作为 Hugo 内容管理系统 (CMS) 的详细工作流程，包括调整内容结构（如 Hugo 的页面包 Page Bundles）、处理 YAML Frontmatter、以及配置 Hugo 的链接渲染机制以正确处理 Obsidian 内部链接（例如将 [[note_name]] 或 [text](note_name.md) 转换为博客的永久链接）。   

    Obsidian 导出/发布工具: 某些 Obsidian 插件可能提供针对 SSG 的导出功能。

关键步骤 :  

    内容组织: 即使图片使用外部链接，良好的目录结构（例如每篇博文一个文件夹）仍有助于管理。
    Frontmatter: 确保 SSG 配置与 Obsidian 的 YAML Frontmatter 兼容。
    内部链接处理: Obsidian 中的笔记间链接需要转换为博客文章间的有效链接。 中的 Hugo render-link.html 模板是一个很好的参考。   

        Obsidian 配置: 可能需要调整 Obsidian 的链接设置，例如禁用 Wikilinks，使用标准的 Markdown 相对路径链接（尽管对于图片，本方案使用的是绝对 URL）。

由于本方案中 Obsidian 插件已配置为在“发布”阶段（或通过特定命令）生成指向公网 R2 的图片 URL，因此 Markdown 文件本身在提交给 SSG 处理时，其图片链接理论上已经是公开可访问的绝对 URL。这极大地简化了 SSG 对图片的处理：SSG 无需复制图片资源或重写图片路径，只需按原样渲染 Markdown 中的 <img> 标签即可。
6.2. 确保已发布博文中包含公共图片 URL

核心在于第 5.2 节中 Obsidian 插件的配置。当准备发布特定笔记或文件夹到博客时，需确保插件生成或转换的图片链接使用的是指向 Cloudflare R2 自定义域名的公共 URL 前缀 (例如 https://img.yourpublicdomain.com/images/...)。

如果 Obsidian 插件能够根据上下文（例如，执行一个“发布到博客”的命令或切换到一个“发布”配置文件）将笔记中的图片链接更新为公共 URL，那么 SSG 在构建博客时，就能直接使用这些已经是最终形态的图片链接。

这种工作流程的“平滑性”在很大程度上取决于 Obsidian 插件是否能便捷、准确地生成面向公众的图片 URL。如果此步骤需要大量手动干预，则整体体验会大打折扣。
7. 安全、维护与可扩展性考量

    安全:
        MinIO 安全: 使用强壮的 MINIO_ROOT_USER 和 MINIO_ROOT_PASSWORD 。限制 MinIO 服务器的网络暴露，例如通过防火墙或仅绑定到本地回环地址（如果仅本地访问）。若通过反向代理从外部（即使是局域网内其他机器）访问 MinIO 控制台或 API，应为反向代理配置 HTTPS 。定期更新 MinIO 。   

R2 安全: 遵循最小权限原则为 R2 API 令牌授权 。妥善保管 API 令牌。仔细审查存储桶策略，确保仅对预期的对象路径开放公共读取权限，并严格限制写入权限。如果使用 Cloudflare WAF 或 Access 控制自定义域名访问，务必禁用 r2.dev 子域名的公共访问，以防绕过 。  

    同步安全: 确保同步工具（Rclone/mc）通过 HTTPS 与 R2 及 MinIO（若 MinIO 端点也配置为 HTTPS）通信。保护同步工具所使用的凭证。
    Obsidian 安全: 谨慎选择和使用社区插件，优先选择维护良好、来源可信的插件。

维护:

    定期更新所有软件组件：MinIO, Rclone/mc, Caddy/Nginx, 操作系统, Obsidian, Obsidian 插件, 静态站点生成器。
    监控同步日志，及时发现并处理错误。
    备份 MinIO 数据卷。尽管数据会同步到 R2，但本地 MinIO 作为主要入口和潜在的“单一事实来源”，其数据备份依然重要。

可扩展性:

    MinIO 本身支持集群部署以实现高可用和扩展，但对于单用户图床，单节点部署通常已足够。
    Cloudflare R2 本身是为大规模存储设计的 。   

主要的扩展性瓶颈可能出现在图片数量极大时同步所需的时间。届时可能需要对 Rclone/mc 的并发参数等进行调优 。  

自行搭建和管理这一套系统，意味着用户承担了系统管理员的角色，需要关注各个组件的安全配置和持续维护。这是为了换取“完全控制权”所付出的代价。特别需要注意的是，同步过程如果配置不当（例如误用 --remove 选项或在双向同步中出现冲突），可能会导致数据丢失。因此，在正式启用同步前，务必进行充分测试（例如使用 --dry-run 标志），并考虑在 R2 和/或 MinIO 上启用版本控制功能作为额外的保障 。  

8. 结论与最终建议

本报告提出的自建图床方案，通过整合本地 MinIO、云端 Cloudflare R2、高效同步工具、灵活的域名管理以及深度 Obsidian 集成，旨在满足用户对图片存储、管理、分享和博客发布的全面需求。该架构的核心优势在于其灵活性和可控性，允许用户根据自身环境和偏好定制 URL 结构，并在本地和公网之间平滑切换。

总结方案关键点：

    双存储核心: 本地 MinIO 提供快速私有的存储和上传入口，Cloudflare R2 提供经济高效的公网存储和分发。
    路径一致性: 通过 Rclone (或 mc mirror) 实现 MinIO 到 R2 的单向同步，确保对象在两个存储中的相对路径完全一致。
    URL 差异化:
        本地通过反向代理 (Caddy/Nginx) 为 MinIO 配置自定义局域网域名 (如 http://minio.img.local/images/...)。
        公网通过 Cloudflare 为 R2 存储桶配置自定义域名 (如 https://img.yourpublicdomain.com/images/...)。
    Obsidian 集成: 选用如 "Image Upload Toolkit" 或 "S3 Image Uploader" 等 Obsidian 插件，配置其将图片上传至本地 MinIO，并能根据场景（本地编辑或发布）生成包含相应域名和相同相对路径的 Markdown 链接。
    博客生成: 利用静态站点生成器直接处理 Obsidian 中已包含公共图片链接的 Markdown 文件，实现内容的平滑发布。

核心实施建议：

    优先选择 Rclone 进行同步: 其灵活性和社区支持度较高，性能调优选项也更丰富。从 MinIO 到 R2 的单向同步是推荐的起始配置。
    重点评估 Obsidian 插件: 插件是否能稳定地与 MinIO (S3 兼容模式) 交互，以及是否能灵活配置和切换最终生成的图片 URL 前缀，是整个工作流程顺畅与否的关键。推荐优先考虑 "Image Upload Toolkit" by addozhang，因其明确支持 R2 和自定义域名，并提供就地替换选项。
    简化上传流程: 如果 Obsidian 插件能满足大部分上传需求，则无需额外部署复杂的独立上传应用。若确需独立上传，一个基于预签名 URL 的简单网页上传器是轻量且安全的选择。
    分阶段实施与测试:
        首先搭建并配置好 MinIO 和 R2。
        配置并彻底测试 Rclone 同步，确保路径一致性和数据完整性。
        配置本地 MinIO 和公网 R2 的自定义域名。
        选择并配置 Obsidian 插件，反复测试其在不同场景下的图片上传和链接生成行为，确保能按需生成本地和公共两种前缀的 URL。
        最后集成静态站点生成器，验证博客发布流程。
    安全与备份常抓不懈: 定期更新所有组件，妥善管理访问凭证，配置防火墙，并对 MinIO 本地数据进行常规备份。

该方案虽然组件较多，配置环节也相对复杂，但一旦成功部署，将为用户带来高度定制化、自主可控且功能强大的个人图床和内容发布体验。其设计的核心在于将复杂性封装在后端和配置中，力求为前端用户（尤其是在 Obsidian 中的操作）提供尽可能平滑和自动化的体验。
