#!/usr/bin/env python3
"""Baixa todas as imagens do site antigo (Wix) para assets/img/original/.

Uso: python3 scripts/baixar-imagens-wix.py [arquivo-html-local]
Sem argumento, baixa o HTML de https://www.flaviotomazi.com.br/.
A versão original de cada imagem fica em https://static.wixstatic.com/media/<ID>.
"""
import os
import re
import sys
import urllib.request

SITE = "https://www.flaviotomazi.com.br/"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "img", "original")

# Títulos em imagem: não reutilizar (recriados em texto)
IGNORAR = {
    "b08f73_39e0619cd58146a699367739bfcf6849~mv2.png",
    "b08f73_776ce1c54e17481585a782f6d0b62bd7~mv2.png",
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    if len(sys.argv) > 1:
        html = open(sys.argv[1], encoding="utf-8").read()
    else:
        html = get(SITE).decode("utf-8", "replace")
    ids = sorted(set(re.findall(r"static\.wixstatic\.com/media/([A-Za-z0-9_\-]+~mv2[A-Za-z0-9_\-]*\.(?:png|jpe?g|webp|gif))", html)))
    os.makedirs(DEST, exist_ok=True)
    for media_id in ids:
        if media_id in IGNORAR:
            print("ignorado (título em imagem):", media_id)
            continue
        out = os.path.join(DEST, media_id.replace("~", "_"))
        if os.path.exists(out):
            continue
        try:
            data = get("https://static.wixstatic.com/media/" + media_id)
            with open(out, "wb") as f:
                f.write(data)
            print("ok", media_id, len(data))
        except Exception as e:  # noqa: BLE001
            print("falhou", media_id, e)


if __name__ == "__main__":
    main()
