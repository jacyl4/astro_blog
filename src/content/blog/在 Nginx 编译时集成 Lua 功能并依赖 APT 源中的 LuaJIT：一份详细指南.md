---
title: "在 Nginx 编译时集成 Lua 功能并依赖 APT 源中的 LuaJIT：一份详细指南"
createDate: 2025-06-08
categories: ["Nginx"]
tags: ["Nginx", "Lua", "LuaJIT", "APT"]
description: "本报告旨在提供一个全面的指南，详细阐述如何在编译 Nginx 时集成 Lua 功能，并特别关注如何有效地利用 APT 源中的 LuaJIT 作为其依赖。"
---
1. 引言：Nginx、Lua 与 LuaJIT 的协同力量

Nginx 以其高性能和高并发处理能力而闻名，而 Lua 作为一种轻量级、可嵌入的脚本语言，为 Nginx 提供了强大的扩展性。通过 ngx_http_lua_module (或其 stream 模块版本 ngx_stream_lua_module)，可以在 Nginx 的请求处理流程中嵌入 Lua 脚本，实现动态路由、访问控制、请求/响应修改、与外部服务交互等复杂逻辑，而无需编写 C 模块。

LuaJIT 是 Lua 的一个即时编译器 (Just-In-Time Compiler)，它显著提升了 Lua 代码的执行效率，使其在性能敏感的 Nginx 环境中成为理想选择。当在自己编译 Nginx 并希望加入 Lua 功能时，如果选择依赖操作系统 APT (Advanced Package Tool) 源中提供的 LuaJIT，可以简化依赖管理和更新过程。然而，这种方法也带来了一些需要注意的挑战，主要是确保 Nginx 编译时能够正确找到 APT 安装的 LuaJIT 库和头文件。

本报告旨在提供一个全面的指南，详细阐述如何在编译 Nginx 时集成 Lua 功能，并特别关注如何有效地利用 APT 源中的 LuaJIT 作为其依赖。我们将探讨环境准备、依赖安装、Nginx 编译配置、常见问题排查以及最佳实践。
2. 编译 Nginx 集成 Lua 功能的核心挑战与解决方案思路
核心挑战

    依赖发现与链接： Nginx 编译脚本（特别是 ngx_http_lua_module 的配置脚本）需要能够定位到 LuaJIT 的头文件（通常是 luajit.h、lua.h、lauxlib.h、lualib.h 等）和共享库文件（通常是 libluajit-5.1.so）。APT 安装的这些文件可能位于非标准路径，或者其路径未被编译环境默认搜索。
    版本兼容性： APT 源中的 LuaJIT 版本需要与 ngx_http_lua_module 所期望或兼容的版本相匹配。虽然 LuaJIT 努力保持与 Lua 5.1 的兼容性，但特定模块版本可能对 LuaJIT 的某些特性或修复有隐式依赖。
    动态链接与运行时环境： 即使编译成功，Nginx 在运行时也需要能够找到并加载 APT 安装的 LuaJIT 共享库。这通常涉及到配置系统的动态链接器（如通过 ldconfig 或设置 LD_LIBRARY_PATH）。

解决方案思路

    显式指定 LuaJIT 路径： 在 Nginx 的 ./configure 脚本中，通过设置 LUAJIT_LIB 和 LUAJIT_INC 环境变量，或通过模块提供的特定配置选项，明确告知编译器 LuaJIT 库文件和头文件的位置。
    利用 pkg-config： 如果 APT 安装的 LuaJIT 提供了 .pc 文件（通常位于 /usr/lib/[arch-triple]/pkgconfig/ 或 /usr/share/pkgconfig/），pkg-config 工具可以帮助自动获取编译和链接所需的标志。
    符号链接 (Symbolic Links)： 在某些情况下，如果模块期望在特定路径找到 LuaJIT 文件，而 APT 将其安装在别处，可以创建符号链接来桥接这种差异。
    确保运行时库路径： 确认 APT 安装的 LuaJIT 共享库路径位于系统的动态链接器搜索路径中。通常，APT 包的 post-installation 脚本会处理这个问题（例如通过运行 ldconfig），但验证总是一个好习惯。

3. 详细步骤：编译 Nginx 并集成 APT 源的 LuaJIT

以下步骤假设您使用的是基于 Debian 或 Ubuntu 的 Linux 发行版，这些发行版使用 APT 作为包管理器。
3.1. 环境准备与依赖安装

    更新 APT 源并安装基础编译工具：
    Bash

sudo apt update
sudo apt install -y build-essential libpcre3-dev libssl-dev zlib1g-dev wget curl

    build-essential: 包含编译软件所需的基本工具链（如 GCC, make）。
    libpcre3-dev: Nginx Rewrite 模块和核心 HTTP 模块所需的 PCRE 库（正则表达式）。
    libssl-dev: Nginx HTTPS 支持所需的 OpenSSL 库。
    zlib1g-dev: Nginx Gzip 模块所需的 zlib 库。
    wget, curl: 用于下载源码包。

安装 LuaJIT 开发包：
这是关键步骤，我们将使用 APT 来安装 LuaJIT。
Bash

sudo apt install -y luajit libluajit-5.1-dev

    luajit: LuaJIT 解释器本身。
    libluajit-5.1-dev: 包含 LuaJIT 的头文件和开发所需的静态库/符号链接。这是 Nginx 编译时链接 LuaJIT 所必需的包。 包名中的 5.1 指的是其兼容的 Lua 版本。在某些发行版或更新的版本中，包名可能略有不同，例如 libluajit2-dev 或直接是 luajit-dev。您可以使用 apt search luajit 来查找确切的包名。

确定 LuaJIT 的安装路径 (关键步骤)：
安装完 libluajit-5.1-dev 后，需要找到其头文件和库文件的实际安装位置。这些路径将在后续 Nginx 配置时使用。

    查找头文件路径 (LUAJIT_INC):
    头文件通常位于 /usr/include/luajit-2.1/ (对于 LuaJIT 2.1.x 版本) 或类似的目录。常见的头文件有 lua.h, luajit.h, lauxlib.h, lualib.h。
    Bash

# 示例查找命令 (根据实际版本调整)
find /usr/include -name luajit.h
# 或者，如果知道确切的包名，可以列出包安装的文件
dpkg -L libluajit-5.1-dev | grep '/usr/include'

通常，libluajit-5.1-dev 会将头文件安装到 /usr/include/luajit-2.1/ (数字会根据 LuaJIT 版本变化)。

查找库文件路径 (LUAJIT_LIB):
共享库文件 (如 libluajit-5.1.so) 通常位于 /usr/lib/[arch-triple]/，例如 /usr/lib/x86_64-linux-gnu/。
Bash

        # 示例查找命令
        find /usr/lib -name libluajit-5.1.so*
        # 或者
        dpkg -L libluajit-5.1-dev | grep '\.so'
        # 也可以使用 ldconfig 查询
        ldconfig -p | grep luajit

        通常，libluajit-5.1.so 会被安装到系统标准库目录之一，如 /usr/lib/x86_64-linux-gnu/。

    记下这些路径。 假设通过上述步骤，我们发现：
        头文件目录为：/usr/include/luajit-2.1/
        库文件目录为：/usr/lib/x86_64-linux-gnu/

    注意： ngx_http_lua_module (以及其他 Lua 相关模块) 通常期望的是一个包含所有 Lua 头文件的目录。如果 luajit.h 和 lua.h 等文件直接位于 /usr/include/luajit-2.1/，那么这个目录就是正确的 LUAJIT_INC。

3.2. 下载 Nginx 和相关 Lua 模块源码

    创建工作目录：
    Bash

mkdir ~/nginx-build
cd ~/nginx-build

下载 Nginx 源码：
访问 Nginx 官方网站 (nginx.org) 获取最新的稳定版 Nginx 源码包链接。
Bash

# 示例版本，请替换为最新稳定版
NGINX_VERSION="1.26.1"
wget https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
tar -zxvf nginx-${NGINX_VERSION}.tar.gz

下载 ngx_devel_kit (NDK) 模块：
ngx_http_lua_module 通常依赖于 NDK。从其 GitHub 仓库下载。
Bash

NDK_VERSION="0.3.3" # 检查最新的兼容版本
wget https://github.com/vision5/ngx_devel_kit/archive/v${NDK_VERSION}.tar.gz -O ndk-v${NDK_VERSION}.tar.gz
tar -zxvf ndk-v${NDK_VERSION}.tar.gz

下载 ngx_http_lua_module 模块：
从其 GitHub 仓库下载。
Bash

    LUA_MODULE_VERSION="0.10.26" # 检查最新的兼容版本
    wget https://github.com/openresty/lua-nginx-module/archive/v${LUA_MODULE_VERSION}.tar.gz -O lua-nginx-module-v${LUA_MODULE_VERSION}.tar.gz
    tar -zxvf lua-nginx-module-v${LUA_MODULE_VERSION}.tar.gz

    重要： 务必检查 ngx_http_lua_module 与您选择的 Nginx 版本以及 APT 源中的 LuaJIT 版本的兼容性。通常，模块的 README 文件会提供相关信息。

3.3. 配置 Nginx 编译选项

进入 Nginx 源码目录，并执行 ./configure 命令。这是最关键的一步，需要正确指定 LuaJIT 的路径。
Bash

cd nginx-${NGINX_VERSION}/

# 设置 LuaJIT 路径环境变量 (根据 3.1 步骤中找到的路径进行替换)
export LUAJIT_INC=/usr/include/luajit-2.1/
export LUAJIT_LIB=/usr/lib/x86_64-linux-gnu/

# 配置 Nginx
# 您可以根据需要添加或修改其他 Nginx 模块和配置参数
./configure \
    --prefix=/opt/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --user=www-data \
    --group=www-data \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-http_v3_module \
    --with-mail \
    --with-mail_ssl_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module \
    --add-dynamic-module=../ngx_devel_kit-0.3.3 \
    --add-dynamic-module=../lua-nginx-module-0.10.26
    # 注意: --add-dynamic-module 的路径是相对于 Nginx 源码目录的
    # 如果想静态编译进去，使用 --add-module

参数解释：

    export LUAJIT_INC=/usr/include/luajit-2.1/: 告诉 ngx_http_lua_module 的配置脚本在哪里查找 LuaJIT 的头文件。
    export LUAJIT_LIB=/usr/lib/x86_64-linux-gnu/: 告诉 ngx_http_lua_module 的配置脚本在哪里查找 LuaJIT 的库文件。
    --add-dynamic-module=../ngx_devel_kit-0.3.3: 将 NDK 编译为动态模块。
    --add-dynamic-module=../lua-nginx-module-0.10.26: 将 Lua 模块编译为动态模块。
    其他 --with-* 参数是标准的 Nginx 编译选项，您可以根据需要调整。--prefix 指定了 Nginx 的安装目录。

如果 ./configure 成功执行，会输出类似以下的信息，表明它找到了 LuaJIT：

checking for LuaJIT library in /usr/lib/x86_64-linux-gnu/ and /usr/include/luajit-2.1/ ... found
checking for LuaJIT version ... 2.1.0-beta3 (or your actual version)

如果看到 "not found" 或版本不匹配的错误，请仔细检查 LUAJIT_INC 和 LUAJIT_LIB 的路径是否正确，以及 LuaJIT 的版本是否被模块支持。
3.4. 编译和安装 Nginx
Bash

make -j$(nproc)  # 使用所有可用的 CPU核心进行并行编译
sudo make install

3.5. 验证 Lua 功能

    配置 Nginx 加载动态模块 (如果编译为动态模块)：
    如果将 Lua 模块编译为动态模块，需要在 Nginx 的主配置文件 (/etc/nginx/nginx.conf 或你 --prefix 指定的路径下的 conf/nginx.conf) 的顶部添加 load_module 指令：
    Nginx

# 根据 --modules-path 指定的路径调整
load_module /usr/lib/nginx/modules/ndk_http_module.so;
load_module /usr/lib/nginx/modules/ngx_http_lua_module.so;

# ... 其他配置 ...

如果编译为静态模块，则无需此步骤。

在 Nginx 配置中添加 Lua 测试代码：
编辑 Nginx 配置文件 (例如 /etc/nginx/sites-available/default 或 /etc/nginx/nginx.conf 中的 http 或 server 块)：
Nginx

http {
    # ...
    lua_package_path "/opt/nginx/lua/?.lua;;"; # 根据你的 Lua 脚本存放位置调整
    lua_package_cpath "/opt/nginx/lua/?.so;;";

    init_by_lua_block {
        ngx.log(ngx.INFO, "LuaJIT initialized in Nginx master process")
    }

    server {
        listen 80;
        server_name localhost;

        location /lua_test {
            default_type 'text/plain';
            content_by_lua_block {
                ngx.say("Hello from LuaJIT in Nginx!")
                ngx.say("LuaJIT Version: ", jit.version)
                ngx.say("Nginx Version: ", ngx.var.nginx_version)
            }
        }

        location /lua_headers {
            default_type 'text/plain';
            content_by_lua_block {
                local h = ngx.req.get_headers()
                for k, v in pairs(h) do
                    ngx.say(k, ": ", v)
                end
            }
        }
    }
    # ...
}

创建 Nginx 使用的缓存目录 (如果配置了)：
根据 ./configure 中的 --http-*-temp-path 参数创建相应的目录并设置权限。
Bash

sudo mkdir -p /var/cache/nginx/client_temp
sudo chown -R www-data:www-data /var/cache/nginx

测试 Nginx 配置并启动：
Bash

sudo /usr/sbin/nginx -t  # 测试配置
sudo systemctl restart nginx # 或者 sudo /usr/sbin/nginx -s reload / sudo /usr/sbin/nginx

如果使用自定义的 --prefix，例如 /opt/nginx，则 Nginx 的可执行文件路径可能是 /opt/nginx/sbin/nginx。

通过浏览器或 curl 访问测试端点：
Bash

    curl http://localhost/lua_test
    curl http://localhost/lua_headers

    如果一切正常，您应该能看到 Lua 脚本的输出。同时检查 Nginx 的错误日志 (/var/log/nginx/error.log) 是否有 init_by_lua_block 中的日志输出。

3.6. 确保运行时动态链接

通常，通过 APT 安装的共享库 (如 libluajit-5.1.so) 会被放置在系统的标准库搜索路径中，并且 ldconfig 会在包安装后运行，更新动态链接器的缓存。

您可以通过以下命令验证 Nginx 二进制文件是否能找到 LuaJIT 库：
Bash

ldd $(which nginx) | grep luajit
# 或者，如果使用自定义 prefix:
# ldd /opt/nginx/sbin/nginx | grep luajit

如果输出显示了正确的 libluajit-5.1.so 路径，则表示运行时链接没有问题。如果没有找到，或者指向了错误的路径，您可能需要：

    确保 /etc/ld.so.conf.d/ 中有包含 LuaJIT 库路径的配置文件，并且已运行 sudo ldconfig。
    在极端情况下（不推荐用于生产环境），可以在启动 Nginx 的脚本中临时设置 LD_LIBRARY_PATH 环境变量，例如：export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/:$LD_LIBRARY_PATH。但更好的做法是确保系统级的动态链接器配置正确。

4. 常见问题与故障排除

    ./configure 报错 "LuaJIT library not found" 或 "LuaJIT version mismatch"：
        原因： LUAJIT_LIB 或 LUAJIT_INC 环境变量未设置，或设置的路径不正确。LuaJIT 版本不被 ngx_http_lua_module 支持。
        解决：
            仔细核对 3.1 步骤中确定的 LuaJIT 头文件和库文件路径，并确保它们已正确导出为环境变量。
            确认头文件目录 (LUAJIT_INC) 直接包含 lua.h, luajit.h 等文件，而不是还有一个子目录。
            检查 ngx_http_lua_module 的文档，确认其与您 APT 源安装的 LuaJIT 版本的兼容性。如果 APT 源的 LuaJIT 版本过旧或过新，您可能需要：
                从源码编译一个兼容版本的 LuaJIT 并指向它。
                寻找与您 LuaJIT 版本兼容的 ngx_http_lua_module 版本。
                考虑使用 OpenResty，它捆绑了测试良好的 Nginx、LuaJIT 和相关模块。

    编译时链接错误 (linker errors)，提及 LuaJIT 函数未定义：
        原因： LUAJIT_LIB 路径不正确，或者指定的库文件不完整或损坏。可能是指向了 .so 文件的符号链接断开，或者实际的 .so 文件不存在于该路径。
        解决：
            确认 LUAJIT_LIB 指向的是包含 libluajit-5.1.so (或类似名称) 的目录。
            使用 ls -l $LUAJIT_LIB/libluajit-5.1.so* 检查文件是否存在且符号链接有效。
            尝试重新安装 libluajit-5.1-dev 包：sudo apt install --reinstall libluajit-5.1-dev。

    Nginx 启动失败，错误日志提示 "cannot open shared object file: No such file or directory" (针对 libluajit-5.1.so)：
        原因： 操作系统在运行时找不到 LuaJIT 的共享库。
        解决：
            运行 sudo ldconfig -v 并检查输出中是否包含了 LuaJIT 库的路径。
            确保 LuaJIT 库文件所在的目录（例如 /usr/lib/x86_64-linux-gnu/）存在于 /etc/ld.so.conf 或 /etc/ld.so.conf.d/ 下的某个配置文件中。通常，libc.conf 或特定于架构的配置文件（如 x86_64-linux-gnu.conf）会包含标准库路径。
            如果修改了 ld.so.conf.d，务必运行 sudo ldconfig 来更新缓存。
            作为临时测试手段，可以在启动 Nginx 前设置 LD_LIBRARY_PATH，但不推荐用于生产。

    Lua 脚本执行错误，提示找不到 Lua 模块 (如 require "cjson" 失败)：
        原因： Nginx 配置中的 lua_package_path 或 lua_package_cpath 未正确设置，或者所需的 Lua 模块未安装在这些路径下。
        解决：
            在 Nginx 的 http 块中正确设置 lua_package_path (对于纯 Lua 模块) 和 lua_package_cpath (对于 C 编写的 Lua 模块)。
            确保您尝试 require 的 Lua 模块已安装到 lua_package_path 或 lua_package_cpath 指定的目录中。对于 APT 安装的 Lua 模块 (例如 lua-cjson)，它们通常安装在系统路径下，可能需要将系统路径也加入到 Nginx 的搜索路径中，例如：
            Nginx

        lua_package_path "/opt/nginx/lua/?.lua;/usr/share/lua/5.1/?.lua;/usr/share/lua/5.1/?/init.lua;;";
        lua_package_cpath "/opt/nginx/lua/?.so;/usr/lib/x86_64-linux-gnu/lua/5.1/?.so;;";

        路径中的 5.1 应与 LuaJIT 兼容的 Lua 版本一致。

使用 pkg-config (替代方案)：
如果 libluajit-5.1-dev 包正确安装了 luajit.pc 文件 (通常位于 /usr/lib/x86_64-linux-gnu/pkgconfig/ 或 /usr/share/pkgconfig/)，并且 pkg-config 工具已安装 (sudo apt install pkg-config)，某些版本的 ngx_http_lua_module 可能能够自动利用它。
你可以通过运行以下命令来测试 pkg-config 是否能找到 LuaJIT：
Bash

    pkg-config --cflags luajit
    pkg-config --libs luajit

    如果这些命令能输出正确的编译和链接标志，那么理论上，如果 ngx_http_lua_module 的配置脚本支持，你可能不需要手动设置 LUAJIT_INC 和 LUAJIT_LIB。然而，显式设置这两个环境变量通常更为可靠，因为并非所有版本的模块都优先或正确使用 pkg-config。如果模块的文档明确推荐使用 pkg-config，则可以尝试不设置 LUAJIT_INC/LIB，并确保 PKG_CONFIG_PATH 环境变量（如果需要）指向了包含 luajit.pc 的目录。

5. 最佳实践与替代方案
最佳实践

    明确版本控制： 记录下您使用的 Nginx、ngx_devel_kit、ngx_http_lua_module 以及通过 APT 安装的 LuaJIT (luajit -v 和 dpkg -s libluajit-5.1-dev) 的确切版本。这在未来升级或排查问题时至关重要。
    使用最新的稳定版本： 尽量选择 Nginx 和相关 Lua 模块的最新稳定版本，它们通常包含错误修复和性能改进，并可能对较新版本的 LuaJIT 有更好的支持。
    查阅模块文档： 在编译前，务必仔细阅读 ngx_http_lua_module 和 NDK 的官方文档，特别是关于依赖和编译说明的部分。
    最小化编译选项： 初次尝试时，可以先使用最少的 Nginx 模块进行编译，以排除其他模块可能引入的干扰。成功后再逐步添加所需模块。
    一致的开发与生产环境： 尽量确保开发、测试和生产环境中使用相同版本和来源的 LuaJIT，以避免环境差异导致的问题。
    考虑构建自定义包： 对于生产环境，将编译好的 Nginx (包含 LuaJIT 依赖) 打包成 .deb 或 .rpm 包，可以简化部署和版本管理。

替代方案

    使用 OpenResty：
    OpenResty 是一个基于 Nginx 并集成了大量常用 Lua 模块 (包括 LuaJIT) 的 Web 平台。它由 ngx_http_lua_module 的原作者维护，提供了经过良好测试和优化的 Nginx + LuaJIT + 模块组合。OpenResty 通常会自行编译和捆绑特定版本的 LuaJIT。
        优点： 开箱即用，免去了手动编译和处理依赖兼容性的麻烦，社区活跃，文档丰富。
        缺点： 更新可能滞后于最新的 Nginx 主线版本，捆绑了许多模块，即使你可能只需要其中一部分。
        安装： OpenResty 提供了自己的 APT 源，可以方便地通过 apt install openresty 安装。

    从源码编译 LuaJIT：
    如果您需要特定版本的 LuaJIT，或者希望对其编译选项有更多控制，可以从 LuaJIT 官网 (luajit.org) 下载源码并自行编译安装。然后，在 Nginx 配置时将 LUAJIT_INC 和 LUAJIT_LIB 指向您自己编译的 LuaJIT 安装路径。
        优点： 完全控制 LuaJIT 版本和编译参数。
        缺点： 增加了编译和管理的复杂性，需要自行处理 LuaJIT 的更新。

    使用 Docker 容器：
    可以利用预构建的包含 Nginx 和 LuaJIT 的 Docker 镜像 (例如 OpenResty 官方镜像，或由社区维护的 Nginx+Lua 镜像)，或者在 Dockerfile 中封装上述编译过程。
        优点： 环境隔离，部署一致性，简化依赖管理。
        缺点： 需要熟悉 Docker。

6. 结论

在自己编译 Nginx 时集成 Lua 功能并依赖 APT 源中的 LuaJIT 是一种可行且能简化部分依赖管理的方法。关键在于正确识别 APT 安装的 LuaJIT 头文件和库文件的路径，并通过环境变量 (LUAJIT_INC, LUAJIT_LIB) 告知 Nginx 的 Lua 模块编译脚本。同时，确保 Nginx 在运行时能够找到 LuaJIT 的共享库也至关重要。

虽然这种方法比从源码编译所有依赖（包括 LuaJIT）要简单一些，但仍然需要仔细处理路径配置和版本兼容性。对于追求更便捷、更集成体验的用户，OpenResty 提供了一个优秀的替代方案。而对于需要高度定制或特定版本控制的场景，从源码编译 LuaJIT 也是一个选项。

通过遵循本报告中概述的步骤和建议，开发者应该能够成功地在自编译的 Nginx 中启用强大的 Lua 脚本功能，同时利用系统包管理器来维护 LuaJIT 这一核心依赖。
