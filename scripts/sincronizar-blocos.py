#!/usr/bin/env python3
"""Sincroniza os blocos repetidos entre as páginas HTML (opcional).

O site funciona sem rodar este script: cada página já contém o HTML completo.
Ele só evita editar o mesmo trecho em vários arquivos. Uso, na raiz do projeto:

    python3 scripts/sincronizar-blocos.py

O que faz:
1. Substitui o conteúdo entre <!-- bloco:NOME --> e <!-- /bloco:NOME --> pelo
   arquivo scripts/partials/NOME.html. O bloco "critical" recebe o conteúdo de
   assets/css/critical.css dentro de uma tag <style>.
2. Atualiza o parâmetro ?v= dos arquivos CSS e JS com um hash do conteúdo,
   para o navegador baixar a versão nova depois de cada alteração (cache longo).
"""
import hashlib
import os
import re

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PARTIALS = os.path.join(RAIZ, "scripts", "partials")
IGNORAR_DIRS = {"scripts", "docs", "node_modules", ".git", "assets"}

BLOCO = re.compile(r"(<!-- bloco:([a-z0-9-]+) -->)(.*?)(<!-- /bloco:\2 -->)", re.S)
VERSAO = re.compile(r"(/assets/(?:css|js)/[a-z0-9-]+\.(?:css|js))\?v=[A-Za-z0-9]*")


def ler(caminho):
    with open(caminho, encoding="utf-8") as f:
        return f.read()


def conteudo_bloco(nome, indent):
    if nome == "critical":
        css = ler(os.path.join(RAIZ, "assets", "css", "critical.css")).strip()
        return "<style>" + css + "</style>"
    caminho = os.path.join(PARTIALS, nome + ".html")
    if not os.path.exists(caminho):
        raise SystemExit(f"Bloco sem arquivo: {caminho}")
    linhas = ler(caminho).strip("\n").split("\n")
    return ("\n" + indent).join(linhas)


def hash_arquivo(rel):
    caminho = os.path.join(RAIZ, rel.lstrip("/"))
    if not os.path.exists(caminho):
        return None
    with open(caminho, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def processar(caminho):
    original = ler(caminho)

    def troca(m):
        inicio_linha = original.rfind("\n", 0, m.start()) + 1
        indent = re.match(r"[ \t]*", original[inicio_linha:m.start()]).group(0)
        corpo = conteudo_bloco(m.group(2), indent)
        return f"{m.group(1)}\n{indent}{corpo}\n{indent}{m.group(4)}"

    novo = BLOCO.sub(troca, original)

    def versao(m):
        h = hash_arquivo(m.group(1))
        return f"{m.group(1)}?v={h}" if h else m.group(0)

    novo = VERSAO.sub(versao, novo)
    if novo != original:
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(novo)
        print("atualizado:", os.path.relpath(caminho, RAIZ))


def main():
    for pasta, dirs, arquivos in os.walk(RAIZ):
        rel = os.path.relpath(pasta, RAIZ)
        if rel.split(os.sep)[0] in IGNORAR_DIRS:
            dirs[:] = []
            continue
        for nome in arquivos:
            if nome.endswith(".html"):
                processar(os.path.join(pasta, nome))


if __name__ == "__main__":
    main()
