# -*- coding: utf-8 -*-
"""
微信公众号智能创作中心 - 本地浏览器模式启动器 (Local Headless CMS Server)

纯标准库实现，零第三方依赖：
  * 在 127.0.0.1:8080 上提供前端静态文件 (index.html / style.css / script.js / 图片)
  * 提供两个写盘接口：
      POST /save      -> 把编辑好的富文本写入  output/pushed_article.html
      POST /save_env  -> 把公众号 AppID/AppSecret 写入 output/wechat.env
  * 启动后自动用系统默认浏览器打开创作中心

用法：
    python local_server.py
或直接双击仓库根目录的「双击启动创作中心.bat」。
"""

import os
import sys
import json
import logging
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer

logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger("LocalServer")

HOST = "127.0.0.1"
PORT = 8080

# 始终以脚本所在目录为根，保证无论从哪里运行都能找到 index.html
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 用户编辑产物 / 凭证统一写到 output/ 目录（已在 .gitignore 中忽略）
OUTPUT_DIR = os.path.join(BASE_DIR, "output")


class CMSHandler(SimpleHTTPRequestHandler):
    """在标准静态文件服务之上，附加两个本地写盘接口。"""

    def __init__(self, *args, **kwargs):
        # Python 3.7+ 支持用 directory 指定静态根目录
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')

    def _send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._send_cors()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self._send_cors()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
        except Exception as e:
            self._send_json(400, {"status": "error", "message": f"读取请求体失败: {e}"})
            return

        if self.path == '/save':
            self._handle_save_article(body)
        elif self.path == '/save_env':
            self._handle_save_env(body)
        else:
            self._send_json(404, {"status": "error", "message": "未知接口"})

    def _handle_save_article(self, body):
        try:
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            file_path = os.path.join(OUTPUT_DIR, "pushed_article.html")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(body)
            logger.info(f"文章富文本已保存: {file_path}")
            self._send_json(200, {"status": "success", "message": "已保存到本地 Headless CMS"})
        except Exception as e:
            logger.error(f"保存文章失败: {e}")
            self._send_json(500, {"status": "error", "message": str(e)})

    def _handle_save_env(self, body):
        try:
            data = json.loads(body)
            appid = data.get('appid', '').strip()
            secret = data.get('secret', '').strip()

            os.makedirs(OUTPUT_DIR, exist_ok=True)
            env_path = os.path.join(OUTPUT_DIR, "wechat.env")
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(f"WECHAT_APPID={appid}\nWECHAT_APPSECRET={secret}\n")
            logger.info(f"公众号凭证已保存: {env_path}")
            self._send_json(200, {"status": "success", "message": "wechat.env 保存成功"})
        except Exception as e:
            logger.error(f"保存 wechat.env 失败: {e}")
            self._send_json(500, {"status": "error", "message": str(e)})

    def log_message(self, fmt, *args):
        # 收敛默认的逐请求噪音日志
        return


def open_browser_when_ready():
    url = f"http://{HOST}:{PORT}/index.html"
    logger.info(f"正在用默认浏览器打开创作中心: {url}")
    webbrowser.open(url)


def main():
    try:
        server = HTTPServer((HOST, PORT), CMSHandler)
    except OSError as e:
        logger.error(f"无法在 {HOST}:{PORT} 启动服务（端口可能已被占用）: {e}")
        sys.exit(1)

    logger.info(f"本地 Headless CMS 已启动: http://{HOST}:{PORT}")
    logger.info("关闭本窗口即可停止服务。")

    # 服务起来后再开浏览器，避免页面加载早于监听
    threading.Timer(1.0, open_browser_when_ready).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在关闭服务...")
        server.shutdown()


if __name__ == '__main__':
    main()
