# 前端构建并自动复制到 public 目录
Write-Host "开始构建前端..." -ForegroundColor Green

# 进入 web 目录构建（使用 build:prod 会自动复制）
Set-Location web
npm run build:prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 构建完成！文件已自动复制到 public 目录" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步:" -ForegroundColor Cyan
    Write-Host "  git add ." -ForegroundColor Yellow
    Write-Host "  git commit -m '你的提交信息'" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor Yellow
    Write-Host ""
    
    # 返回根目录
    Set-Location ..
} else {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    Set-Location ..
    exit 1
}
