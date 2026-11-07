"""Gera as ilustrações de img/ na GPU local com Stable Diffusion XL.

Lê a tabela de cenas de img/LEIA-ME.md e pula as imagens que já existem.
Uso: .ia\\venv\\Scripts\\python.exe -I ferramentas\\gerar_imagens.py [chave ...] [--teste] [--refazer]
Com --pintor, fica com o modelo na memória e atende o servidor local: recebe uma linha JSON
{"chave", "cena"} pela entrada e responde com linhas iniciadas por @@.
"""
import json
import os
import re
import sys
import time
import zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "img"
VIVO = IMG / "vivo"
SAIDA_MAPAS = RAIZ / ".ia" / "repintura"  # o resultado só vai para img/ depois de revisado
os.environ.setdefault("HF_HOME", str(RAIZ / ".ia" / "hf"))

import torch  # noqa: E402
from diffusers import (  # noqa: E402
    AutoencoderKL,
    DPMSolverMultistepScheduler,
    StableDiffusionXLImg2ImgPipeline,
    StableDiffusionXLPipeline,
)
from PIL import Image, ImageEnhance, ImageFilter  # noqa: E402

BASE = "stabilityai/stable-diffusion-xl-base-1.0"
VAE = "madebyollin/sdxl-vae-fp16-fix"
ESTILO = (
    "dark fantasy digital painting, detailed RPG character art, ink linework, painterly shading, "
    "dramatic rim light, deep shadows, dark smoky atmosphere, drifting ash, muted earthy colors"
)
NEGATIVO = (
    "photo, 3d render, anime, chibi, cartoon, comic panel, poster, vector art, flat colors, flat background, "
    "border, frame, white background, text, letters, watermark, signature, logo, "
    "blurry, low quality, deformed, extra limbs, bad anatomy, bad hands, ugly face, nude, nsfw"
)


ESTILO_MAPA = (
    "aerial top-down view, dark fantasy digital painting, painted cartography, ink linework, "
    "muted earthy colors, olive and umber, dusk, low light, deep shadows, moody atmosphere, highly detailed, no text"
)
NEGATIVO_MAPA = (
    "pixel art, pixelated, blocky, 8-bit, grid, photo, 3d render, cartoon, bright saturated colors, neon, "
    "text, letters, labels, watermark, signature, logo, border, frame, people, characters, blurry, low quality"
)
# Os mapas são repintados sobre o desenho atual, para rios, ruas e prédios ficarem no mesmo lugar.
MAPAS = {
    "mapa_mundo": (1536, 1024, 0.52, "painted world map of a fantasy continent seen from high above, rugged coastline, deep blue sea, dark forests, grey snowy mountain ranges, winding rivers, dry plains, thin dirt roads"),
    "m_vila": (1344, 768, 0.6, "medieval river town seen from directly above, red tiled roofs, stone plaza with a bell tower, wooden bridge over a river, dirt streets, scattered trees"),
    "m_mata": (1344, 768, 0.6, "dense dark thorn forest seen from directly above, twisted tree canopy, narrow dirt trails, small mossy cabin in a clearing, four pale standing stones"),
    "m_toca": (1344, 768, 0.62, "underground goblin cave system floor plan seen from above, rough rock walls, dirt tunnels, campfire in a large chamber, rusty iron cage"),
    "m_abadia": (1344, 768, 0.6, "ruined stone abbey seen from directly above, broken walls, cloister courtyard with open graves, chapel, overgrown grass, dirt path"),
    "m_cripta": (1344, 768, 0.62, "ancient stone crypt floor plan seen from above, vaulted corridors, burial niches, ossuary filled with skulls, altar chamber with violet glow, torchlight"),
}


def cenas():
    tabela = (IMG / "LEIA-ME.md").read_text(encoding="utf-8")
    return dict(re.findall(r"^\| `(\w+)` \| (.+?) \|$", tabela, re.M))


def carregar(classe=StableDiffusionXLPipeline):
    vae = AutoencoderKL.from_pretrained(VAE, dtype=torch.float16, use_safetensors=True)
    pipe = classe.from_pretrained(
        BASE, vae=vae, dtype=torch.float16, variant="fp16", use_safetensors=True
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config, use_karras_sigmas=True, algorithm_type="dpmsolver++"
    )
    pipe.enable_model_cpu_offload()
    pipe.vae.enable_tiling()
    return pipe


def gerar(pipe, chave, descricao, pasta=IMG):
    semente = zlib.crc32(chave.encode())
    gerador = torch.Generator("cpu").manual_seed(semente)
    imagem = pipe(
        prompt=f"{descricao}, {ESTILO}",
        negative_prompt=NEGATIVO,
        width=1344,
        height=768,
        num_inference_steps=36,
        guidance_scale=7.0,
        generator=gerador,
    ).images[0]
    imagem.save(pasta / f"{chave}.webp", quality=90, method=6)


def repintar(chaves, forca_pedida=None):
    """Transforma o mapa atual (.ia/bases) em pintura, mantendo a geografia."""
    SAIDA_MAPAS.mkdir(exist_ok=True)
    pipe = carregar(StableDiffusionXLImg2ImgPipeline)
    for chave in chaves:
        largura, altura, forca, descricao = MAPAS[chave]
        forca = forca_pedida or forca
        t = time.time()
        base = Image.open(RAIZ / ".ia" / "bases" / f"{chave}.png").convert("RGB")
        base = base.resize((largura, altura), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
        base = ImageEnhance.Brightness(ImageEnhance.Color(base).enhance(0.62)).enhance(0.72)  # já parte da paleta escura
        imagem = pipe(
            prompt=f"{descricao}, {ESTILO_MAPA}",
            negative_prompt=NEGATIVO_MAPA,
            image=base,
            strength=forca,
            num_inference_steps=48,
            guidance_scale=7.0,
            generator=torch.Generator("cpu").manual_seed(zlib.crc32(chave.encode())),
        ).images[0]
        imagem.save(SAIDA_MAPAS / f"{chave}-{forca:.2f}.webp", quality=90, method=6)
        print(f"{chave} {forca:.2f} ({time.time() - t:.0f}s)", flush=True)


def responder(**dados):
    print("@@" + json.dumps(dados), flush=True)


def pintor():
    sys.stdin.reconfigure(encoding="utf-8")  # no Windows o padrão corromperia os acentos
    VIVO.mkdir(exist_ok=True)
    pipe = carregar()
    responder(pronto=True)
    for linha in sys.stdin:  # termina quando o servidor fecha a entrada
        pedido = json.loads(linha)
        try:
            gerar(pipe, pedido["chave"], pedido["cena"], VIVO)
            responder(chave=pedido["chave"], ok=True)
        except Exception as erro:  # uma pintura ruim não pode derrubar o pintor
            responder(chave=pedido["chave"], ok=False, erro=str(erro)[:200])


def main():
    args = sys.argv[1:]
    if "--pintor" in args:
        pintor()
        return
    if "--mapas" in args:
        forcas = [float(a) for a in args if a.replace(".", "").isdigit()]
        for forca in forcas or [None]:
            repintar([a for a in args if a in MAPAS] or list(MAPAS), forca)
        return
    refazer = "--refazer" in args
    teste = "--teste" in args
    pedidas = [a for a in args if not a.startswith("--")]
    todas = cenas()
    faltando = [c for c in pedidas if c not in todas]
    if faltando:
        sys.exit(f"Cena desconhecida: {', '.join(faltando)}")
    alvo = pedidas or list(todas)
    if teste:
        alvo = alvo[:1]
    if not refazer:
        alvo = [c for c in alvo if not (IMG / f"{c}.webp").exists()]
    if not alvo:
        print("Nada a gerar.")
        return
    print(f"Carregando o modelo para {len(alvo)} cenas...", flush=True)
    pipe = carregar()
    inicio = time.time()
    for n, chave in enumerate(alvo, 1):
        t = time.time()
        gerar(pipe, chave, todas[chave])
        print(f"[{n}/{len(alvo)}] {chave} ({time.time() - t:.0f}s)", flush=True)
    print(f"Pronto em {(time.time() - inicio) / 60:.1f} min.", flush=True)


if __name__ == "__main__":
    main()
