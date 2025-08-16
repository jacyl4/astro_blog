# Astro 孤岛架构渲染详解

tags:

- "#cloudflare-workers"
- "#astrojs"
- "#static-site-generator"
- "#serverless"
- "#static-site-generation"
- "#web-architecture"
- "#web-development"
created: 2025-07-15

---

## **构建现代网络：深入探讨渲染范式、Astro孤岛及高级部署策略**

---

## **第一部分：现代渲染光谱：超越SSG、SSR与CSR**

为了全面理解Astro的混合渲染方法，必须首先对所有主流的Web渲染技术有深入的了解。本部分将提供一个专家级的概述，分析每种模式的架构权衡。

### **1.1 基础范式：经典三元组**

#### **客户端渲染 (Client-Side Rendering, CSR)**

- **机制**: 服务器向浏览器发送一个极简的HTML“外壳”文件和一个体积较大的JavaScript包。浏览器下载并执行这个JavaScript文件，然后由JavaScript负责获取数据并在客户端动态构建和渲染整个用户界面 1。  
- **优点**: 提供高度互动的、类似桌面应用的体验（单页应用，SPA）；在初次加载后，后续的页面导航速度快；减少了服务器在每次路由切换时的负载 2。  
- **缺点**: 首次加载性能差（首次内容绘制时间，FCP，较长）；存在显著的SEO（搜索引擎优化）挑战，因为搜索引擎爬虫可能难以执行JavaScript，或者最初只能看到一个空白页面 1。  
- **理想用例**: 复杂的、有状态的、且SEO不是首要考虑因素的应用，例如内部仪表盘、管理面板和实时聊天应用 1。

#### **服务端渲染 (Server-Side Rendering, SSR)**

- **机制**: 对于用户的每一次请求，服务器都会获取所需数据，为该页面渲染出完整的HTML，然后将其发送给客户端。浏览器可以立即显示这个HTML。随后，一个称为**注水 (Hydration)** 的过程在客户端运行，JavaScript会为静态HTML附加事件监听器，使其变得可交互 2。  
- **优点**: 对SEO极为友好，因为爬虫能接收到完全渲染的内容；初始页面加载速度快（FCP/LCP表现优异）1；适合根据每次请求生成个性化内容。  
- **缺点**: 在高负载下响应可能较慢，因为服务器必须独立处理和渲染每个请求（导致首字节时间，TTFB，可能较高）；服务器基础设施成本和复杂性更高 2。  
- **理想用例**: 内容频繁变化或需要针对用户进行个性化的内容驱动型网站，如电子商务网站、新闻门户和社交媒体信息流 2。

#### **静态站点生成 (Static Site Generation, SSG)**

- **机制**: 在**构建时 (build time)**，所有页面都被预渲染成静态的HTML、CSS和JS文件。这些文件随后被部署到内容分发网络（CDN）上 2。  
- **优点**: 性能和可靠性极高（直接从CDN边缘提供服务）；出色的SEO；安全性高，服务器成本低 1。  
- **缺点**: 不适用于动态或个性化内容；对于大型网站，构建时间可能变得非常长；内容更新需要对整个站点进行重新构建和部署 2。  
- **理想用例**: 内容不经常变化的网站，如博客、文档站、营销页面和个人作品集 2。

### **1.2 向混合与高级模式的演进**

这些渲染模式的演进并非偶然，而是对一个根本性矛盾的直接回应：**交互性/开发者体验（CSR所偏爱）** 与 **性能/SEO（SSG/SSR所偏爱）** 之间的张力。混合模式是为实现两全其美而进行的复杂尝试，而非简单的二元选择。最初，SPA（CSR）提供了丰富的应用感，但在初始加载和SEO上表现不佳。SSR是解决方案，但给服务器带来了沉重负担。SSG解决了性能问题，却牺牲了动态内容。这就为中间地带创造了明确的需求。

#### **增量静态再生 (Incremental Static Regeneration, ISR)**

- **机制**: SSG和SSR的混合体。页面在构建时被静态生成，但在指定时间（revalidate）后或当用户请求一个过时页面时，可以在服务器后台重新生成。第一个访问的用户会得到旧的静态页面，而后续用户则会看到新生成的版本 2。  
- **优点**: 结合了静态的速度和动态内容的新鲜度；内容更新无需重建整个站点 2。  
- **缺点**: 在revalidate周期后，第一个用户获取的数据可能略有延迟；增加了缓存的复杂性。  
- **理想用例**: 新闻网站、电商产品页面和更新频繁的博客，这些场景可以接受近乎实时的数据新鲜度 2。

#### **流式SSR (Streaming SSR) 与 React Server Components (RSC)**

- **机制**: SSR的增强版。服务器不再等待整个页面渲染完成后再发送，而是在页面的某些部分准备好后就开始以流的形式向浏览器发送HTML。这可以与RSC结合使用，RSC是*仅*在服务器上渲染且不将其JavaScript发送到客户端的组件，从而进一步减小了客户端包的大小 2。  
- **优点**: 极大地改善了首字节时间（TTFB）和感知性能；显著减少了发送到浏览器的JavaScript数量 2。  
- **缺点**: 这是一个较新、较复杂的范式，需要框架支持（例如Next.js的App Router）。  
- **理想用\_例**: 具有缓慢数据依赖的大型复杂页面，通过显示UI骨架并逐步加载内容可以提供更优的用户体验。

#### **边缘渲染 (Edge Rendering)**

- **机制**: SSR的一种形式，但渲染逻辑不是在中心化的服务器上执行，而是在物理上靠近用户的CDN边缘位置的无服务器函数中执行 2。  
- **优点**: 动态内容的延迟极低，因为到远距离源服务器的往返被消除了；能够在边缘实现个性化。  
- **缺点**: 边缘运行时环境可能比完整的Node.js环境更受限制 7。  
- **理想用例**: 高度个性化的页面，如A/B测试的着陆页、地理位置感知内容，以及用户位置会影响价格或可用性的电子商务网站 2。

这一系列技术演进揭示了一个清晰的行业趋势：走向更细粒度的、性能优先的架构。最先进的框架（如Next.js、Astro、Remix）不再强制整个应用使用单一的渲染策略，而是允许开发者在每个页面甚至每个组件的层面上选择最优的渲染模式 2。这正是理解Astro孤岛架构的背景——它是这一趋势的逻辑终点，将渲染和注水策略应用到了可能的最细粒度级别。

### **表1：前端渲染模式概览**

| 渲染模式 | 工作机制简述 | 初始加载 (FCP/LCP) | 交互时间 (TTI) | SEO友好度 | 服务器成本/复杂性 | 理想用例 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **CSR** | 服务器发送HTML外壳和JS包，浏览器渲染一切。 | 慢 | 慢 | 差 | 低 | 仪表盘、管理后台、SPA 1 |
| **SSR** | 服务器为每个请求渲染完整HTML，客户端注水。 | 快 | 中等 | 优 | 高 | 电商、新闻门户、社交媒体 2 |
| **SSG** | 构建时预渲染所有页面为静态文件，由CDN提供。 | 极快 | 极快 | 优 | 极低 | 博客、文档、营销网站 2 |
| **ISR** | 静态生成，但可按需或按时在后台重新生成。 | 极快 | 极快 | 优 | 低-中 | 内容频繁更新的博客或新闻站 2 |
| **流式SSR** | 服务器分块流式传输HTML，无需等待完整页面。 | 极快 | 快 | 优 | 高 | 依赖慢速数据源的复杂页面 2 |
| **边缘渲染** | 在靠近用户的CDN边缘执行SSR。 | 极快 | 快 | 优 | 中-高 | 高度个性化的地理位置相关内容 2 |

---

## **第二部分：解构Astro：“默认零JavaScript”哲学**

本部分将剖析Astro的独特架构，解释它如何通过从根本上重新思考JavaScript的角色来实现其性能目标。

### **2.1 孤岛架构：静态HTML的海洋**

Astro默认在服务器上将页面渲染为纯粹的、静态的HTML。这个静态HTML就是“海洋” 9。而交互式的UI组件（用React、Vue、Svelte等编写）则被视为嵌入在这个静态海洋中的“孤岛” 9。这种架构确保了网站的大部分内容是无交互的，并且能够以零JavaScript的方式即时加载 9。这是一种“内容优先”的方法 10。

### **2.2 部分注水：按需激活交互性**

默认情况下，Astro向客户端发送**零**JavaScript 9。这些孤岛最初只是静态的HTML。要使一个孤岛具有交互性，必须使用  
client:\*指令明确选择加入 12。这个为服务器渲染的组件加载并附加必要JavaScript的过程被称为  
**部分注水 (Partial Hydration)** 10。Astro只为你指定的孤岛注水，而不是整个页面。这与像Next.js（在其Pages Router中）那样为整个应用树注水的框架形成了关键区别 11。

### **2.3 多框架集成**

孤岛模型的隔离特性带来了一个显著的好处：Astro是框架无关的。你可以在同一个页面上使用来自React、Vue、Svelte和SolidJS的组件 11。每个孤岛都是一个独立的单元，因此框架之间不会产生冲突。这对于微前端风格的架构、团队协作和渐进式迁移来说是理想的选择 13。  
这种架构代表了一种从“默认全量”到“默认零”的范式转变。传统的SPA框架（如Create React App）采用“退出式”性能模型：默认情况下一切都是客户端JavaScript，你必须努力工作（代码分割等）才能使其性能达标。Astro则颠覆了这一点。性能是默认的（“零JS”），而交互性是一种明确的、有意的“选择加入” 9。这种转变意义重大，因为它改变了开发者的默认思维模式。开发者不再问“我如何让这个沉重的页面更快？”，而是被迫问“这个组件是否  
*真的*需要在客户端进行交互？”。这从设计上就导向了更小的包和更快的网站，而不是通过后续优化工作。  
因此，虽然常被称为静态站点生成器，但这个标签并不完整。Astro更准确的描述是一个**多范式Web编译器** 11。它可以输出完全静态的站点（如11ty），但其核心优势在于将  
.astro文件和框架组件编译成最优渲染的HTML，并进行精准的、按需的注水。同时，它也完全支持服务端渲染 10。这使其成为像Next.js这样的全栈框架的直接、更灵活的竞争者，而不仅仅是简单的SSG。  

## **第三部分：孤岛的生命周期：解答CSR与SSR之问**

本部分将详细分析Astro如何激活交互式孤岛，直接回应用户关于React孤岛是CSR还是SSR的核心问题。

### **3.1 注水 (Hydration) 的概念**

注水是一个客户端过程，它为服务器渲染的静态HTML“注入生命力”。它涉及到将必要的JavaScript事件监听器和状态附加到DOM元素上，从而使它们变得可交互 3。Astro的创新在于  
**部分注水**，即只有特定的孤岛被注水，而非整个页面 10。

### **3.2 client:\* 指令：对注水的精细控制**

这些指令是注水的控制面板，它们告诉Astro*是否*以及*何时*加载一个孤岛的JavaScript 12。

- client:load: 在页面加载时立即加载并为组件注水。组件仍然会先在服务端渲染以提供即时HTML 14。用于关键的、立即可见的UI，如网站头部 14。  
- client:idle: 优先级较低。在页面完成初始加载且主线程空闲后加载并注水（使用requestIdleCallback）14。用于优先级较低的组件，如首屏下方的图片轮播 14。  
- client:visible: 最常见的“懒加载”指令。仅当组件进入用户视口时才加载并注水（使用IntersectionObserver）12。非常适合页脚、评论区或任何“首屏以下”的内容。  
- client:media: 仅当满足特定的CSS媒体查询时才加载并注水。非常适合仅在移动设备或桌面设备上显示和交互的组件，如汉堡菜单与完整导航栏 14。  
- client:only={framework}: 这是回答本问题的关键指令。它**完全跳过该组件的服务端渲染**。该组件将*仅*在客户端进行渲染和注水。你必须指定框架（例如client:only="react"），以便Astro知道在客户端使用哪个运行时 12。适用于严重依赖浏览器独有API（如  
  window）或没有可服务端渲染状态的组件。

### **3.3 结论：React孤岛默认为混合模式，可选择CSR**

直接回答用户的问题：默认情况下（使用client:load、client:idle或client:visible），Astro中的交互式React孤岛是**服务端渲染（作为SSG或SSR过程的一部分）然后客户端注水**。服务器生成初始HTML，客户端使其可交互。  
当且仅当你使用client:only="react"指令时，该React孤岛才变成**纯粹的客户端渲染（CSR）**。它完全不会在服务器上进行渲染 16。  
这里的关键在于Astro将**渲染**和**注水**视为两个独立的步骤。1) **渲染**：在服务器上发生（SSG在构建时，SSR在请求时），以生成HTML。2) **注水**：在客户端发生，使该HTML可交互。client:\*指令控制的是第二步的*时机和条件*，而client:only是唯一一个通过跳过第一步来改变渲染行为的指令。这种分离是Astro性能的架构秘诀，而client:only则是允许开发者在必要时为特定组件回归传统SPA模式的“逃生舱口”。  
client:\*指令并非简单的开关，它们代表了一个性能权衡的光谱。client:load优先考虑交互性，牺牲了初始包大小。client:visible优先考虑初始包大小，牺牲了屏幕外元素的即时交互性。client:media则避免为整个设备类别加载不必要的JS。这为架构师提供了微调页面上每个交互元素性能的精细控制权。

### **表2：Astro client:\* 注水指令**

| 指令 | 触发条件 | 服务端渲染? | 注水优先级 | 主要用例 | 示例 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| client:load | 页面加载完成 | 是 | 高 | 立即需要交互的、首屏可见的UI，如导航栏。 | \<Header client:load /\> |
| client:idle | 浏览器主线程空闲 | 是 | 中 | 优先级较低的UI，如非关键的侧边栏。 | \<ImageCarousel client:idle /\> |
| client:visible | 元素进入视口 | 是 | 低 | 首屏以下的UI，如页脚、评论区。 | \<Comments client:visible /\> |
| client:media | CSS媒体查询匹配 | 是 | 条件性 | 仅在特定设备上显示的UI，如移动菜单。 | \<MobileMenu client:media="(max-width: 768px)" /\> |
| client:only | 页面加载完成 | **否** | 高 | 依赖浏览器API（如window）的组件。 | \<MapComponent client:only="react" /\> |

---

## **第四部分：连接孤岛：共享状态的挑战与解决方案**

本部分将具体解释用户关于交互组件为何可能需要放在同一个孤岛内，以及如何跨孤岛管理状态的问题。

### **4.1 隔离原则：为何React Context在孤岛间失效**

Astro页面上的每个交互式孤岛都是一个**独立的、隔离的应用根 (application root)** 17。当Astro使用  
client:\*指令为一个React组件注水时，它只为该组件创建了一个新的React根。像React Context这样的框架原生状态管理工具，其工作原理是在一个**连续的组件树**中向下传递数据。  
如果你有两个独立的孤岛，例如\<MyContextProvider client:load /\>和\<MyComponentThatNeedsContext client:load /\>，它们实际上存在于两个不同的React树中。第一个孤岛的上下文对第二个孤岛是完全不可见的 19。这不是一个bug，而是孤岛架构隔离性的必然结果 23。这种隔离性是一把双刃剑：它为Astro带来了性能和弹性（一个孤岛崩溃不会影响其他孤岛），但也正是这种特性破坏了框架原生的上下文机制。这是一个经典的架构权衡：  
**隔离性 vs. 隐式通信**。

### **4.2 “巨型孤岛”模式：一种变通方案**

使用 React Context 最直接的解决方案是确保 provider 和所有 consumer 都属于 *同一个* 孤岛。这需要创建一个更大的、单一的 React 组件来包裹所有需要交互的部分，然后在 Astro 中用一个 client:* 指令渲染这个单一组件。

```jsx
// MyMegaIsland.jsx
export default function MyMegaIsland() {
  return (
    <MyContextProvider>
      <ComponentA />
      <ComponentB />
    </MyContextProvider>
  );
}
```

---

```js
import MyMegaIsland from '../components/MyMegaIsland.jsx';
```

```astro
<MyMegaIsland client:load />
```

这种模式虽然可行，但应谨慎使用，因为它与 Astro 的最小化 JS 哲学相悖，可能导致不必要的 JavaScript 包体积增大，本质上是重新创建了一个微型 SPA。

### **4.3 推荐架构：全局、框架无关的状态存储**

官方推荐且在架构上更合理的解决方案是，将共享状态提升到*任何单一框架的上下文之外*。

- **Nano Stores**: Astro的官方推荐。它是一个极轻量（\<1KB）、框架无关的状态管理库 25。  
  - **机制**: 你在一个独立的.js或.ts文件中创建一个全局存储。任何孤岛（无论是React、Vue还是Svelte）都可以导入这个存储，订阅其变化并更新其值 25。  
  - **实现**: 使用atom处理简单值，map处理对象。框架特定的辅助包（如@nanostores/react）提供了钩子（如useStore）来轻松地将组件连接到存储 25。  
- **替代方案**: 其他库如**Zustand**也遵循类似原则，同样是优秀的选择，特别是对于在React生态中已经熟悉它的开发者 28。核心原则是相同的：一个独立于框架的全局存储。

虽然这种模式是出于必要，但转向全局、框架无关的存储通常是复杂应用中更优的架构模式。它将状态逻辑与UI/视图层解耦，使得状态更容易独立于任何特定组件或框架进行测试、管理和推理。它避免了大型React应用中可能出现的“属性钻探 (prop-drilling)”或复杂的上下文组合问题。Astro的特性自然而然地引导开发者走向这种更健壮的模式 22。  

## **第五部分：从开发到部署：现代边缘上的SSR**

本部分将揭示在Cloudflare Pages等平台上部署动态、服务端渲染的Astro站点的过程，直接解答用户的最后一个问题。

### **5.1 超越“静态托管”：无服务器平台的崛起**

用户关于Cloudflare Pages是“纯静态”空间的前提已经过时。现代托管平台如Cloudflare Pages、Vercel和Netlify已经演变为集成的无服务器平台 7。它们将用于静态资源的全球CDN与一个无服务器计算环境（如Cloudflare Workers、Vercel Functions）相结合，后者可以在边缘按需运行代码 8。  
因此，一个SSR应用并非传统意义上生成“前端文件”。它会生成一个静态部分（用于SSG页面）和一个服务端处理器脚本。对于动态页面的每一次请求，该脚本都将由平台的无服务器环境执行 31。

### **5.2 Astro适配器的关键作用**

**适配器 (Adapter)** 是连接你的Astro应用和部署目标特定无服务器运行时的关键粘合剂 31。当你配置了适配器并运行  
astro build时，Astro会做两件事：

1. 照常构建你的静态资源。  
2. 输出一个针对目标平台量身定制的入口脚本和服务器配置（例如，为Cloudflare生成一个\_worker.js，或为Vercel生成一个无服务器函数）31。

没有适配器，Astro只能输出一个完全静态的站点。有了适配器，它就能输出一个准备好部署到无服务器环境的混合或完全动态的站点 31。这里的关键启示是，你不是构建一个通用的“SSR应用”然后想办法托管它。在现代范式中，你选择你的部署目标（如Vercel、Cloudflare、Deno Deploy、Node.js服务器），然后使用相应的  
**适配器**来为*那个特定环境*编译你的应用 33。适配器是框架与基础设施之间的“合同”。

### **5.3 部署演练：在Cloudflare Pages上部署Astro SSR**

- **步骤1：在 Astro 中启用 SSR。**
  在 `astro.config.mjs` 中，设置 `output: 'server'`（用于完全动态的站点）或 `output: 'hybrid'`（用于混合静态和动态页面）。
- **步骤2：安装 Cloudflare 适配器。**
  运行：

  ```shell
  npx astro add cloudflare
  ```

  这将安装 `@astrojs/cloudflare` 并更新你的 `astro.config.mjs` 以使用该适配器。
- **步骤3：配置你的项目。**
  适配器会处理大部分配置。对于高级绑定（如 KV 存储或 D1 数据库），你可能需要一个 `wrangler.toml` 文件，但对于一个基础的 SSR 应用，适配器通常就足够了。
- **步骤4：部署。**
  将你的 Git 仓库连接到 Cloudflare Pages。Cloudflare 会检测到 Astro 项目，运行 `astro build` 命令，并将你 `dist/` 文件夹中的静态资源和由适配器生成的服务端函数一同部署到其全球网络。当用户请求一个动态页面时，该请求将被路由到最近的 Cloudflare Worker 进行按需渲染。

Astro CLI、适配器和像 Vercel/Cloudflare 这样的平台代表了开发者本地工具与云基础设施之间的紧密集成。`astro add <adapter>` 命令不仅仅是安装一个库，它从根本上改变了构建输出以匹配特定云服务的架构。这种紧密耦合极大地简化了部署（Git 推送即可部署），但同时也使得在项目生命周期早期选择托管平台成为一个更重要的架构决策。

## **第六部分：综合与战略建议**

本节将所有先前的分析综合为可行的、专家级的指导。

### **6.1 决策框架**

在选择渲染策略（CSR vs. SSG vs. SSR/混合）和框架（Astro vs. Next.js vs. 传统 SPA）时，应基于项目的核心需求，如性能、SEO、交互性和内容动态性。

- **内容为王、性能至上**：如果你的项目是博客、文档或营销网站，内容是核心，性能是关键，那么 Astro 的“默认静态”哲学是理想选择。从 SSG 开始，仅在需要时添加交互孤岛。
- **高度动态的应用**：如果项目是一个复杂的、数据驱动的仪表盘或社交应用，其中大部分 UI 都是动态和个性化的，那么像 Next.js 这样的 React 全栈框架或传统的 CSR 方法可能更直接。
- **两全其美**：如果项目介于两者之间，例如一个带有动态产品列表和用户评论的电商网站，Astro 的混合模式（`output: 'hybrid'`）或 Next.js 的 ISR/RSC 功能都提供了强大的解决方案。

### **6.2 Astro 架构最佳实践**

- 从静态开始（`output: 'static'` 或 `hybrid`），并根据每个组件/页面的需要选择性地加入交互性和服务端渲染。
- 对于非关键组件，使用 `client:visible` 作为默认的注水策略，以最大化初始加载性能。
- 对于跨孤岛状态共享，优先使用全局、框架无关的存储（如 Nano Stores、Zustand），而不是“巨型孤岛”模式。
- 利用 Astro 的多框架支持来为特定任务选择最佳工具，但要注意依赖项增加可能带来的包体积问题。

### **6.3 未来轨迹：向边缘的不可阻挡的迈进**

当前的趋势——组件级渲染、部分注水、无服务器计算和基础设施即代码——都在网络边缘汇合。未来的 Web 架构将是一个动态逻辑和静态内容无缝融合，并从全球网络以最小延迟交付的模式。像 Astro 这样的框架正处于这场运动的最前沿，它们不仅是构建网站的工具，更是驾驭这种新兴架构复杂性的编译器和部署协调器。

#### **引用的著作**

1. What Is Website Rendering: CSR, SSR, and SSG Explained \- Strapi, 访问时间为 七月 15, 2025， [https://strapi.io/blog/what-is-website-rendering](https://strapi.io/blog/what-is-website-rendering)  
2. All Web App Rendering Techniques Explained: CSR, SSR, SSG ..., 访问时间为 七月 15, 2025， [https://medium.com/@pratapdeb/all-web-app-rendering-techniques-explained-csr-ssr-ssg-isr-more-20bee5cc01d5](https://medium.com/@pratapdeb/all-web-app-rendering-techniques-explained-csr-ssr-ssg-isr-more-20bee5cc01d5)  
3. CSR, SSR, SSG, ISR: How to Pick the Right Rendering Paradigm \- MakeUseOf, 访问时间为 七月 15, 2025， [https://www.makeuseof.com/csr-ssr-ssg-isr-pick-right-rendering-paradigm/](https://www.makeuseof.com/csr-ssr-ssg-isr-pick-right-rendering-paradigm/)  
4. SSR vs. CSR vs. ISR vs. SSG \- Educative.io, 访问时间为 七月 15, 2025， [https://www.educative.io/answers/ssr-vs-csr-vs-isr-vs-ssg](https://www.educative.io/answers/ssr-vs-csr-vs-isr-vs-ssg)  
5. Hydration (web development) \- Wikipedia, 访问时间为 七月 15, 2025， [https://en.wikipedia.org/wiki/Hydration\_(web\_development)](https://en.wikipedia.org/wiki/Hydration_\(web_development\))  
6. Rendering Strategies \- Basics of SSR, SSG, CSR & ISR \- DEV Community, 访问时间为 七月 15, 2025， [https://dev.to/josefine/rendering-strategies-basics-of-ssr-ssg-csr-isr-ll9](https://dev.to/josefine/rendering-strategies-basics-of-ssr-ssg-csr-isr-ll9)  
7. Migrate to Vercel from Cloudflare, 访问时间为 七月 15, 2025， [https://vercel.com/guides/migrate-to-vercel-from-cloudflare](https://vercel.com/guides/migrate-to-vercel-from-cloudflare)  
8. Get started · Cloudflare Pages docs, 访问时间为 七月 15, 2025， [https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/get-started/](https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/get-started/)  
9. Astro Concepts \- DatoCMS, 访问时间为 七月 15, 2025， [https://www.datocms.com/academy/ancillary-concepts/astro-concepts](https://www.datocms.com/academy/ancillary-concepts/astro-concepts)  
10. Island Architecture With Astro \- devmio, 访问时间为 七月 15, 2025， [https://devm.io/javascript/astro-island-architecture-application](https://devm.io/javascript/astro-island-architecture-application)  
11. Astro: The Modern Static Site Builder — A Deep Dive, Comparisons, and Practical API Integrations \- BVSWebDesign, 访问时间为 七月 15, 2025， [https://www.bvswebdesign.co.uk/articles/astro-the-modern-static-site-builder-a-deep-dive-comparisons-and-practical-api-integrations/](https://www.bvswebdesign.co.uk/articles/astro-the-modern-static-site-builder-a-deep-dive-comparisons-and-practical-api-integrations/)  
12. Template directives reference | Docs, 访问时间为 七月 15, 2025， [https://docs.astro.build/en/reference/directives-reference/](https://docs.astro.build/en/reference/directives-reference/)  
13. Astro & Fresh \- Understanding the Islands Architecture by Arpit Bharti \- GitNation, 访问时间为 七月 15, 2025， [https://gitnation.com/contents/astro-and-fresh-understanding-the-islands-architecture](https://gitnation.com/contents/astro-and-fresh-understanding-the-islands-architecture)  
14. Astro is Amazing \- Dayvster.com, 访问时间为 七月 15, 2025， [https://dayvster.com/blog/astro-is-amazing/](https://dayvster.com/blog/astro-is-amazing/)  
15. A client:if directive in Astro | Amadeus Maximilian, 访问时间为 七月 15, 2025， [https://amxmln.com/blog/2024/a-client-if-directive-in-astro/](https://amxmln.com/blog/2024/a-client-if-directive-in-astro/)  
16. What's really the practical difference between client:load and client:only directives in Astro?, 访问时间为 七月 15, 2025， [https://stackoverflow.com/questions/77338148/whats-really-the-practical-difference-between-clientload-and-clientonly-direc](https://stackoverflow.com/questions/77338148/whats-really-the-practical-difference-between-clientload-and-clientonly-direc)  
17. RSC for Astro Developers \- Overreacted, 访问时间为 七月 15, 2025， [https://overreacted.io/rsc-for-astro-developers/](https://overreacted.io/rsc-for-astro-developers/)  
18. Islands architecture \- Astro Docs, 访问时间为 七月 15, 2025， [https://docs.astro.build/en/concepts/islands/](https://docs.astro.build/en/concepts/islands/)  
19. Using React Context in Astro \- Single Island solution 🏝️ \- AstroPatterns, 访问时间为 七月 15, 2025， [https://astropatterns.dev/p/react-love/react-context-in-astro](https://astropatterns.dev/p/react-love/react-context-in-astro)  
20. Using React Context in Astro \- with Nanostores \- AstroPatterns, 访问时间为 七月 15, 2025， [https://astropatterns.dev/p/react-love/react-context-in-astro-with-nanostores](https://astropatterns.dev/p/react-love/react-context-in-astro-with-nanostores)  
21. How to use React context in Astro. Minimal case \- Stack Overflow, 访问时间为 七月 15, 2025， [https://stackoverflow.com/questions/77894014/how-to-use-react-context-in-astro-minimal-case](https://stackoverflow.com/questions/77894014/how-to-use-react-context-in-astro-minimal-case)  
22. Astro ❤️ React : Using React Context in Astro, the Australian way : r/astrojs \- Reddit, 访问时间为 七月 15, 2025， [https://www.reddit.com/r/astrojs/comments/1fyelab/astro\_react\_using\_react\_context\_in\_astro\_the/](https://www.reddit.com/r/astrojs/comments/1fyelab/astro_react_using_react_context_in_astro_the/)  
23. \*share context between islands\* This is extremely easy to solve with Astro: ht... | Hacker News, 访问时间为 七月 15, 2025， [https://news.ycombinator.com/item?id=43921678](https://news.ycombinator.com/item?id=43921678)  
24. How easy it is to convert a React (vite) project with some authentication logic to Astro?, 访问时间为 七月 15, 2025， [https://www.reddit.com/r/astrojs/comments/1ju621a/how\_easy\_it\_is\_to\_convert\_a\_react\_vite\_project/](https://www.reddit.com/r/astrojs/comments/1ju621a/how_easy_it_is_to_convert_a_react_vite_project/)  
25. Share state between islands \- Astro Docs, 访问时间为 七月 15, 2025， [https://docs.astro.build/en/recipes/sharing-state-islands/](https://docs.astro.build/en/recipes/sharing-state-islands/)  
26. Share state between Astro components | Docs, 访问时间为 七月 15, 2025， [https://docs.astro.build/en/recipes/sharing-state/](https://docs.astro.build/en/recipes/sharing-state/)  
27. How to Share State Between Astro Islands in 5 Minutes\! \- YouTube, 访问时间为 七月 15, 2025， [https://www.youtube.com/watch?v=SR8bTVjYYbk](https://www.youtube.com/watch?v=SR8bTVjYYbk)  
28. Sharing state between Astro \+ React components using zustand stores for smooth and SaaSy UX, 访问时间为 七月 15, 2025， [https://firxworx.com/blog/code/2024-06-23-astro-and-react-shared-state-with-zustand-stores/](https://firxworx.com/blog/code/2024-06-23-astro-and-react-shared-state-with-zustand-stores/)  
29. Next.js on Cloudflare vs. Vercel: Why Pretty Deploys Don't Scale | by  
30. Deploying a Static Site \- Vite, 访问时间为 七月 15, 2025， [https://v3.vitejs.dev/guide/static-deploy](https://v3.vitejs.dev/guide/static-deploy)  
31. Chapter 6: Server-side Rendering (SSR) in Astro, 访问时间为 七月 15, 2025， [https://understanding-astro-webook.vercel.app/ch6/](https://understanding-astro-webook.vercel.app/ch6/)  
32. On-demand rendering | Docs, 访问时间为 七月 15, 2025， [https://docs.astro.build/en/guides/server-side-rendering/](https://docs.astro.build/en/guides/server-side-rendering/)  
33. @deno/astro-adapter \- npm, 访问时间为 七月 15, 2025， [https://www.npmjs.com/@deno/astro-adapter](https://www.npmjs.com/@deno/astro-adapter)  
34. Adapter \- Integrations | Astro, 访问时间为 七月 15, 2025， [https://astro.build/integrations/?search=\&categories%5B%5D=adapters](https://astro.build/integrations/?search&categories%5B%5D=adapters)  
35. Astro adapter for Astro SSR deployments on AWS Amplify \- GitHub, 访问时间为 七月 15, 2025， [https://github.com/alexnguyennz/astro-aws-amplify](https://github.com/alexnguyennz/astro-aws-amplify)  
36. Deploy Astro to AWS Amplify: A Step-by-Step Guide \- LaunchFast, 访问时间为 七月 15, 2025， [https://www.launchfa.st/blog/deploy-astro-aws-amplify](https://www.launchfa.st/blog/deploy-astro-aws-amplify)
