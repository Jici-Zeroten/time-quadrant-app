@echo off
rem �ύmain��֧
git add -A
git commit -m "update"
git push
rem �ύgh-pages��֧
npm run deploy
pause