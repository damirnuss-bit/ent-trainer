# Промо-ролик @enttrainer_bot (Reels 9:16)

Итог: 1080x1920, 30 fps, 39.6 с. Русская версия `anim.html`, казахская `anim_kk.html`.
Стиль по референсу: чёрный фон, лаймовые плашки #C8FF2E, HUD как у камеры (REC, кадр, кольцо-таймер), глитч на склейках, настоящие экраны приложения в телефоне.
Шрифты: RU Unbounded + JetBrains Mono; KK Montserrat Black + IBM Plex Mono (Unbounded не поддерживает казахские буквы).

Сборка:
```
python3 cap.py                 # скриншоты приложения (RU) в shots/;  LANG_=kk python3 cap.py -> shots_kk/
node render.js 0 1188          # кадры RU в frames/ (PAGE=anim_kk.html FR=frames_kk для KK); можно 4 процесса по диапазонам
python3 sfx3.py                # звук sfx3.wav (только сухие звуки для титров, без музыки)
ffmpeg -framerate 30 -i frames/f%04d.jpg -i sfx3.wav -c:v libx264 -b:v 9M -pix_fmt yuv420p -c:a aac -b:a 256k -t 39.6 out.mp4
```
Время в анимации: `window.render(t)`, t в секундах исходной шкалы 33 с; render.js вызывает t = кадр/36 (замедление 1.2).
