// 博客业务服务：负责 Markdown 读取、解析、聚合、标签分类等核心逻辑
// 遵循单一职责与高内聚低耦合原则
import type { BlogPost, BlogCategory } from '../interfaces/BlogPost';
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../utils/stringUtils';

// 配置 marked 以增强 Markdown 渲染
marked.setOptions({
  gfm: true,      // 启用 GitHub 风格
  breaks: true,   // 换行符转 <br>
  pedantic: false // 非严格模式
});

// 读取 markdown 文件内容
function getFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// 提取 markdown 摘要（纯文本，截断）
function extractExcerpt(content: string, maxLength: number = 500): string {
  // 移除markdown标记，只保留纯文本
  const plainText = content
    .replace(/#+\s+(.*)/g, '$1')  // 移除标题标记
    .replace(/\*\*(.*)\*\*/g, '$1')  // 移除粗体标记
    .replace(/\*(.*)\*/g, '$1')  // 移除斜体标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 移除链接标记，保留链接文本
    .replace(/```[\s\S]*?```/g, '')  // 移除代码块
    .replace(/`([^`]+)`/g, '$1')  // 移除行内代码
    .replace(/\n/g, ' ');  // 将换行符替换为空格
  
  // 截取指定长度并添加省略号
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength) + '...';
}

// 提取 markdown 摘要（保留格式，截断并渲染增强HTML）
function extractExcerptHtml(content: string, title: string, maxLength: number = 500): string {
  // 去除开头一级/二级标题（如 # 标题 或 ## 副标题）
  let formatted = formatMarkdownContent(content, title)
    .replace(/^#{1,2} .+\n+/m, '');
  // 截断（按字符数）
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength) + '\n...';
  }
  // 转 HTML
  let html = marked.parse(formatted) as string;
  // 增强 HTML（如代码行号、图片懒加载等）
  html = enhanceHtml(html);
  return html;
}

// 格式化 markdown 内容，自动补全标题/代码块/列表等
function formatMarkdownContent(content: string, title: string): string {
  // 如果内容没有标题，添加一个基于文件名的标题
  if (!content.trim().startsWith('#')) {
    content = `# ${title}\n\n${content}`;
  }
  
  // 将连续的命令行代码块用Markdown代码块包裹
  content = content.replace(/(?:^|\n)((?:[^\n]+\n)+?)(?=\n|$)/g, (match, block) => {
    // 检查这个块是否看起来像命令块（大多数行以命令或路径开头）
    const lines = block.split('\n').filter(Boolean);
    const commandLineCount = lines.filter((line: string) => 
      /^[a-z]+\s|^(cat|wget|curl|bash|apt|yum|sed|rm|mkdir|cd|systemctl|scp|ssh)\b|^\/[a-z\/]+/.test(line.trim())
    ).length;
    
    const isCommandBlock = commandLineCount > 0 && (commandLineCount / lines.length) > 0.5;
    
    if (isCommandBlock && !block.includes('```')) {
      return `\n\`\`\`bash\n${block.trim()}\n\`\`\`\n\n`;
    }
    return match;
  });
  
  // 确保代码块格式正确
  content = content.replace(/```(\w*)\n([\s\S]*?)```/g, (_unused, lang, code) => {
    return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
  });
  
  // 改进标题格式
  content = content.replace(/^(#+)\s*(.+)$/gm, (_unused, hashes, title) => {
    return `\n${hashes} ${title.trim()}\n`;
  });
  
  // 改进列表格式
  content = content.replace(/^(\s*[-*+])\s*(.+)$/gm, (_unused, bullet, text) => {
    return `${bullet} ${text.trim()}`;
  });
  
  return content;
}

// 提取标签（支持多种格式）
function extractTags(content: string): string[] {
  // 尝试从内容中找到标签行
  const tagsMatch = content.match(/tags:\s*\[(.*?)\]/i) || content.match(/标签:\s*\[(.*?)\]/i);
  if (tagsMatch && tagsMatch[1]) {
    return tagsMatch[1]
      .split(',')
      .map(tag => tag.trim().replace(/['"`]/g, ''))
      .filter(tag => tag.length > 0);
  }
  
  // 如果没有找到标签行，尝试查找关键词
  const keywords = ['linux', 'pve', 'homelab', 'docker', 'kubernetes', 'k3s', 'lvm', 'nginx'];
  const foundKeywords = keywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return foundKeywords;
}

// 获取所有博客文章（支持平铺和分目录两种结构）
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  const documentsDir = path.join(process.cwd(), '@posts');
  console.log(`[BlogService - getAllPosts] Attempting to read from documentsDir: ${documentsDir}`); // DEBUG LOG

  try {
    // 获取所有类别目录或直接处理平铺的md文件
    const items = fs.readdirSync(documentsDir);
    const categories = items.filter(item => {
      const stat = fs.statSync(path.join(documentsDir, item));
      return stat.isDirectory();
    });
    const files = items.filter(item => {
      const stat = fs.statSync(path.join(documentsDir, item));
      return stat.isFile() && item.endsWith('.md');
    });

    // 如果有类别目录，优先遍历类别目录
    if (categories.length > 0) {
      for (const category of categories) {
        const categoryDir = path.join(documentsDir, category);
        const filesInCategory = fs.readdirSync(categoryDir).filter(file =>
          file.endsWith('.md') && fs.statSync(path.join(categoryDir, file)).isFile()
        );
        for (const file of filesInCategory) {
          const filePath = path.join(categoryDir, file);
          let content = getFileContent(filePath);
          const title = file.replace('.md', '');
          const slug = slugify(title);
          const stat = fs.statSync(filePath);
          const date = new Date(stat.mtime);
          posts.push({
            title,
            content,
            date,
            slug,
            category,
            excerpt: extractExcerpt(content),
            excerptHtml: extractExcerptHtml(content, title),
            tags: extractTags(content)
          });
        }
      }
    }

    // 处理平铺在 @posts 下的md文件（无类别）
    for (const file of files) {
      const filePath = path.join(documentsDir, file);
      let content = getFileContent(filePath);
      const title = file.replace('.md', '');
      const slug = slugify(title);
      const stat = fs.statSync(filePath);
      const date = new Date(stat.mtime);
      posts.push({
        title,
        content,
        date,
        slug,
        category: '',
        excerpt: extractExcerpt(content),
        excerptHtml: extractExcerptHtml(content, title),
        tags: extractTags(content)
      });
    }

    console.log(`[BlogService - getAllPosts] Found ${posts.length} posts. Titles: ${posts.map(p => p.title).join(', ')}`); // DEBUG LOG
    // 按日期排序，最新的在前面
    return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const allPosts = await getAllPosts();
  const post = allPosts.find(post => post.slug === slugify(slug));
  
  if (post) {
    try {
      // 1. 格式化Markdown内容（去除开头一级/二级标题，正文页面不再重复）
      let formattedContent = formatMarkdownContent(post.content, post.title)
        .replace(/^#{1,2} .+\n+/m, '');
      // 2. 将Markdown转换为HTML
      const htmlContent = marked.parse(formattedContent) as string;
      // 3. 应用额外的HTML增强
      const enhancedHtml = enhanceHtml(htmlContent);
      post.content = enhancedHtml;
      console.log(`[BlogService - getPostBySlug] Successfully processed Markdown for: ${post.title}`);
    } catch (error) {
      console.error(`[BlogService - getPostBySlug] Error processing Markdown for "${post.title}":`, error);
      // Return the post even if Markdown processing fails, content will be raw
    }
  } else {
    console.log(`[BlogService - getPostBySlug] NO MATCH FOUND for URL slug: "${slug}"`);
    // For more detailed debugging, list all available slugs again if no match
    const availableSlugs = allPosts.map(p => `"${p.slug}" (Length: ${p.slug.length})`);
    console.log(`[BlogService - getPostBySlug] All available generated slugs: [${availableSlugs.join(', ')}]`);
  }
  
  return post || null;
}

// 增强HTML内容
function enhanceHtml(html: string): string {
  // 添加代码行号
  html = html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (_unused, lang, code) => {
    const lines = code.split('\n');
    const numberedLines = lines.map((line: string, index: number) =>
      `<span class="line-number">${index + 1}</span>${line}`
    ).join('\n');
    return `<pre class="code-block language-${lang}"><code class="language-${lang}">${numberedLines}</code></pre>`;
  });
  
  // 增强表格
  html = html.replace(/<table>/g, '<table class="enhanced-table">');
  
  // 增强图片显示
  html = html.replace(/<img src="([^"]+)"([^>]*)>/g, '<img src="$1"$2 class="enhanced-image" loading="lazy">');
  
  return html;
}

export async function getAllCategories(): Promise<BlogCategory[]> {
  const allPosts = await getAllPosts();
  const categoriesMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    const count = categoriesMap.get(post.category) || 0;
    categoriesMap.set(post.category, count + 1);
  });
  
  const categories: BlogCategory[] = [];
  categoriesMap.forEach((count, name) => {
    categories.push({
      name,
      slug: slugify(name),
      count
    });
  });
  
  return categories;
}

// 获取所有标签及其文章数量
export async function getAllTags(): Promise<{name: string, slug: string, count: number}[]> {
  const allPosts = await getAllPosts();
  const tagsMap = new Map<string, number>();
  
  // 统计每个标签的文章数量
  allPosts.forEach(post => {
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        const count = tagsMap.get(tag) || 0;
        tagsMap.set(tag, count + 1);
      });
    }
  });
  
  // 转换为数组返回
  const tags: {name: string, slug: string, count: number}[] = [];
  tagsMap.forEach((count, name) => {
    tags.push({
      name,
      slug: slugify(name),
      count
    });
  });
  
  return tags;
}

// 按标签获取文章
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.tags && post.tags.some(t => 
      t.toLowerCase() === tag.toLowerCase() || slugify(t) === tag.toLowerCase()
    )
  );
}