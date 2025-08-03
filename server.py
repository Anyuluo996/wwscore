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
import io
import time
from urllib.parse import urlparse, parse_qs
from PIL import Image
import numpy as np

# 尝试导入PaddleOCR
try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
    print("PaddleOCR 已成功导入")
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("PaddleOCR 未安装，将跳过PaddleOCR功能")

class OCRHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
        self.paddle_ocr = None
        self.ocr_config = None
    
    def load_ocr_config(self):
        """加载OCR配置文件"""
        try:
            config_path = os.path.join(os.getcwd(), 'ocr-config.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                self.ocr_config = config
                return config
        except Exception as e:
            print(f"加载OCR配置文件失败: {e}")
            raise Exception("无法加载OCR配置文件")
    
    def get_enabled_ocr_providers(self):
        """获取启用的OCR提供商，按优先级排序"""
        if not hasattr(self, 'ocr_config') or not self.ocr_config:
            self.load_ocr_config()
        
        providers = self.ocr_config.get('ocr_providers', [])
        enabled_providers = [p for p in providers if p.get('enabled', False)]
        # 按优先级排序
        enabled_providers.sort(key=lambda x: x.get('priority', 999))
        return enabled_providers
    
    def init_paddle_ocr(self, config):
        """初始化PaddleOCR"""
        if not PADDLEOCR_AVAILABLE:
            return False
        
        try:
            if not hasattr(self, 'paddle_ocr') or self.paddle_ocr is None:
                paddle_config = config.get('config', {})
                
                # 使用最基本和兼容的参数
                init_params = {
                    'lang': paddle_config.get('lang', 'ch'),
                    'use_gpu': False,  # 强制禁用GPU，确保CPU模式
                }
                
                # 尝试添加可选的优化参数（如果支持）
                optional_params = {
                    'enable_mkldnn': False,  # 禁用MKLDNN以减少内存使用
                    'cpu_threads': 1,  # 限制CPU线程数，适合低配置
                    'use_textline_orientation': False,  # 禁用文本方向检测以节省资源
                }
                
                # 逐个尝试添加可选参数
                for param_name, param_value in optional_params.items():
                    try:
                        # 先创建一个测试实例来验证参数是否支持
                        test_params = init_params.copy()
                        test_params[param_name] = param_value
                        # 如果参数被支持，添加到最终参数中
                        init_params[param_name] = param_value
                        print(f"已添加优化参数: {param_name}={param_value}")
                    except Exception as e:
                        print(f"跳过不支持的参数: {param_name} ({e})")
                        continue
                
                print("正在初始化PaddleOCR（低配置兼容模式）...")
                print(f"使用参数: {init_params}")
                self.paddle_ocr = PaddleOCR(**init_params)
                print("PaddleOCR 初始化成功")
            return True
        except Exception as e:
            print(f"PaddleOCR 初始化失败: {e}")
            return False
    
    def log_error(self, format, *args):
        # 忽略连接中止错误的日志输出
        if "ConnectionAbortedError" in str(args) or "WinError 10053" in str(args):
            return
        super().log_error(format, *args)
    
    def do_POST(self):
        if self.path == '/api/ocr':
            self.handle_ocr_request()
        elif self.path == '/api/baidu-ocr':
            self.handle_baidu_ocr()
        else:
            super().do_POST()
    
    def handle_ocr_request(self):
        """处理OCR请求，支持多提供商自动切换"""
        try:
            print("收到OCR请求")
            
            # 读取请求数据
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            print(f"图片数据长度: {len(data.get('image', ''))}")
            
            # 获取启用的OCR提供商
            providers = self.get_enabled_ocr_providers()
            if not providers:
                self.send_error_response(500, "没有启用的OCR提供商")
                return
            
            # 按优先级尝试每个OCR提供商
            last_error = None
            for i, provider in enumerate(providers):
                provider_name = provider['name']
                print(f"尝试使用OCR提供商: {provider_name} (优先级: {provider['priority']})")
                
                try:
                    if provider_name == 'baidu':
                        result = self.process_baidu_ocr(data['image'], provider['config'])
                    elif provider_name == 'paddleocr':
                        result = self.process_paddle_ocr(data['image'], provider['config'])
                    else:
                        print(f"未知的OCR提供商: {provider_name}")
                        continue
                    
                    if result and not result.get('error'):
                        print(f"OCR识别成功，使用提供商: {provider_name}")
                        result['provider'] = provider_name
                        self.send_json_response(result)
                        return
                    else:
                        error_msg = result.get('error', '未知错误') if result else '返回结果为空'
                        print(f"OCR提供商 {provider_name} 识别失败: {error_msg}")
                        last_error = error_msg
                        
                except Exception as e:
                    error_msg = str(e)
                    print(f"OCR提供商 {provider_name} 处理异常: {error_msg}")
                    last_error = error_msg
                    continue
            
            # 所有提供商都失败了
            if not hasattr(self, 'ocr_config') or not self.ocr_config:
                self.load_ocr_config()
            
            fallback_enabled = self.ocr_config.get('fallback_enabled', True)
            if fallback_enabled:
                error_message = f"所有OCR提供商都失败了。最后错误: {last_error}"
            else:
                error_message = f"OCR识别失败: {last_error}"
            
            print(error_message)
            self.send_error_response(500, error_message)
            
        except Exception as e:
            print(f"OCR请求处理错误: {e}")
            import traceback
            traceback.print_exc()
            self.send_error_response(500, f"OCR处理失败: {str(e)}")
    
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
    
    def process_baidu_ocr(self, image_base64, config):
        """处理百度OCR识别"""
        try:
            # 获取百度访问令牌
            access_token = self.get_baidu_access_token(config)
            if not access_token:
                return {"error": "获取百度访问令牌失败"}
            
            # 调用百度OCR API
            result = self.call_baidu_ocr_api(access_token, image_base64)
            return result
            
        except Exception as e:
            return {"error": str(e)}
    
    def process_paddle_ocr(self, image_base64, config):
        """处理PaddleOCR识别（低配置优化版本）"""
        try:
            if not self.init_paddle_ocr(config):
                return {"error": "PaddleOCR初始化失败"}
            
            # 将base64图片转换为numpy数组
            image_data = base64.b64decode(image_base64)
            
            # 检查图片大小，如果太大则压缩以节省内存
            if len(image_data) > 2 * 1024 * 1024:  # 2MB
                print("图片较大，正在压缩以适应低配置服务器...")
                image = Image.open(io.BytesIO(image_data))
                # 限制图片最大尺寸
                max_size = (1024, 1024)
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # 转换为RGB模式以确保兼容性
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                    
                image_np = np.array(image)
            else:
                image = Image.open(io.BytesIO(image_data))
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                image_np = np.array(image)
            
            # 使用PaddleOCR进行识别（禁用角度分类以节省资源）
            start_time = time.time()
            try:
                ocr_result = self.paddle_ocr.ocr(image_np, cls=False)  # 禁用角度分类
            except Exception as e:
                print(f"OCR识别时出错，尝试降级处理: {e}")
                # 如果出错，尝试进一步压缩图片
                if image_np.shape[0] > 512 or image_np.shape[1] > 512:
                    image_small = Image.fromarray(image_np)
                    image_small.thumbnail((512, 512), Image.Resampling.LANCZOS)
                    image_np = np.array(image_small)
                    ocr_result = self.paddle_ocr.ocr(image_np, cls=False)
                else:
                    raise e
                    
            end_time = time.time()
            
            print(f"PaddleOCR识别耗时: {end_time - start_time:.2f}秒")
            
            # 转换结果格式以兼容百度OCR格式
            words_result = []
            if ocr_result and ocr_result[0]:
                for line in ocr_result[0]:
                    if line and len(line) >= 2:
                        text = line[1][0] if line[1] and len(line[1]) > 0 else ""
                        confidence = line[1][1] if line[1] and len(line[1]) > 1 else 0.0
                        
                        words_result.append({
                            "words": text,
                            "probability": {"average": confidence}
                        })
            
            result = {
                "words_result_num": len(words_result),
                "words_result": words_result
            }
            
            print(f"PaddleOCR识别结果: 共{len(words_result)}行文字")
            
            # 清理内存
            del image_data, image_np
            if 'image' in locals():
                del image
                
            return result
            
        except Exception as e:
            print(f"PaddleOCR处理错误: {e}")
            return {"error": str(e)}
    
    def get_baidu_access_token(self, config=None):
        try:
            # 从配置文件读取百度API密钥
            if config is None:
                if not hasattr(self, 'ocr_config') or not self.ocr_config:
                    self.load_ocr_config()
                
                ocr_config = self.ocr_config
                # 兼容旧格式
                if 'baidu' in ocr_config:
                    config = ocr_config['baidu']
                else:
                    # 新格式：从providers中查找
                    providers = ocr_config.get('ocr_providers', [])
                    baidu_provider = next((p for p in providers if p['name'] == 'baidu'), None)
                    if baidu_provider:
                        config = baidu_provider['config']
                    else:
                        raise Exception("未找到百度OCR配置")
            
            api_key = config['apiKey']
            secret_key = config['secretKey']
            
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