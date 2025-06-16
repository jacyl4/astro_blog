export const SITE_TITLE = 'JacyL4';
export const SITE_DESCRIPTION = '一个专注于技术、生活和学习的个人博客。';

export const NAVIGATION_LINKS = [
    { href: '/', text: 'Blog' },
    { href: '/about/', text: 'About' },
];

export const POST_READ_MORE_TEXT = '阅读更多';

export const URLS = {
    posts: '/posts',
    tags: '/tags',
    categories: '/categories',
};

export const UI_TEXT = {
    noTags: '暂无标签。',
    noCategories: '暂无分类。',
    tagsTitle: '标签',
    categoriesTitle: '分类',
    archiveTitle: 'Archive',
    postsInYearMonth: (count: number, yearMonth: string) => `在 ${yearMonth} 归档中共有 ${count} 篇文章`,
    page_404_title: '404 - 页面未找到',
    page_404_message: '很抱歉，您请求的页面不存在或已被移动。',
    go_back_home: '返回首页',
    postsInCategory: (count: number) => `该分类共有 ${count} 篇文章`,
    noPostsInCategory: '该分类下暂无文章',
    postsInTag: (count: number) => `该分类共有 ${count} 篇文章`,
    noPostsInTag: '该标签下暂无文章',
    unknownDate: '未知日期',
    untitledPost: '无标题文章',
    publishDate: '发布日期',
    category: '分类',
    tag: '标签',
    postList: '文章列表',
    noPosts: '暂无文章。',
};

export const PAGE_TITLES = {
    home: '首页',
    about: '关于',
    archive: '归档',
    categories: '分类',
    tags: '标签',
};

export const DATE_FORMAT = {
    locale: 'zh-CN',
    options: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    },
};
