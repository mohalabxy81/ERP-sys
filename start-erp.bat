@echo off
chcp 65001 >nul
title مِعمار ERP - نظام تشغيل المقاولات والمكتب الفني ECOS v8.0
cls

:: Always change to script directory (prevent System32 or wrong path execution)
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║          مِعمار ERP - المنصة المؤسسية للمقاولات              ║
echo  ║           Enterprise Construction ERP Platform               ║
echo  ║                النسخة المؤسسية ECOS v8.0.0                   ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  جاري تشغيل الخادم المحلي المقيد (Localhost Only)...
echo  Starting secure local server on http://127.0.0.1:8080
echo.

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python متوفر - تشغيل خادم HTTP محلي آمن ومقيد بـ 127.0.0.1...
    echo  [OK] Python found - Launching secure HTTP server bound to localhost...
    echo.
    echo  -----------------------------------------------------------
    echo  الرابط المحلي: http://127.0.0.1:8080
    echo  Local URL:     http://127.0.0.1:8080
    echo  -----------------------------------------------------------
    echo  [اضغط Ctrl+C لإيقاف الخادم / Press Ctrl+C to stop]
    echo.
    start "" "http://127.0.0.1:8080"
    timeout /t 2 /nobreak >nul
    python -m http.server 8080 --bind 127.0.0.1
) else (
    echo  [!] Python غير متوفر - فتح الملف مباشرةً في المتصفح...
    echo  [!] Python not found - Opening index.html directly...
    echo.
    echo  ملاحظة: بعض ميزات رفع الملفات قد تتطلب تشغيل خادم محلي.
    echo  Note: Some file upload features may require a local server.
    echo.
    start "" "%~dp0index.html"
)

pause
