#!/bin/bash
# Выпустить N новых роликов на двух языках:   ./make.sh 5
# Собрать уже отобранный выпуск (например, 2..6 из первых шести):  ./make.sh ep 2
# Голос: если задан ELEVENLABS_API_KEY, то ElevenLabs (живее), иначе Microsoft Edge (без лимитов).
#   export ELEVENLABS_API_KEY=...   (один раз, можно в ~/.zshrc)
# Готовые ролики и подписи: out/epNN_ru.mp4, out/epNN_kk.mp4, out/epNN_*.txt
set -e
cd "$(dirname "$0")"
N=${1:-1}
build_one() {  # $1 = индекс выпуска с 0
  for lang in ru kk; do
    if [ -n "$ELEVENLABS_API_KEY" ]; then python3 build.py $1 $lang --eleven
    else python3 build.py $1 $lang --edge $([ $lang = ru ] && echo ru-RU-DmitryNeural || echo kk-KZ-DauletNeural); fi
  done
}
if [ "$1" = "ep" ]; then  # ./make.sh ep 3  пересобрать уже существующий выпуск №3
  build_one $(( $2 - 1 )); exit 0
fi
export PATH="$HOME/Library/Python/3.12/bin:$HOME/.local/bin:$PATH"
before=$(python3 -c "import json,os;print(len(json.load(open('episodes.json'))) if os.path.exists('episodes.json') else 0)")
python3 pick.py --auto "$N"
after=$(python3 -c "import json;print(len(json.load(open('episodes.json'))))")
for ((i=before; i<after; i++)); do build_one $i; done
echo "Готово: выпуски $((before+1))..$after в папке out/"
