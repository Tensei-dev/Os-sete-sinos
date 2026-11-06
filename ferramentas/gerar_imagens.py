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
os.environ.setdefault("HF_HOME", str(RAIZ / ".ia" / "hf"))

import torch  # noqa: E402
from diffusers import AutoencoderKL, DPMSolverMultistepScheduler, StableDiffusionXLPipeline  # noqa: E402

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


def cenas():
    tabela = (IMG / "LEIA-ME.md").read_text(encoding="utf-8")
    return dict(re.findall(r"^\| `(\w+)` \| (.+?) \|$", tabela, re.M))


def carregar():
    vae = AutoencoderKL.from_pretrained(VAE, dtype=torch.float16, use_safetensors=True)
    pipe = StableDiffusionXLPipeline.from_pretrained(
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


def responder(**dados):
    print("@@" + json.dumps(dados), flush=True)


def pintor():
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
