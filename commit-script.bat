@echo off
cd /d "C:\Users\Cezar\Documents\Altele\TemplateEchipe\echipe_galero.worktrees\agents-team-formation-randomization"

echo === Recent commits ===
git log --oneline -15

echo.
echo === Repository Status ===
git status --short

echo.
echo === Diff Summary ===
git diff --cached --stat

echo.
echo === Full Diff ===
git diff --cached
