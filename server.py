#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import urllib.error
import base64
import os
from urllib.parse import urlparse, parse_qs

class OCRHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def load_ocr_config(self):
        """加载OCR配置文件"""
        try:
            config_path = os.path.join(os.getcwd(), 'ocr-config.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载OCR配置文件失败: {e}")
            raise Exception("无法加载OCR配置文件")
    
    def log_error(self, format, *args):
        # 忽略连接中止错误的日志输出
        if "ConnectionAbortedError" in str(args) or "WinError 10053" in str(args):
            return
        super().log_error(format, *args)
    
    def do_POST(self):
        if self.path == '/api/baidu-ocr':
            self.handle_baidu_ocr()
        else:
            super().do_POST()
    
    def handle_baidu_ocr(self):
        try:
            print("收到百度OCR请求")
            
            # 读取请求数据
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            print(f"图片数据长度: {len(data.get('image', ''))}")
            
            # 获取百度访问令牌
            print("正在获取百度访问令牌...")
            access_token = self.get_baidu_access_token()
            if not access_token:
                print("获取百度访问令牌失败")
                self.send_error_response(500, "获取百度访问令牌失败")
                return
            
            print(f"成功获取访问令牌: {access_token[:10]}...")
            
            # 调用百度OCR API
            print("正在调用百度OCR API...")
            ocr_result = self.call_baidu_ocr_api(access_token, data['image'])
            
            print(f"OCR结果: {ocr_result}")
            
            # 返回结果
            self.send_json_response(ocr_result)
            print("OCR结果已返回")
            
        except Exception as e:
            print(f"百度OCR处理错误: {e}")
            import traceback
            traceback.print_exc()
            self.send_error_response(500, f"OCR处理失败: {str(e)}")
    
    def get_baidu_access_token(self):
        try:
            # 从配置文件读取百度API密钥
            config = self.load_ocr_config()
            api_key = config['baidu']['apiKey']
            secret_key = config['baidu']['secretKey']
            
            # 构建请求URL
            url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={api_key}&client_secret={secret_key}"
            
            # 发起请求
            request = urllib.request.Request(url, method='POST')
            request.add_header('Content-Type', 'application/json')
            request.add_header('Accept', 'application/json')
            
            with urllib.request.urlopen(request) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get('access_token')
                
        except Exception as e:
            print(f"获取百度访问令牌失败: {e}")
            return None
    
    def call_baidu_ocr_api(self, access_token, image_base64):
        try:
            # 构建请求URL
            url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token={access_token}"
            print(f"OCR API URL: {url}")
            
            # 构建请求数据
            data = {
                'image': image_base64,
                'detect_direction': 'false',
                'paragraph': 'false',
                'probability': 'false',
                'multidirectional_recognize': 'false'
            }
            
            print(f"发送OCR请求，图片数据长度: {len(image_base64)}")
            
            # 编码请求数据
            post_data = urllib.parse.urlencode(data).encode('utf-8')
            
            # 发起请求
            request = urllib.request.Request(url, data=post_data, method='POST')
            request.add_header('Content-Type', 'application/x-www-form-urlencoded')
            request.add_header('Accept', 'application/json')
            
            with urllib.request.urlopen(request) as response:
                print(f"OCR API响应状态码: {response.status}")
                result = json.loads(response.read().decode('utf-8'))
                print(f"OCR API响应内容: {result}")
                return result
                
        except Exception as e:
            print(f"调用百度OCR API时出错: {e}")
            return {"error": str(e)}
    
    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_data = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_data.encode('utf-8'))
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_data = json.dumps({'error': message}, ensure_ascii=False)
        self.wfile.write(error_data.encode('utf-8'))
    
    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), OCRHandler) as httpd:
        print(f"服务器启动在端口 {PORT}")
        print(f"访问地址: http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务器")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    main()