---
tags:
  - "#networking"
  - "#protocol-analysis"
  - "#network-architecture-analysis"
  - "#protocol-evaluation"
  - "#tor-network"
  - "#network-security"
  - "#anonymity"
  - "#private-network"
  - "#traffic-analysis"
created: 2025-06-25
---
# 构建与控制私有Tor网络：技术指南与安全分析

## 引言

本报告旨在深入探讨构建一个私有的、隔离的Tor网络，并实现自动化电路切换这一高级技术挑战。公共Tor网络是一个精密、去中心化的系统，其设计目标是通过混淆用户与其网络活动之间的关联来提供匿名性 1。其安全属性源于其庞大的规模、节点的多样性以及广泛的用户基础。在私有环境中复制此架构是一项艰巨的任务，并伴随着深刻的安全影响。本文档具有双重目的：首先，作为一份详尽的技术指南，指导如何构建和控制私有Tor网络；其次，作为一份严谨的安全分析报告，严格审视此类部署中的匿名性保障——或其缺失。我们将探究必要的配置、自动化技术，并最终剖析为何一个私有Tor网络，尽管在技术上颇具吸引力，却与实现个人匿名的目标背道而驰。
---

## 第一部分：Tor网络架构的基础原理

在深入探讨构建私有网络的具体步骤之前，必须首先理解其所模仿的公共Tor网络的架构基础和运行机制。这一理论基础对于理解后续章节的配置指令以及安全风险分析至关重要。

### 1.1 核心组件：信任与去中心化的交响曲

Tor网络并非一个单一的实体，而是由多种不同角色的组件协同工作，共同构成一个复杂的匿名通信系统 3。

* **Tor客户端 (Onion Proxies):** 客户端是用户进入Tor网络的入口点。客户端软件负责从目录服务器获取网络状态信息，构建加密电路，并处理多层加密过程 3。它通常在用户本地运行，并向Tor浏览器等应用程序提供一个SOCKS代理接口 5。
* **目录权威 (Directory Authorities, DAs):** 目录权威是一小组被硬编码在Tor客户端中的、高度可信的服务器，扮演着网络“公证人”的角色 1。目前，公共网络中有九个目录权威节点 1。它们周期性地对网络状态进行投票——例如哪些中继正在运行、它们的属性（如带宽、出口策略）等——并发布一份经过数字签名的“共识”文档。这份共识文档是客户端用来构建电路的权威性网络地图 3。这种设计虽然引入了中心化信任点，但对于维持网络状态的一致性和抵御大规模节点操控攻击至关重要。若大多数目录权威被攻破，攻击者便可能通过发布恶意共识来控制整个网络的视图，这被称为“共识攻击” 1。
* **中继 (Relays/Nodes/Routers):** 中继是由全球志愿者运行的服务器，它们是构成网络骨干的节点 2。根据其在电路中的位置，中继被分为不同类型：
  * **守卫中继 (Guard/Entry Relays):** 这是用户电路的第一跳。守卫中继能够看到用户的真实IP地址，但无法知晓最终的通信目的地 4。为了防范某些特定攻击（如通过控制大量中继来增加成为用户入口节点的概率），客户端会选择一小组长期固定的守卫中继 10。
  * **中间中继 (Middle Relays):** 这是电路的第二跳（以及任何后续的非出口跳）。它只知道前一跳中继和后一跳中继的IP地址，从而在入口和出口之间提供了一个关键的隔离层 4。
  * **出口中继 (Exit Relays):** 这是电路的最后一跳。它负责连接到用户请求的、位于公共互联网上的目标服务器。出口中继知道通信的目的地，但不知道发起请求的原始用户IP地址 4。值得注意的是，流量在离开出口中继后，Tor的加密便已解除。因此，为了保护通信内容的机密性，必须依赖如HTTPS这样的端到端加密协议 11。

### 1.2 洋葱路由协议：分层匿名

Tor的核心技术是“洋葱路由”（Onion Routing），它通过多层加密来保护通信路径 1。

1. **电路构建:** 客户端首先从目录权威获取一份最新的网络共识文档，然后从中选择三个中继（守卫、中间、出口）来构建一条“电路” 4。
2. **分层加密:** 在发送数据之前，客户端会像剥洋葱一样，对数据包进行层层加密。它首先使用出口中继的公钥加密数据，然后用中间中继的公钥加密上一步的结果，最后再用守卫中继的公钥加密整个数据包 2。
3. **数据传输:** 当这个“洋葱”数据包被发送出去后，它会沿着预先构建的电路传输。
   * 守卫中继收到数据包后，用自己的私钥解开最外层加密，从而获知下一跳是中间中继。
   * 中间中继收到后，同样解开属于它的那一层加密，获知下一跳是出口中继。
   * 最后，出口中继解开最后一层加密，得到原始数据，并将其发送到最终的目标服务器。
     在整个过程中，每个中继都只知道数据包的直接来源和直接去向，没有任何一个节点能够同时知道用户的真实IP和最终目的地，从而实现了路径的匿名化 1。

### 1.3 网络共识与描述符

为了让整个网络协同工作，Tor建立了一套完善的信息发布和同步机制。

* **描述符 (Descriptor):** 每个中继都会生成一份签名的“描述符”，其中包含了它的IP地址、端口、公钥、出口策略等信息。中继将这份描述符上传给目录权威，以宣告自身的存在和配置 7。
* **共识生成:** 目录权威们每小时会收集所有中继的描述符，并通过投票过程达成一份“共识” 1。这份共识文档包含了网络中所有活跃中继的摘要信息，并由大多数目录权威共同签名以确保其真实性和完整性。客户端在启动和运行过程中会定期下载这份共识，以保持对网络状态的“实时”了解，从而能够选择有效的中继来构建电路 3。

这一系列机制共同构成了Tor网络的基础。它并非一个纯粹的去中心化系统，而是依赖于一小组中心化的目录权威来建立信任和协调网络状态。在构建私有网络时，创建者实际上是承担了这组目录权威的角色，建立了一个由自己集中管理的、模仿去中心化架构的系统。这一点对于理解私有网络的威胁模型至关重要。
---

## 第二部分：构建私有Tor网络的分步指南

本节将提供一份详尽的实践指南，旨在回答用户关于如何构建私有Tor网络的问题。我们将以Tor项目官方的测试工具Chutney为模型，来理解所需组件和配置，这些原理可以从本地测试环境推广到多服务器的实际部署中。

### 2.1 框架与先决条件：Chutney及其他

* **Chutney简介:** Chutney是Tor项目开发的一个工具，专门用于在本地快速创建私有的Tor测试网络，以供开发者进行协议实验和功能测试 12。它能够根据预设的模板，自动生成所有节点的密钥、证书和torrc配置文件。
* **先决条件:** 部署私有网络需要安装tor守护进程本身，以及tor-gencert工具。tor-gencert用于为私有的目录权威生成必要的加密材料，如身份密钥和证书 13。在大多数Linux发行版中，这些工具可以通过包管理器安装，或从源码编译获得 15。
* **部署模型:** Chutney通常在单台机器上运行，通过不同的端口来区分不同的Tor节点进程 12。然而，其配置原理完全可以应用于一个“真实的”私有网络，即在多台虚拟机（VPS）上部署不同的节点 16。区别仅在于配置文件中的IP地址将是各台VPS的地址，而非127.0.0.1。

### 2.2 生成网络密钥与证书

私有网络的核心在于拥有一套自己控制的目录权威。以下是创建这些权威所需加密材料的步骤：

1. **生成身份密钥:** 为每一个计划中的目录权威（通常至少需要3个以便投票）生成一个主身份密钥。
   Bash
   tor-gencert --create-identity-key -m \<months\>

   这会在当前目录下创建一个名为authority_identity_key的密钥文件。你需要为每个DA节点重复此步骤，并将生成的密钥文件分别存放在对应节点的配置目录中。
2. **获取密钥指纹:** 生成密钥后，需要获取其指纹，这将在后续步骤和配置中用到。
   Bash
   tor --list-fingerprint --datadir /path/to/da1/keys/

   其中/path/to/da1/keys/是存放上一步生成的authority_identity_key的目录。
3. **生成权威证书:** 每个目录权威都需要一个由自身和其他权威共同认可的证书。此步骤建立了DA之间的信任关系。
   Bash
   tor-gencert --create-cert -i /path/to/da1/keys/authority_identity_key -a \<DA2_IP\>:\<DA2_DirPort\> -a \<DA3_IP\>:\<DA3_DirPort\>...

   你需要为每个DA重复此操作，并提供其他所有DA的IP地址、目录端口和身份密钥指纹。这一过程体现了目录权威之间相互依赖的信任模型 12。

### 2.3 目录权威配置 (torrc)

目录权威的torrc文件是私有网络的心脏。以下是一份示例配置及其关键参数解释：

Ini, TOML

\# DA1的torrc示例
DataDirectory /var/lib/tor/da1
ORPort 9001
DirPort 7001
Address 10.0.0.1 \# DA1的IP地址

\# --- 权威目录特定配置 ---
AuthoritativeDirectory 1
ContactInfo YourName \<your@email.com\>
Nickname DA1

\# --- 投票与共识配置 ---
\# 列出网络中所有的目录权威（包括自身）
\# 格式: DirAuthority \<nickname\> \<flags\> v3ident=\<fingerprint\> \<ip\>:\<dirport\> \<orport\>
DirAuthority DA1 v3ident=FINGERPRINT1 10.0.0.1:7001 9001
DirAuthority DA2 v3ident=FINGERPRINT2 10.0.0.2:7002 9002
DirAuthority DA3 v3ident=FINGERPRINT3 10.0.0.3:7003 9003

\# --- 测试网络特定配置 ---
TestingTorNetwork 1
TestingV3AuthInitialVotingInterval 5 \# 单位：秒
TestingV3AuthVoteDelay 2 \# 单位：秒
TestingV3AuthDistDelay 2 \# 单位：秒
TestingV3AuthVotingSignatureDelay 2 \# 单位：秒

* AuthoritativeDirectory 1: 声明此节点是一个目录权威。
* DirAuthority...: 这是最关键的配置。它完全替换了Tor内置的公共目录权威列表，强制此节点只信任和连接你指定的私有权威 17。你需要列出网络中所有的DA。
* TestingTorNetwork 1: 一个至关重要的标志，它会放宽Tor的许多严格检查（例如，允许在私有IP地址上运行中继），使得在受控环境中搭建小型网络成为可能 17。
* TestingV3Auth...系列参数: 这些参数将共识投票的间隔从数小时急剧缩短到几秒钟，这对于让一个小型私有网络快速形成共识至关重要 12。

### 2.4 中继配置 (torrc)

私有网络中的中继节点（包括中间和出口）也需要特殊配置，以确保它们能正确地加入你的私有网络。

Ini, TOML

\# 中继的torrc示例
DataDirectory /var/lib/tor/relay1
ORPort 9001
Address 10.0.1.1 \# 中继的IP地址
Nickname MyPrivateRelay

\# --- 核心配置：指向私有目录权威 ---
\# 只列出你的私有DAs
DirAuthority 10.0.0.1:7001 FINGERPRINT1
DirAuthority 10.0.0.2:7002 FINGERPRINT2
DirAuthority 10.0.0.3:7003 FINGERPRINT3

\# --- 出口策略 ---
\# 作为中间中继，拒绝所有出口请求
ExitPolicy reject *:*
\# 或者，作为出口中继，允许所有出口请求
\# ExitPolicy accept *:*

\# --- 其他推荐配置 ---
SocksPort 0 \# 中继节点不应作为客户端代理
ContactInfo YourName \<your@email.com\>
TestingTorNetwork 1

* DirAuthority...: 与DA配置类似，这是中继配置中最关键的部分。它必须只指向你的私有目录权威，确保该中继向你的私有网络注册并从中获取网络信息，而不是公共网络。
* Address \<IP\>: 由于Tor默认不宣告私有IP地址，因此在私有网络环境中，必须明确设置此参数 17。
* ExitPolicy: 定义该中继是否允许流量离开Tor网络访问公共互联网。reject *:*表示它是一个中间中继，accept *:*表示它是一个出口中继 18。
* SocksPort 0: 禁用SOCKS代理是中继节点的最佳实践，以防止其被误用 18。

### 2.5 客户端配置 (torrc)

最后，客户端也需要被配置为仅使用你的私有网络。

Ini, TOML

\# 客户端的torrc示例
DataDirectory /var/lib/tor/client1
SocksPort 9050

\# --- 核心配置：指向私有目录权威 ---
DirAuthority 10.0.0.1:7001 FINGERPRINT1
DirAuthority 10.0.0.2:7002 FINGERPRINT2
DirAuthority 10.0.0.3:7003 FINGERPRINT3

\# --- 其他推荐配置 ---
UseBridges 0 \# 确保不尝试使用公共网桥
TestingTorNetwork 1

* DirAuthority...: 同样，客户端的torrc文件必须被配置为仅信任你的私有目录权威。这是将其与公共Tor网络隔离的关键。
* UseBridges 0: 明确禁用网桥，因为我们的目标是连接到一个完全独立的网络。

为了便于参考，下表总结了在构建私有Tor网络时至关重要的torrc参数。

| 参数 | 在私有网络中的作用 | 示例值 | 适用对象 |
| :---- | :---- | :---- | :---- |
| TestingTorNetwork | 放宽限制（如允许私有IP），使小型测试网络能正常运行。 | TestingTorNetwork 1 | 所有节点 |
| AuthoritativeDirectory | 将节点指定为目录权威。 | AuthoritativeDirectory 1 | 目录权威 |
| V3AuthVotingInterval | 大幅缩短目录权威之间的共识投票间隔。 | V3AuthVotingInterval 5 seconds | 目录权威 |
| DirAuthority | 定义可信的目录权威集合，取代公共网络的默认设置。 | DirAuthority da1... | 所有节点 |
| Address | 显式设置宣告的IP地址，对于私有IP上的中继是必需的。 | Address 10.0.1.1 | 中继 |
| ExitPolicy | 决定一个中继是否作为出口节点。 | ExitPolicy reject *:* | 中继 |
| SocksPort | 启用或禁用本地SOCKS代理接口。 | SocksPort 9050 (客户端), SocksPort 0 (中继) | 客户端, 中继 |
| PublishServerDescriptor | 阻止中继/网桥的描述符被发布给权威。 | PublishServerDescriptor 0 | 中继 (用于私有网桥) |

---

## 第三部分：实现自动化电路切换

本部分将直接回应用户关于实现“自动跳点切换”的需求，通过解释和演示多种控制Tor电路生命周期的方法，从基于配置的轮换到程序化控制。

### 3.1 理解Tor的电路生命周期

Tor客户端的行为并非为每一个网络请求都建立一条全新的电路。相反，它维护着一个电路池以提高效率。

* **预先构建:** Tor客户端会主动预先构建一个“干净”（clean）电路的池，以便能够快速处理新的连接请求 10。
* **变“脏”:** 一旦一个数据流（例如，一次网站访问）被附加到某条电路上，该电路就会被标记为“肮脏”（dirty）10。
* **轮换与销毁:** “肮脏”的电路在经过一段时间后，将不再被用于处理*新的*数据流请求。当所有在该电路上的活动都结束后，这条电路最终会被关闭和销毁 10。例如，Tor浏览器默认大约每10分钟会为新的网站连接选择一条新的随机电路 4。

### 3.2 基于配置的轮换：MaxCircuitDirtiness 与 NewCircuitPeriod

通过修改torrc文件，可以实现被动、自动的电路轮换。

* **MaxCircuitDirtiness \<seconds\>:** 这是控制电路轮换最主要的参数。它定义了一条“肮脏”电路可以被用来附加*新*数据流的最长持续时间。其默认值是600秒（10分钟）20。如果将此值设为MaxCircuitDirtiness 0，则会强制Tor为每一个新的连接请求都建立一条全新的电路 20。
* **NewCircuitPeriod \<seconds\>:** 此参数控制Tor*考虑*建立新电路的频率，无论这些电路是否被立即需要 20。它更像一个周期性的检查，以确保干净电路池的健康和充足。在不同的文档和上下文中，其默认值常被引用为15或30秒 22。

**两者关系与效果:** MaxCircuitDirtiness直接控制了一条已使用电路对新请求的“有效期”，从而直接影响*必须*使用新电路的频率。而NewCircuitPeriod则更多地关注主动*创建*新电路以补充电路池。对于用户而言，将MaxCircuitDirtiness设置为一个较小的值是提高访问不同网站时“跳点”频率最直接的方法。

### 3.3 按需控制：Tor控制协议

Tor提供了一个控制端口（Control Port），通常是9051（或Tor浏览器的9151），允许外部应用程序与正在运行的Tor进程进行交互和控制 5。

* **启用与认证:** 为了安全地使用控制端口，必须在torrc中启用它，并配置一种认证方式，如HashedControlPassword或CookieAuthentication 5。
* **基本命令:** 控制协议的命令通常以COMMAND argument\r\n的形式发送，并会收到如250 OK这样的状态码作为响应 26。

### 3.4 SIGNAL NEWNYM 命令：强制更换身份

SIGNAL NEWNYM是控制协议中一个非常重要的命令，它指示Tor切换到一个全新的身份 27。

* **功能:** 当Tor收到SIGNAL NEWNYM命令后，它会关闭所有现存的干净电路，并将所有肮脏电路标记为不再接受新数据流。未来的所有请求都将通过全新构建的电路进行。此外，它还会清除客户端的DNS缓存 28。
* **重要细节:** 这个命令并*不会*立即中断在肮脏电路上的现有活动连接。这些连接将继续使用旧路径，直到它们自然关闭。这一点常常被误解 29。
* **速率限制:** 为了防止网络滥用，Tor会有意地对NEWNYM请求进行速率限制。过于频繁地发送此信号将导致Tor延迟处理 26。

### 3.5 使用Python与Stem库实现自动化

对于需要精确和程序化控制电路切换的场景，可以使用Tor项目官方的Python库Stem。

* **Stem简介:** Stem是一个功能强大的Python库，专门用于通过控制协议来编写脚本和控制Tor 25。
* **自动化教程:** 以下是一个简单的Python脚本，演示了如何实现用户所期望的自动化“跳点”功能。
  1. **安装依赖:**
     Bash
     pip install requests[socks] stem

     32
  2. **Python脚本实现自动切换:**
     Python
     import time
     from stem import Signal
     from stem.control import Controller

     def switch_tor_identity():
         """
         连接到Tor控制端口并发送SIGNAL NEWNYM命令。
         """
         try:
             \# 默认控制端口为9051
             with Controller.from_port(port=9051) as controller:
                 \# 如果设置了密码，在此处提供
                 \# controller.authenticate(password="your_password")
                 controller.authenticate()

                 controller.signal(Signal.NEWNYM)
                 print("Successfully requested a new Tor identity (new circuit).")

         except Exception as e:
             print(f"Error switching Tor identity: {e}")

     if __name__ == "__main__":
         \# 每隔60秒自动切换一次电路
         while True:
             switch_tor_identity()
             print("Waiting for 60 seconds before next switch...")
             time.sleep(60)

     此脚本通过stem.control.Controller连接到控制端口并进行认证 25，然后使用controller.signal(Signal.NEWNYM)发送切换身份的信号 25。通过一个while循环，即可实现周期性的自动化电路切换。

下表对比了不同的电路轮换控制机制，以帮助用户根据需求选择最合适的方法。

| 机制 | 方法 | 控制级别 | 粒度 | 主要用例 |
| :---- | :---- | :---- | :---- | :---- |
| torrc 配置 | MaxCircuitDirtiness | 被动 | 基于时间（例如，新数据流每X秒） | 一般的匿名性保健，随时间缓慢轮换身份。 |
| torrc 配置 | NewCircuitPeriod | 被动 | 基于时间（主动电路构建） | 维持一个健康的干净电路池。 |
| 控制协议 | SIGNAL NEWNYM | 主动 | 按需（立即） | 程序化控制，为特定任务（如网络爬虫）进行战术性身份更换。 |

---

## 第四部分：私有Tor网络的严谨安全分析

本部分是报告的核心，旨在提供一份毫不妥协的专家级分析，阐明为何为个人匿名目的而构建私有Tor网络是一个存在根本性缺陷且危险的概念。

### 4.1 匿名集：Tor安全的基石

* **学术定义:** 匿名的本质是在一个特定的主体集合（即“匿名集”）中无法被识别 34。在Tor的语境下，这意味着你的网络流量与成千上万其他用户的流量混合在一起，从而创造出一个可以藏身的“人群” 38。
* **规模的力量:** 公共Tor网络的安全性与其用户基础和中继节点的规模及多样性成正比 9。拥有数百万用户和数千个中继，使得任何对手都难以将特定用户的流量从巨大的背景噪音中区分出来。正如一句格言所说：“匿名性偏爱同伴”（Anonymity loves company）42。

### 4.2 私有匿名的悖论：一个人的狂欢

* **匿名集的坍缩:** 在一个仅有单个用户（即创建者本人）的私有网络中，匿名集的大小为1。这意味着，在该网络上观察到的任何流量都*只能*属于这唯一的用户 43。
* **合理否认性的丧失:** Tor的全部意义在于让你的流量看起来可能来自任何其他Tor用户。在一个私有网络中，没有“其他用户”。所有的流量都可以被确证为你本人的流量。这完全违背了匿名的初衷 43。
* **让自己成为目标:** 使用非标准的网络配置会让你在任何外部观察者眼中变得独一无二，从而更容易被识别 43。进出你的私有中继IP的流量模式与正常的Tor流量不同，这会引起ISP或其他网络监控者的注意。

### 4.3 端到端关联攻击的必然性

* **攻击原理:** 端到端关联攻击（或称流量确认攻击）指的是攻击者同时观察进入Tor网络的流量（从用户到守卫中继）和离开Tor网络的流量（从出口中继到目标服务器）。通过关联两端流量的时间、数据量和模式特征，攻击者可以将用户与其访问的目的地联系起来，从而实现去匿名化 1。
* **颠倒的威胁模型:**
  * **在公共Tor网络中:** 这种攻击是概率性的、困难的。攻击者必须在数千个可能的中继中，同时控制或监视到用户某条特定电路所使用的*入口守卫*和*出口节点* 39。
  * **在私有Tor网络中:** 在一个由你构建和控制的私有网络里，*你本人就是那个无所不能的攻击者*。你对100%的节点拥有完美的可见性。你可以清晰地看到流量进入你的“守卫节点”，并从你的“出口节点”流出。这种关联不再是概率性的，而是**确定性的、轻而易举的**。你实际上构建了一个完美的、用于监视自己流量的系统 12。

### 4.4 合理用例 vs. 匿名性误区

必须强调，私有Tor网络在特定、非匿名的场景下是极其有价值的工具：

* **学术研究与协议开发:** 用于研究网络动态、测试新的防御机制或开发新功能，而不会干扰实时网络 12。
* **应用程序测试:** 在受控环境中确保某个应用程序（如聊天客户端或网站）能够正确地通过Tor协议工作 12。
* **沙箱与恶意软件分析:** 在隔离的沙箱中分析恶意软件如何利用Tor进行命令与控制（C2）通信 53。

然而，一个常见的误解是，认为通过租用几台VPS搭建一个私有网络可以比使用公共网络更安全地匿名化自己的流量。这种想法源于对Tor匿名性来源的根本性误解 16。Tor安全性的核心保障并非孤立的加密或路由协议，而是由庞大、多样且不受单一实体控制的匿名集所提供的统计噪声和掩护流量。私有网络恰恰消除了这个匿名集，从而使其安全保障失效。
下表直观地总结了使用公共Tor网络与自建私有网络在安全态势上的天壤之别。

| 安全属性 | 公共Tor网络 | 私有Tor网络 (单一用户) |
| :---- | :---- | :---- |
| 匿名集大小 | 巨大 (数百万用户) | 1 |
| 运营者多样性 | 高 (数千个独立志愿者) | 1 (你自己) |
| 流量关联攻击脆弱性 | 概率性且困难；需要强大且位置优越的对手。 | 确定性且轻而易举；你自己就是对手。 |
| 信任模型 | 分布式信任，跨越众多节点；无单点知晓完整路径。 | 集中式信任于你自己；你拥有上帝视角，可观察完整路径。 |
| 合理否认性 | 高 (流量可能来自任何其他Tor用户)。 | 无 (流量可被证实为你本人的)。 |
| 主要用例 | 个人匿名、绕过审查 | 协议研究、软件测试、沙箱环境 |

---

## 结论

本报告提供了一份关于构建和控制私有Tor网络的详尽专家级指南。我们详细阐述了从为目录权威生成加密材料到使用特定torrc参数配置各个节点的完整步骤。此外，报告还演示了如何通过被动配置（MaxCircuitDirtiness）和主动的程序化控制（通过Python Stem库发送SIGNAL NEWNYM命令）来实现用户所要求的“自动跳点切换”功能。
然而，本分析最关键的结论是基于安全性的。尽管在技术上构建一个私有Tor网络是完全可行的，但若将其用于实现个人匿名，则在根本上是不安全的。Tor提供的匿名性并非其协议本身的固有属性，而是源于公共网络中庞大而多样的“匿名集”所产生的涌现属性。通过创建一个私有网络，使用者将这个匿名集缩小到仅自己一人，这使得网络上的所有活动都可被轻易关联，从而完全抵消了该系统的主要安全目标。对于公共网络而言极具挑战性的端到端流量关联攻击，在私有网络中变成了一个简单的观察问题。
因此，我们最终的专家建议是明确无误的：私有Tor网络是用于研究、开发和测试的宝贵工具。**任何情况下都不应以获取个人隐私或匿名性为目的来构建或使用它**。真正的网络匿名性并非存在于一个小型、可控的花园中，而是存在于全球Tor网络那个混乱、拥挤但公开的广场之上。

#### 引用的著作

1. Tor (network) - Wikipedia, 访问时间为 六月 25, 2025， [https://en.wikipedia.org/wiki/Tor_(network)](https://en.wikipedia.org/wiki/Tor_(network))
2. (PDF) Tor Network Architecture, Anonymity and Hidden Services - ResearchGate, 访问时间为 六月 25, 2025， [https://www.researchagate.net/publication/371711324_Tor_Network_Architecture_Anonymity_and_Hidden_Services](https://www.researchgate.net/publication/371711324_Tor_Network_Architecture_Anonymity_and_Hidden_Services)
3. System Architecture of the Tor network | Download Scientific Diagram - ResearchGate, 访问时间为 六月 25, 2025， [https://www.researchgate.net/figure/System-Architecture-of-the-Tor-network_fig1_277065147](https://www.researchgate.net/figure/System-Architecture-of-the-Tor-network_fig1_277065147)
4. Demystifying the Dark Web: An Introduction to Tor and Onion Routing - ITP - NYU, 访问时间为 六月 25, 2025， [https://itp.nyu.edu/networks/explanations/demystifying-the-dark-web-an-introduction-to-tor-and-onion-routing/](https://itp.nyu.edu/networks/explanations/demystifying-the-dark-web-an-introduction-to-tor-and-onion-routing/)
5. tor(1) - Arch Linux manual pages, 访问时间为 六月 25, 2025， [https://man.archlinux.org/man/tor.1.en](https://man.archlinux.org/man/tor.1.en)
6. Tor and the Tor Network: Hidden evil or privacy protector? - SolCyber, 访问时间为 六月 25, 2025， [https://solcyber.com/tor-and-the-tor-network-hidden-evil-or-privacy-protector/](https://solcyber.com/tor-and-the-tor-network-hidden-evil-or-privacy-protector/)
7. Directory authorities and consensus : r/TOR - Reddit, 访问时间为 六月 25, 2025， [https://www.reddit.com/r/TOR/comments/lja69j/directory_authorities_and_consensus/](https://www.reddit.com/r/TOR/comments/lja69j/directory_authorities_and_consensus/)
8. A Pirate's Guide to Privacy: Tor and Tails: A way to go forward. - , 访问时间为 六月 25, 2025， [https://uspirates.org/a-pirates-guide-to-privacy-tor-and-tails-a-way-to-go-forward/](https://uspirates.org/a-pirates-guide-to-privacy-tor-and-tails-a-way-to-go-forward/)
9. The Dark Web Browser: What Is Tor, Is it Safe, and How Do You Use It? - Avast, 访问时间为 六月 25, 2025， [https://www.avast.com/c-tor-dark-web-browser](https://www.avast.com/c-tor-dark-web-browser)
10. When we build - Tor Specifications, 访问时间为 六月 25, 2025， [https://spec.torproject.org/path-spec/when-we-build.html](https://spec.torproject.org/path-spec/when-we-build.html)
11. An Analysis of the Security Risks Posed by Tor Browser, 访问时间为 六月 25, 2025， [https://www.cyberproof.com/blog/an-analysis-of-the-security-risks-posed-by-tor-browser/](https://www.cyberproof.com/blog/an-analysis-of-the-security-risks-posed-by-tor-browser/)
12. Private Tor Network: Chutney - antiTree, 访问时间为 六月 25, 2025， [https://www.antitree.com/2014/04/15/private-tor-network-chutney/](https://www.antitree.com/2014/04/15/private-tor-network-chutney/)
13. Getting Started With Tor Development - gtank writes here - George Tankersley, 访问时间为 六月 25, 2025， [https://blog.gtank.cc/tor-dev-101/](https://blog.gtank.cc/tor-dev-101/)
14. DonnchaC/chutney: The chutney tool for testing and automating Tor network setup - GitHub, 访问时间为 六月 25, 2025， [https://github.com/DonnchaC/chutney](https://github.com/DonnchaC/chutney)
15. How to install and run the Tor service in windows ? (windows v.10) - Stack Overflow, 访问时间为 六月 25, 2025， [https://stackoverflow.com/questions/68710861/how-to-install-and-run-the-tor-service-in-windows-windows-v-10](https://stackoverflow.com/questions/68710861/how-to-install-and-run-the-tor-service-in-windows-windows-v-10)
16. how to create your own tor network using multiple vps server, 访问时间为 六月 25, 2025， [https://www.offshorecorptalk.com/threads/how-to-create-your-own-tor-network-using-multiple-vps-server.42372/](https://www.offshorecorptalk.com/threads/how-to-create-your-own-tor-network-using-multiple-vps-server.42372/)
17. Private tor network on kubernetes - Andy Smith's Blog, 访问时间为 六月 25, 2025， [https://andrewmichaelsmith.com/2017/03/private-tor-network-on-kubernetes/](https://andrewmichaelsmith.com/2017/03/private-tor-network-on-kubernetes/)
18. Example torrc for Relays - GitHub Gist, 访问时间为 六月 25, 2025， [https://gist.github.com/brianlechthaler/4210f5c633533ff4572d9724d4bfbea8](https://gist.github.com/brianlechthaler/4210f5c633533ff4572d9724d4bfbea8)
19. Setting Up Tor Relay Nodes - A Complete Guide - xTom, 访问时间为 六月 25, 2025， [https://xtom.com/blog/setting-up-tor-relay-nodes/](https://xtom.com/blog/setting-up-tor-relay-nodes/)
20. Tutorial • Tor • Configuration - OmniMix, 访问时间为 六月 25, 2025， [https://www.danner-net.de/omom/tutortorconfig.htm](https://www.danner-net.de/omom/tutortorconfig.htm)
21. A question about MaxCircuitDirtiness option - General Discussion ..., 访问时间为 六月 25, 2025， [https://forum.torproject.org/t/a-question-about-maxcircuitdirtiness-option/11121](https://forum.torproject.org/t/a-question-about-maxcircuitdirtiness-option/11121)
22. Manual · trimstray/multitor Wiki - GitHub, 访问时间为 六月 25, 2025， [https://github.com/trimstray/multitor/wiki/Manual](https://github.com/trimstray/multitor/wiki/Manual)
23. Issues with Tor connection / Networking, Server, and Protection / Arch Linux Forums, 访问时间为 六月 25, 2025， [https://bbs.archlinux.org/viewtopic.php?id=67638](https://bbs.archlinux.org/viewtopic.php?id=67638)
24. adrelanos/tor-ctrl: Tor control port command line tool - GitHub, 访问时间为 六月 25, 2025， [https://github.com/adrelanos/tor-ctrl](https://github.com/adrelanos/tor-ctrl)
25. Web Scraping with Tor and Python - ScrapingAnt, 访问时间为 六月 25, 2025， [https://scrapingant.com/blog/web-scraping-tor-python](https://scrapingant.com/blog/web-scraping-tor-python)
26. Tor: fputs of "SIGNAL NEWNYM\r\n" results in empty response from fread - Stack Overflow, 访问时间为 六月 25, 2025， [https://stackoverflow.com/questions/34814454/tor-fputs-of-signal-newnym-r-n-results-in-empty-response-from-fread](https://stackoverflow.com/questions/34814454/tor-fputs-of-signal-newnym-r-n-results-in-empty-response-from-fread)
27. Commands - Tor Specifications, 访问时间为 六月 25, 2025， [https://spec.torproject.org/control-spec/commands.html](https://spec.torproject.org/control-spec/commands.html)
28. What does tor NEWNYM in tor do? - Super User, 访问时间为 六月 25, 2025， [https://superuser.com/questions/473662/what-does-tor-newnym-in-tor-do](https://superuser.com/questions/473662/what-does-tor-newnym-in-tor-do)
29. Tor NEWNYM is NOT working with C# - Stack Overflow, 访问时间为 六月 25, 2025， [https://stackoverflow.com/questions/13405521/tor-newnym-is-not-working-with-c-sharp](https://stackoverflow.com/questions/13405521/tor-newnym-is-not-working-with-c-sharp)
30. Tutorial — Stem 1.8.1-maint documentation, 访问时间为 六月 25, 2025， [https://stem.torproject.org/tutorials.html](https://stem.torproject.org/tutorials.html)
31. torproject/stem: Python controller library for Tor - GitHub, 访问时间为 六月 25, 2025， [https://github.com/torproject/stem](https://github.com/torproject/stem)
32. Learning STEM: Requests With Tor - GitHub Pages, 访问时间为 六月 25, 2025， [https://sigmapie8.github.io/learning-stem/requests_with_tor.html](https://sigmapie8.github.io/learning-stem/requests_with_tor.html)
33. Frequently Asked Questions — Stem 1.8.1-maint documentation, 访问时间为 六月 25, 2025， [https://stem.torproject.org/faq.html](https://stem.torproject.org/faq.html)
34. Performance and Security Improvements for Tor: A Survey - People @EECS, 访问时间为 六月 25, 2025， [https://people.eecs.berkeley.edu/~raluca/cs261-f15/readings/235.pdf](https://people.eecs.berkeley.edu/~raluca/cs261-f15/readings/235.pdf)
35. Tools and Protocols for Anonymity on the Internet, 访问时间为 六月 25, 2025， [https://www.cse.wustl.edu/~jain/cse571-11/ftp/anonym/index.html](https://www.cse.wustl.edu/~jain/cse571-11/ftp/anonym/index.html)
36. Local Anonymity: A Metric for Improving User Privacy in Tor, 访问时间为 六月 25, 2025， [https://cacr.uwaterloo.ca/techreports/2011/cacr2011-17.pdf](https://cacr.uwaterloo.ca/techreports/2011/cacr2011-17.pdf)
37. Anonymous Communication - KIT, 访问时间为 六月 25, 2025， [https://ps.tm.kit.edu/img/AnonymousCommunications_Lecture_5_7_21.pdf](https://ps.tm.kit.edu/img/AnonymousCommunications_Lecture_5_7_21.pdf)
38. Usability of Anonymous Web Browsing: An Examination of Tor Interfaces and Deployability - The Free Haven Project, 访问时间为 六月 25, 2025， [https://www.freehaven.net/anonbib/cache/tor-soups07.pdf](https://www.freehaven.net/anonbib/cache/tor-soups07.pdf)
39. Why aren't more people using Tor get deanonymized? - General Discussion, 访问时间为 六月 25, 2025， [https://forum.torproject.org/t/why-arent-more-people-using-tor-get-deanonymized/11189](https://forum.torproject.org/t/why-arent-more-people-using-tor-get-deanonymized/11189)
40. How Low Can You Go: Balancing Performance with Anonymity in Tor - Rob Jansen, 访问时间为 六月 25, 2025， [https://www.robgjansen.com/publications/howlow-pets2013.pdf](https://www.robgjansen.com/publications/howlow-pets2013.pdf)
41. How does Tor guarantee anonymity of Tor network? - Information Security Stack Exchange, 访问时间为 六月 25, 2025， [https://security.stackexchange.com/questions/80691/how-does-tor-guarantee-anonymity-of-tor-network](https://security.stackexchange.com/questions/80691/how-does-tor-guarantee-anonymity-of-tor-network)
42. Introduction to Mix Networks and Anonymous Communication Networks - Least Authority, 访问时间为 六月 25, 2025， [https://leastauthority.com/blog/introduction-to-mix-networks-and-anonymous-communication-networks/](https://leastauthority.com/blog/introduction-to-mix-networks-and-anonymous-communication-networks/)
43. Hybrid public/private Tor : r/TOR - Reddit, 访问时间为 六月 25, 2025， [https://www.reddit.com/r/TOR/comments/5ceuto/hybrid_publicprivate_tor/](https://www.reddit.com/r/TOR/comments/5ceuto/hybrid_publicprivate_tor/)
44. De-anonymization risks when using a self hosted bridge at home for your own traffic?, 访问时间为 六月 25, 2025， [https://forum.torproject.org/t/de-anonymization-risks-when-using-a-self-hosted-bridge-at-home-for-your-own-traffic/18065](https://forum.torproject.org/t/de-anonymization-risks-when-using-a-self-hosted-bridge-at-home-for-your-own-traffic/18065)
45. how to create your own tor network using multiple vps server - Reddit, 访问时间为 六月 25, 2025， [https://www.reddit.com/r/TOR/comments/15wxlzv/how_to_create_your_own_tor_network_using_multiple/](https://www.reddit.com/r/TOR/comments/15wxlzv/how_to_create_your_own_tor_network_using_multiple/)
46. How to Properly Use and Get Started with Tor | A Newbie's Guide to Anonymity - Reddit, 访问时间为 六月 25, 2025， [https://www.reddit.com/r/TOR/comments/jjf7by/how_to_properly_use_and_get_started_with_tor_a/](https://www.reddit.com/r/TOR/comments/jjf7by/how_to_properly_use_and_get_started_with_tor_a/)
47. Tor Traffic Analysis: Data-driven Attacks and Defenses - University Digital Conservancy, 访问时间为 六月 25, 2025， [https://conservancy.umn.edu/items/7515e959-f8d1-44fe-a58f-64b9f4ab63ec](https://conservancy.umn.edu/items/7515e959-f8d1-44fe-a58f-64b9f4ab63ec)
48. How do traffic correlation attacks against Tor users work ..., 访问时间为 六月 25, 2025， [https://security.stackexchange.com/questions/147402/how-do-traffic-correlation-attacks-against-tor-users-work](https://security.stackexchange.com/questions/147402/how-do-traffic-correlation-attacks-against-tor-users-work)
49. Is there a simple way to withstand a Tor correlation attack?, 访问时间为 六月 25, 2025， [https://security.stackexchange.com/questions/179647/is-there-a-simple-way-to-withstand-a-tor-correlation-attack](https://security.stackexchange.com/questions/179647/is-there-a-simple-way-to-withstand-a-tor-correlation-attack)
50. Tor security advisory: "relay early" traffic confirmation attack | The Tor Project, 访问时间为 六月 25, 2025， [https://blog.torproject.org/tor-security-advisory-relay-early-traffic-confirmation-attack/](https://blog.torproject.org/tor-security-advisory-relay-early-traffic-confirmation-attack/)
51. Flow Correlation Attacks on Tor Onion Service Sessions with Sliding Subset Sum - Network and Distributed System Security (NDSS) Symposium, 访问时间为 六月 25, 2025， [https://www.ndss-symposium.org/wp-content/uploads/2024-337-paper.pdf](https://www.ndss-symposium.org/wp-content/uploads/2024-337-paper.pdf)
52. Tor anonymity compromised by law enforcement. Is it still safe to use? - Malwarebytes, 访问时间为 六月 25, 2025， [https://www.malwarebytes.com/blog/news/2024/09/tor-anonymity-compromised-by-law-enforcement-is-it-still-safe-to-use](https://www.malwarebytes.com/blog/news/2024/09/tor-anonymity-compromised-by-law-enforcement-is-it-still-safe-to-use)
53. Defending Against Malicious Cyber Activity Originating from Tor - CISA, 访问时间为 六月 25, 2025， [https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-183a](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-183a)
