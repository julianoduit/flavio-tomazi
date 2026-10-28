#!/usr/bin/env python3
"""Confere se o FAQPage do JSON-LD tem exatamente o mesmo texto do FAQ visível.

Uso, na raiz do projeto:
    python3 scripts/verificar-faq.py

O Google exige que o conteúdo marcado no schema seja idêntico ao exibido na página.
Rode depois de editar qualquer pergunta ou resposta.
"""
import html
import json
import os
import re
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAGINAS = ["index.html", "cirurgia-ortognatica/index.html"]


def limpar(t):
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    t = re.sub(r"</p>\s*<p>", " ", t)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def verificar(rel):
    texto = open(os.path.join(RAIZ, rel), encoding="utf-8").read()
    faq_html = re.search(r'<div class="faq">(.*?)\n\s*</div>\n\s*</div>\n\s*</section>', texto, re.S)
    if not faq_html:
        return [f"{rel}: bloco .faq não encontrado"]
    visiveis = [
        (limpar(q), limpar(r))
        for q, r in re.findall(r"<summary><h3>(.*?)</h3></summary>\s*<div class=\"faq-resposta\">(.*?)</div>", faq_html.group(1), re.S)
    ]
    schema = None
    for bloco in re.findall(r'<script type="application/ld\+json">(.*?)</script>', texto, re.S):
        dados = json.loads(bloco)
        for no in dados.get("@graph", [dados]):
            if no.get("@type") == "FAQPage":
                schema = [(q["name"], q["acceptedAnswer"]["text"]) for q in no["mainEntity"]]
    if schema is None:
        return [f"{rel}: FAQPage não encontrado no JSON-LD"]
    erros = []
    if len(schema) != len(visiveis):
        erros.append(f"{rel}: {len(visiveis)} perguntas na página e {len(schema)} no schema")
    for (qv, rv), (qs, rs) in zip(visiveis, schema):
        if qv != qs:
            erros.append(f"{rel}: pergunta diferente\n  página: {qv}\n  schema: {qs}")
        if rv != rs:
            erros.append(f"{rel}: resposta diferente em '{qv}'\n  página: {rv}\n  schema: {rs}")
    return erros


def main():
    erros = []
    for p in PAGINAS:
        erros += verificar(p)
    if erros:
        print("\n".join(erros))
        sys.exit(1)
    print("FAQ e schema idênticos em", ", ".join(PAGINAS))


if __name__ == "__main__":
    main()
