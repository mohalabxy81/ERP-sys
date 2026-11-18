@echo off
chcp 65001 >nul
title مِعمار ERP - تشغيل النظام المحلي
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║          مِعمار ERP - المنصة المؤسسية للمقاولات              ║
echo  ║           Enterprise Construction ERP Platform               ║
echo  ║                   النسخة المحلية v1.0                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  جاري تشغيل الخادم المحلي ...
echo  Starting local server on http://localhost:8080
echo.

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Python متوفر - تشغيل خادم HTTP محلي...
    echo  [OK] Python found - Launching local HTTP server...
    echo.
    echo  -----------------------------------------------------------
    echo  الرابط المحلي: http://localhost:8080
    echo  Local URL:     http://localhost:8080
    echo  -----------------------------------------------------------
    echo  [اضغط Ctrl+C لإيقاف الخادم / Press Ctrl+C to stop]
    echo.
    start "" "http://localhost:8080"
    timeout /t 2 /nobreak >nul
    python -m http.server 8080
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
