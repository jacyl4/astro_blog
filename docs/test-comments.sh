#!/bin/bash
# 评论系统测试脚本

WORKER_URL="https://astro-blog-comments.seso.icu"
BLOG_URL="https://blog.seso.icu"

echo "=== 评论系统配置测试 ==="
echo ""

# 测试 1: Worker 可访问性
echo "1. 测试 Worker 可访问性..."
response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/auth/session")
http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "✓ Worker 可访问"
    echo "  响应: $body"
else
    echo "✗ Worker 访问失败 (HTTP $http_code)"
    echo "  响应: $body"
fi
echo ""

# 测试 2: CORS 配置
echo "2. 测试 CORS 配置..."
cors_response=$(curl -s -I -H "Origin: $BLOG_URL" "$WORKER_URL/auth/session" | grep -i "access-control")
if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo "✓ CORS 配置正确"
    echo "$cors_response"
else
    echo "✗ CORS 配置缺失"
fi
echo ""

# 测试 3: 评论 API
echo "3. 测试评论 API..."
comments_response=$(curl -s -w "\n%{http_code}" -H "Origin: $BLOG_URL" "$WORKER_URL/api/comments?postId=/posts/test")
comments_code=$(echo "$comments_response" | tail -1)
comments_body=$(echo "$comments_response" | head -n -1)

if [ "$comments_code" = "200" ]; then
    echo "✓ 评论 API 工作正常"
    echo "  响应: $comments_body"
else
    echo "✗ 评论 API 失败 (HTTP $comments_code)"
    echo "  响应: $comments_body"
fi
echo ""

# 测试 4: 环境变量检查（间接）
echo "4. 检查环境变量配置（通过登录端点）..."
if echo "$body" | grep -q "authenticated"; then
    echo "✓ Worker 基本配置正常"
    if echo "$body" | grep -q "false"; then
        echo "  未登录状态（正常）"
    fi
else
    echo "⚠ Worker 可能缺少环境变量配置"
    echo "  请在 Cloudflare Dashboard 检查："
    echo "  - GITHUB_CLIENT_ID"
    echo "  - GITHUB_CLIENT_SECRET"
    echo "  - JWT_SECRET"
fi
echo ""

echo "=== 测试完成 ==="
echo ""
echo "如果所有测试都通过，评论系统应该可以正常工作。"
echo "如果有失败，请检查："
echo "1. Worker 环境变量是否在 Cloudflare Dashboard 中正确配置"
echo "2. Worker 自定义域名是否已绑定"
echo "3. GitHub OAuth App 回调地址是否正确"
