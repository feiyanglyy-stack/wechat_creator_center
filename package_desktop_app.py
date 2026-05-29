# -*- coding: utf-8 -*-
"""
谋士智能创作中心 - PyInstaller Compilation Script (Compat Mode)
"""

import os
import subprocess
import sys
import shutil

# Reconfigure stdout to use UTF-8 if available to avoid encoding errors
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def compile_app():
    print("===================================================")
    print(" [CMS] Standalone EXE Compiler")
    print("===================================================")
    
    # Dependencies check
    try:
        import PyInstaller
        print("[*] PyInstaller version: OK")
    except ImportError:
        print("[*] Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        
    try:
        import webview
        print("[*] pywebview version: OK")
    except ImportError:
        print("[*] Installing pywebview...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pywebview"])

    # We use an ASCII name first to prevent unicode path conflicts inside PyInstaller
    ascii_name = "wechat_creator_center"
    final_name = "谋士智能创作中心"

    # Clean up previous build/dist folders to avoid permission locks
    for folder in ["build", "dist"]:
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
                print(f"[*] Cleaned up old {folder} folder")
            except Exception as e:
                print(f"[WARNING] Could not clean {folder}: {e}")

    # Define build command
    cmd = [
        "pyinstaller",
        f"--name={ascii_name}",
        "--onefile",
        "--noconsole",
        "--clean",
        # Add assets
        "--add-data=index.html;.",
        "--add-data=style.css;.",
        "--add-data=script.js;.",
        "--add-data=data_orchestration_cover.png;.",
        "--add-data=pydantic_rust_core.png;.",
        "--add-data=woodland_roadmap.png;.",
        "app_launcher.py"
    ]
    
    print(f"[*] Running PyInstaller build: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
        
        # After successful build, rename the ASCII EXE to the Chinese final name
        src_path = os.path.join("dist", f"{ascii_name}.exe")
        dst_path = os.path.join("dist", f"{final_name}.exe")
        
        if os.path.exists(src_path):
            if os.path.exists(dst_path):
                os.remove(dst_path)
            os.rename(src_path, dst_path)
            print(f"[*] Successfully renamed {src_path} to {dst_path}")
            
        print("\n===================================================")
        print(" SUCCESS!")
        print(f"Standalone EXE file generated at: dist\\{final_name}.exe")
        print("===================================================")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Compilation failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Post-build rename failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    compile_app()
