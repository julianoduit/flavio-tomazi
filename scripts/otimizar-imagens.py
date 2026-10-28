#!/usr/bin/env python3
"""Gera as imagens otimizadas do site a partir de assets/img/original/.

Requer Python 3.10+ e Pillow 11.3+ (com suporte a WebP e AVIF):
    pip install --upgrade pillow
Uso (na raiz do projeto):
    python3 scripts/otimizar-imagens.py

Saídas:
    assets/img/dr/          fotos do Dr. (WebP e AVIF em vários tamanhos)
    assets/img/logo/        logo branco e colorido
    assets/img/resultados/  antes e depois (WebP e AVIF, 480/768/1080)
    assets/img/fundo/       fundo do hero no desktop
    assets/img/og/          imagem Open Graph 1200x630
    assets/img/icons/       favicons e ícones do manifest
    favicon.ico             na raiz
"""
import os

from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ORIG = os.path.join(RAIZ, "assets", "img", "original")
IMG = os.path.join(RAIZ, "assets", "img")
FONTE = os.path.join(RAIZ, "assets", "fonts", "montserrat-latin-var.woff2")

GRAFITE = (43, 43, 43)
AMBAR = (247, 181, 18)

DR_TERNO = "b08f73_a6ea223f8ee7482cb2ac931bdd952586_mv2.png"
DR_JALECO = "b08f73_9ece7d2cc2ea488399590f2ac768052d_mv2.png"
LOGO_BRANCO = "b08f73_d3d280e8fdc9462489340acf50a61bbb_mv2.png"
LOGO_COLORIDO = "fc0d26_9a7514a5c8854d7fb91e3bf4f3c0ab76_mv2.png"
FUNDO_HERO = "fc0d26_1cba2493aa6940b688602cb145521a72_mv2_d_4638_2446_s_4_2.png"

# Antes e depois, na ordem em que aparecem no site antigo
RESULTADOS = [
    "fc0d26_12f5940113e84be9895b8a0be8d56a43_mv2.webp",
    "fc0d26_05a57e374b6f4c69a725725ee6e5aa65_mv2.webp",
    "fc0d26_7c2d90fa0c9940cea6f106de7972bc88_mv2.webp",
    "b08f73_0c020cec55b846579315e82fdfa0df10_mv2.png",
    "b08f73_93f6f1464f2f438b897bd3a13463a242_mv2.png",
    "b08f73_6d35148a7fd6440396ab445b1bab6356_mv2.png",
    "b08f73_d4734520834b460e989cd2b6c2eed264_mv2.png",
    "b08f73_a16da8d786254b40ad21bf911ee748ce_mv2.png",
    "b08f73_26bc0a27bd2f473f98ba2b68d557c0e7_mv2.png",
    "b08f73_9914970f48ee4f819f4736a2667fa14d_mv2.png",
    "b08f73_f64fe1fe3e894883a19cba4aa5a1449f_mv2.png",
    "b08f73_b8dc0c8fb1b14081a5027d9654333377_mv2.png",
    "b08f73_862524d487984fddab6675263b0a153f_mv2.png",
    "b08f73_2e56bb8f59524a488e3353dcf3142bfc_mv2.png",
    "b08f73_365b8c521deb4fcc9438662d788c8be8_mv2.png",
    "b08f73_450cb29b18264f58b4bca57366b0e858_mv2.png",
    "b08f73_34ecb43f2deb475aab71f2e666c375a4_mv2.png",
    "b08f73_9c05ecd2a47246c9966452fdf66aa8b1_mv2.png",
    "b08f73_e1752902e4c1448f9f053a20105d8a4b_mv2.png",
    "b08f73_8c76a43786614bb79d65a6a365be0c7b_mv2.png",
]


def abrir(nome):
    return Image.open(os.path.join(ORIG, nome))


def recortar_alpha(im):
    im = im.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def salvar_variantes(im, pasta, base, larguras, avif=True, q_webp=80, q_avif=55):
    """Salva base-<w>.webp (e .avif) para cada largura <= largura original."""
    os.makedirs(pasta, exist_ok=True)
    feitas = []
    for w in larguras:
        if w > im.width:
            w = im.width
        if w in feitas:
            continue
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(os.path.join(pasta, f"{base}-{w}.webp"), "WEBP", quality=q_webp, method=6)
        if avif:
            r.save(os.path.join(pasta, f"{base}-{w}.avif"), "AVIF", quality=q_avif, speed=4)
        feitas.append(w)
        print(f"  {base}-{w} ({w}x{h})")
    return feitas


def fotos_dr():
    print("Fotos do Dr.")
    pasta = os.path.join(IMG, "dr")
    terno = recortar_alpha(abrir(DR_TERNO))
    salvar_variantes(terno, pasta, "dr-flavio-terno", [360, 540, 720, 1080])
    jaleco = recortar_alpha(abrir(DR_JALECO))
    salvar_variantes(jaleco, pasta, "dr-flavio-jaleco", [360, 540, 720, 965])
    return terno


def logos():
    print("Logos")
    pasta = os.path.join(IMG, "logo")
    os.makedirs(pasta, exist_ok=True)
    branco = recortar_alpha(abrir(LOGO_BRANCO))
    for w in (170, 340):
        h = round(branco.height * w / branco.width)
        r = branco.resize((w, h), Image.LANCZOS)
        r.save(os.path.join(pasta, f"logo-branco-{w}.webp"), "WEBP", quality=90, method=6)
        r.save(os.path.join(pasta, f"logo-branco-{w}.png"), "PNG", optimize=True)
        print(f"  logo-branco-{w} ({w}x{h})")
    colorido = recortar_alpha(abrir(LOGO_COLORIDO))
    colorido.save(os.path.join(pasta, "logo-colorido.png"), "PNG", optimize=True)
    return branco


def resultados():
    print("Antes e depois")
    pasta = os.path.join(IMG, "resultados")
    for i, nome in enumerate(RESULTADOS, 1):
        im = abrir(nome).convert("RGB")
        salvar_variantes(im, pasta, f"resultado-{i:02d}", [480, 768, 1080], q_webp=78, q_avif=50)


def fundo_hero():
    print("Fundo do hero")
    pasta = os.path.join(IMG, "fundo")
    im = abrir(FUNDO_HERO).convert("RGBA")
    base = Image.new("RGBA", im.size, GRAFITE + (255,))
    base.alpha_composite(im)
    salvar_variantes(base.convert("RGB"), pasta, "consultorio", [1200, 1920], q_webp=60, q_avif=40)


def chapeu(logo_branco):
    """Recorta o símbolo (chapéu) do logo para os favicons."""
    px = logo_branco.load()
    xs, ys = [], []
    for y in range(logo_branco.height):
        for x in range(logo_branco.width):
            r, g, b, a = px[x, y]
            if a > 100 and r > 180 and 120 < g < 210 and b < 90:
                xs.append(x)
                ys.append(y)
    # inclui a aba cinza escura abaixo do amarelo
    x0, x1 = min(xs) - 40, max(xs) + 40
    y0, y1 = min(ys) - 8, max(ys) + 60
    sim = logo_branco.crop((x0, y0, x1, y1))
    bbox = sim.getchannel("A").getbbox()
    return sim.crop(bbox)


def icones(logo_branco):
    print("Favicons")
    pasta = os.path.join(IMG, "icons")
    os.makedirs(pasta, exist_ok=True)
    sim = chapeu(logo_branco)

    def quadro(tamanho, margem, fundo=GRAFITE, raio=0):
        tela = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
        if fundo:
            m = Image.new("L", (tamanho, tamanho), 0)
            ImageDraw.Draw(m).rounded_rectangle((0, 0, tamanho - 1, tamanho - 1), raio, fill=255)
            tela.paste(Image.new("RGBA", (tamanho, tamanho), fundo + (255,)), (0, 0), m)
        area = int(tamanho * (1 - 2 * margem))
        s = sim.copy()
        s.thumbnail((area, area), Image.LANCZOS)
        tela.alpha_composite(s, ((tamanho - s.width) // 2, (tamanho - s.height) // 2))
        return tela

    quadro(180, 0.14).convert("RGB").save(os.path.join(pasta, "apple-touch-icon.png"), optimize=True)
    quadro(192, 0.12, raio=36).save(os.path.join(pasta, "icon-192.png"), optimize=True)
    quadro(512, 0.12, raio=96).save(os.path.join(pasta, "icon-512.png"), optimize=True)
    quadro(512, 0.22).save(os.path.join(pasta, "icon-maskable-512.png"), optimize=True)
    quadro(32, 0.04, raio=6).save(os.path.join(pasta, "favicon-32.png"), optimize=True)
    ico = quadro(256, 0.06, raio=40)
    ico.save(os.path.join(RAIZ, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("  ok")


def og_image(terno, logo_branco):
    print("Imagem Open Graph")
    pasta = os.path.join(IMG, "og")
    os.makedirs(pasta, exist_ok=True)
    W, H = 1200, 630
    tela = Image.new("RGBA", (W, H), GRAFITE + (255,))
    d = ImageDraw.Draw(tela)
    # faixa âmbar decorativa
    d.ellipse((760, 70, 1260, 760), fill=AMBAR + (255,))
    foto = terno.copy()
    foto.thumbnail((560, 600), Image.LANCZOS)
    tela.alpha_composite(foto, (W - foto.width - 40, H - foto.height))
    logo = logo_branco.copy()
    logo.thumbnail((250, 160), Image.LANCZOS)
    tela.alpha_composite(logo, (70, 60))
    try:
        f_titulo = ImageFont.truetype(FONTE, 52)
        f_titulo.set_variation_by_axes([700])
        f_sub = ImageFont.truetype(FONTE, 28)
        f_sub.set_variation_by_axes([500])
    except Exception:  # noqa: BLE001
        f_titulo = f_sub = ImageFont.load_default(size=40)
    d.text((70, 280), "Cirurgião\nBucomaxilofacial\nem Criciúma", font=f_titulo, fill=(255, 255, 255), spacing=8)
    d.text((70, 490), "Especialista, Mestre e Doutor em CTBMF", font=f_sub, fill=AMBAR)
    d.text((70, 530), "Dr. Flávio Tomazi | CRO/SC 10818", font=f_sub, fill=(242, 242, 242))
    tela.convert("RGB").save(os.path.join(pasta, "og-flavio-tomazi.jpg"), "JPEG", quality=85, optimize=True, progressive=True)
    print("  ok")


def main():
    terno = fotos_dr()
    branco = logos()
    resultados()
    fundo_hero()
    icones(branco)
    og_image(terno, branco)


if __name__ == "__main__":
    main()
