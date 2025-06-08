@echo off
rem 提交main分支
git add -A
git commit -m "update"
git push
rem 提交gh-pages分支
npm run deploy
pause