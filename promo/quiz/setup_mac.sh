#!/bin/bash
# Один раз на Mac: ставит всё нужное для make.sh
set -e
cd "$(dirname "$0")"
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install ffmpeg node python@3.12
python3 -m pip install --user --break-system-packages numpy scipy edge-tts 2>/dev/null || python3 -m pip install --user numpy scipy edge-tts
npm install --no-save playwright
npx playwright install chromium
echo "Готово. Дальше: ./make.sh 5"
