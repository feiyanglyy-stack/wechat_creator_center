# -*- coding: utf-8 -*-
"""
微信公众号草稿箱一键推送脚本 (通用版)

它会：
  1. 从 output/wechat.env (或仓库根目录 wechat.env) 读取 AppID / AppSecret
  2. 读取 output/pushed_article.html (在创作中心「段落深度编辑」里点“保存至本地
     Headless CMS”导出的富文本)
  3. 自动发现文章里引用的本地图片，逐一上传到微信 CDN 并把链接替换进正文
  4. 把封面图作为缩略图 (thumb) 上传，拿到 thumb_media_id
  5. 调用「新增草稿」接口，把图文推送到你的公众号草稿箱

使用前请先在下方 CONFIG 区填写文章标题/作者/摘要/封面图，然后运行：
    pip install requests
    python push_to_draft.py

注意：本脚本需要你自己的公众号 AppID/AppSecret，且公众号需在「开发-基本配置」
里把运行环境出口 IP 加入 IP 白名单，否则微信会拒绝发放 access_token。
"""

import os
import io
import re
import sys
import json

try:
    import requests
except ImportError:
    print("缺少依赖 requests，请先运行：pip install requests")
    sys.exit(1)

# ============================ CONFIG（按需修改） ============================
TITLE = "请在此填写文章标题"
AUTHOR = "作者名"
DIGEST = "请在此填写文章摘要（选填，留空则微信自动截取正文开头）"
# 封面缩略图文件名（必填）。留空则自动使用正文中发现的第一张图片作为封面。
COVER_IMAGE = ""
# 是否开启留言：1 开启 / 0 关闭
NEED_OPEN_COMMENT = 1
# =========================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
ARTICLE_PATH = os.path.join(OUTPUT_DIR, "pushed_article.html")

# 支持的本地图片扩展名
IMG_EXT = r"(?:png|jpe?g|gif|webp)"
# 前端导出的占位符形如：src="[请上传：插图1-xxx.png]"，只捕获末尾的 ASCII 文件名
PLACEHOLDER_RE = re.compile(r"\[请上传[：:]\s*插图\d+-([A-Za-z0-9_.\-]+?\." + IMG_EXT + r")\]", re.IGNORECASE)
# 普通本地 src（排除 http/https、data: 协议，以及方括号占位符）
LOCAL_SRC_RE = re.compile(r'src=["\'](?!https?:|data:)([^"\'\[\]]+?\.' + IMG_EXT + r')["\']', re.IGNORECASE)


def load_credentials():
    """优先读 output/wechat.env，其次读仓库根目录 wechat.env。"""
    candidates = [os.path.join(OUTPUT_DIR, "wechat.env"), os.path.join(BASE_DIR, "wechat.env")]
    env_path = next((p for p in candidates if os.path.exists(p)), None)
    if not env_path:
        raise FileNotFoundError(
            "未找到 wechat.env。请先在创作中心右侧「微信公众号 API 凭证配置」里保存，"
            "或手动复制 wechat.env.example 为 output/wechat.env 并填写。"
        )

    appid = secret = None
    with io.open(env_path, encoding="utf-8") as f:
        for line in f:
            if "=" not in line:
                continue
            k, v = line.strip().split("=", 1)
            if k == "WECHAT_APPID":
                appid = v.strip()
            elif k == "WECHAT_APPSECRET":
                secret = v.strip()

    if not appid or not secret:
        raise ValueError("wechat.env 必须同时包含 WECHAT_APPID 和 WECHAT_APPSECRET。")
    print(f"凭证加载成功 ({env_path})。AppID: {appid[:6]}...{appid[-4:]}")
    return appid, secret


def get_access_token(appid, secret):
    url = ("https://api.weixin.qq.com/cgi-bin/token"
           f"?grant_type=client_credential&appid={appid}&secret={secret}")
    data = requests.get(url, timeout=10).json()
    if "access_token" in data:
        return data["access_token"]
    raise RuntimeError(f"获取 access_token 失败: {data}")


def locate_image(filename):
    """在仓库根目录与 output/ 下查找图片文件，返回绝对路径或 None。"""
    for folder in (BASE_DIR, OUTPUT_DIR, os.path.join(OUTPUT_DIR, "images")):
        candidate = os.path.join(folder, filename)
        if os.path.exists(candidate):
            return candidate
    return None


def upload_thumb(access_token, filepath):
    """上传永久缩略图，返回 thumb 的 media_id。"""
    url = ("https://api.weixin.qq.com/cgi-bin/material/add_material"
           f"?access_token={access_token}&type=thumb")
    with open(filepath, "rb") as f:
        files = {"media": (os.path.basename(filepath), f, "image/png")}
        data = requests.post(url, files=files, timeout=30).json()
    media_id = data.get("media_id") or data.get("thumb_media_id")
    if media_id:
        return media_id
    raise RuntimeError(f"上传封面缩略图失败: {data}")


def upload_image_to_cdn(access_token, filepath):
    """上传正文图片到微信 CDN，返回可直接用于图文的 URL。"""
    url = f"https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token={access_token}"
    with open(filepath, "rb") as f:
        files = {"media": (os.path.basename(filepath), f, "image/png")}
        data = requests.post(url, files=files, timeout=30).json()
    if "url" in data:
        return data["url"]
    raise RuntimeError(f"上传正文图片到 CDN 失败: {data}")


def collect_referenced_images(html):
    """从正文里收集所有被引用的本地图片文件名（去重，保持出现顺序）。"""
    names = []
    for m in PLACEHOLDER_RE.finditer(html):
        names.append(m.group(1))
    for m in LOCAL_SRC_RE.finditer(html):
        names.append(os.path.basename(m.group(1)))
    seen = set()
    ordered = []
    for n in names:
        if n not in seen:
            seen.add(n)
            ordered.append(n)
    return ordered


def replace_image_refs(html, url_map):
    """把正文里的占位符与本地 src 替换成 CDN URL。url_map: 文件名 -> CDN URL。"""
    def repl_placeholder(m):
        fname = m.group(1)
        return url_map.get(fname, m.group(0))

    def repl_local_src(m):
        fname = os.path.basename(m.group(1))
        if fname in url_map:
            return f'src="{url_map[fname]}"'
        return m.group(0)

    html = PLACEHOLDER_RE.sub(repl_placeholder, html)
    html = LOCAL_SRC_RE.sub(repl_local_src, html)
    return html


def push_draft(access_token, thumb_media_id, html_content):
    url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
    payload = {
        "articles": [{
            "title": TITLE,
            "author": AUTHOR,
            "digest": DIGEST,
            "content": html_content,
            "thumb_media_id": thumb_media_id,
            "need_open_comment": NEED_OPEN_COMMENT,
            "only_fans_can_comment": 0,
        }]
    }
    headers = {"Content-Type": "application/json; charset=utf-8"}
    # 必须 ensure_ascii=False，否则中文会被转义后超出微信长度限制
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    return requests.post(url, data=body, headers=headers, timeout=20).json()


def main():
    print("=" * 56)
    print(" 微信公众号草稿箱一键推送")
    print("=" * 56)

    if not os.path.exists(ARTICLE_PATH):
        print(f"\n未找到文章文件: {ARTICLE_PATH}")
        print("请先在创作中心「段落深度编辑」标签里点击“保存至本地 Headless CMS”导出文章。")
        sys.exit(1)

    try:
        appid, secret = load_credentials()
        print("正在获取 access_token ...")
        token = get_access_token(appid, secret)
        print("access_token 获取成功。")

        with io.open(ARTICLE_PATH, encoding="utf-8") as f:
            html = f.read()

        # 1) 发现并上传正文图片
        image_names = collect_referenced_images(html)
        url_map = {}
        for name in image_names:
            path = locate_image(name)
            if not path:
                print(f"  [跳过] 未在本地找到图片: {name}（正文将保留原引用）")
                continue
            print(f"  [上传] {name} -> 微信 CDN ...")
            url_map[name] = upload_image_to_cdn(token, path)

        html = replace_image_refs(html, url_map)

        # 2) 选择封面缩略图
        cover_name = COVER_IMAGE.strip() or (image_names[0] if image_names else "")
        cover_path = locate_image(cover_name) if cover_name else None
        if not cover_path:
            print("\n未能确定封面图片（请在 CONFIG 的 COVER_IMAGE 指定一个本地图片文件名）。")
            sys.exit(1)
        print(f"正在上传封面缩略图: {os.path.basename(cover_path)} ...")
        thumb_id = upload_thumb(token, cover_path)
        print(f"封面缩略图上传成功。thumb_media_id: {thumb_id}")

        # 3) 压缩空白后推送
        html = "".join(line.strip() for line in html.split("\n") if line.strip())
        print("正在提交到公众号草稿箱 ...")
        result = push_draft(token, thumb_id, html)

        if "media_id" in result:
            print("\n" + "=" * 56)
            print(" 成功！文章已送达公众号草稿箱。")
            print(f" Draft media_id: {result['media_id']}")
            print("=" * 56)
        else:
            print("\n新增草稿失败，微信返回：", result)
            sys.exit(1)

    except Exception as e:
        print("\n运行出错:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
