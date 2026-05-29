# -*- coding: utf-8 -*-
"""
谋士智能创作中心 - Standalone Desktop App Launcher
Powered by pywebview & python HTTPServer
"""

import os
import sys
import threading
import logging
from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import webview

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger("DesktopApp")

# Resolve PyInstaller temporary folder path
if hasattr(sys, '_MEIPASS'):
    BASE_PATH = sys._MEIPASS
else:
    BASE_PATH = os.path.dirname(os.path.abspath(__file__))

# Headless CMS handler
class CMSHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == '/save':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                # We save to a directory relative to where the EXE is run, not the temporary folder!
                # This ensures the user's modifications are stored in their workspace.
                exe_dir = os.path.dirname(sys.executable) if hasattr(sys, '_MEIPASS') else os.path.abspath(".")
                target_dir = os.path.join(exe_dir, "output")
                os.makedirs(target_dir, exist_ok=True)
                
                file_path = os.path.join(target_dir, "pushed_article.html")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(body)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Successfully saved to Headless CMS"}).encode('utf-8'))
                logger.info(f"Saved rich HTML to disk at: {file_path}")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                logger.error(f"Error saving HTML: {e}")
        elif self.path == '/save_env':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                appid = data.get('appid', '')
                secret = data.get('secret', '')
                
                exe_dir = os.path.dirname(sys.executable) if hasattr(sys, '_MEIPASS') else os.path.abspath(".")
                target_dir = os.path.join(exe_dir, "output")
                os.makedirs(target_dir, exist_ok=True)
                
                env_path = os.path.join(target_dir, "wechat.env")
                with open(env_path, 'w', encoding='utf-8') as f:
                    f.write(f"WECHAT_APPID={appid}\nWECHAT_APPSECRET={secret}\n")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Successfully saved wechat.env"}).encode('utf-8'))
                logger.info(f"Saved wechat.env credentials to disk at: {env_path}")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                logger.error(f"Error saving wechat.env: {e}")
        else:
            self.send_response(404)
            self.end_headers()

def run_cms_server():
    try:
        # Start server only on 127.0.0.1 for security
        server = HTTPServer(('127.0.0.1', 8080), CMSHandler)
        logger.info("Local Headless CMS Server running on http://127.0.0.1:8080")
        server.serve_forever()
    except Exception as e:
        logger.error(f"Error starting CMS Server: {e}")

def main():
    # Start CMS Server thread
    cms_thread = threading.Thread(target=run_cms_server, daemon=True)
    cms_thread.start()
    
    # Path to index.html inside the PyInstaller package
    index_path = os.path.join(BASE_PATH, "index.html")
    
    logger.info(f"Loading local dashboard: {index_path}")
    
    # Launch pywebview window
    # width=1280, height=850, resizable=True
    webview.create_window(
        title='谋士智能创作中心', 
        url=index_path, 
        width=1280, 
        height=850,
        min_size=(1024, 768),
        resizable=True
    )
    webview.start()

if __name__ == '__main__':
    main()
