"""Voz do mestre: mantém o modelo Kokoro carregado e atende o servidor local.

Recebe uma linha JSON {"texto", "arquivo"} pela entrada, grava o áudio e responde com linhas
iniciadas por @@. Roda na CPU, para não disputar a memória de vídeo com o pintor de imagens.
Uso: .ia\\venv-voz\\Scripts\\python.exe -I ferramentas\\voz.py [voz]
"""
import json
import os
import re
import sys
import wave
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
os.environ.setdefault("HF_HOME", str(RAIZ / ".ia" / "hf"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")  # o modelo já está no PC: nada sai para a internet

import numpy as np  # noqa: E402
from kokoro import KPipeline  # noqa: E402

TAXA = 24000

# Ajustes da voz épica. Depois de mudar, reabra o jogo pelo iniciar.bat.
TOM = 0.8  # abaixo de 1 engrossa a voz (e também a deixa mais lenta)
VELOCIDADE = 1.0  # acima de 1 a fala fica mais rápida
PESO = 0.55  # reforço dos graves
SALAO = 0.14  # quantidade de reverberação
CAUDA = 0.22  # segundos de eco depois de cada frase

# Grafia que a voz lê melhor. Para corrigir uma pronúncia, acrescente o nome aqui.
PRONUNCIA = {
    "Vau-Claro": "Vau Claro",
    "Aldrec": "Áldrec",
    "Grolk": "Grólqui",
    "Dorn": "Dórn",
    "Odran": "Ódran",
    "Morrath": "Mórrat",
    "Orrin": "Órrin",
}
PADRAO = re.compile(r"\b(" + "|".join(re.escape(n) for n in PRONUNCIA) + r")\b")


def preparar(texto):
    texto = re.sub(r"\b(\d+) po\b", r"\1 peças de ouro", texto)
    texto = re.sub(r"\bCD (\d+)\b", r"classe de dificuldade \1", texto)
    texto = re.sub(r"\bd(\d+)\b", r"dado de \1", texto)
    return PADRAO.sub(lambda m: PRONUNCIA[m.group(1)], texto)


def media_movel(sinal, largura):
    return np.convolve(sinal, np.ones(largura) / largura, "same")


def salao():
    """Resposta de um salão de pedra: ruído que decai, com pouco agudo."""
    n = int(TAXA * 1.1)
    ruido = np.random.default_rng(7).normal(size=n) * np.exp(-np.arange(n) / (TAXA * 0.32))
    ruido = media_movel(ruido, 6)
    ruido[: int(TAXA * 0.035)] = 0  # as paredes respondem depois da voz
    return ruido / np.sqrt((ruido**2).sum())


def tratar(x):
    x = x / max(np.abs(x).max(), 1e-6) * 0.8
    x = np.tanh((x + PESO * media_movel(x, TAXA // 300)) * 1.5)  # segura os picos e dá presença
    cauda = int(TAXA * CAUDA)
    seco = np.concatenate([x, np.zeros(cauda)])
    ir = salao()
    tamanho = len(seco) + len(ir)
    molhado = np.fft.irfft(np.fft.rfft(seco, tamanho) * np.fft.rfft(ir, tamanho))[: len(seco)]
    y = seco + SALAO * molhado
    y[-cauda:] *= np.linspace(1, 0, cauda)
    return (y / max(np.abs(y).max(), 1e-6) * 0.95 * 32767).astype(np.int16)


def sintetizar(voz, nome, texto, destino):
    partes = [np.asarray(audio, dtype=np.float32) for _, _, audio in voz(texto, voice=nome, speed=VELOCIDADE)]
    with wave.open(destino, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(int(TAXA * TOM))  # tocar mais devagar baixa o tom e o timbre juntos
        w.writeframes(tratar(np.concatenate(partes)).tobytes())


def main():
    sys.stdin.reconfigure(encoding="utf-8")  # no Windows o padrão corromperia os acentos
    nome = sys.argv[1] if len(sys.argv) > 1 else "pm_santa"
    voz = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M", device="cpu")
    for linha in sys.stdin:  # termina quando o servidor fecha a entrada
        pedido = json.loads(linha)
        destino, temporario = pedido["arquivo"], pedido["arquivo"] + ".tmp"
        try:
            sintetizar(voz, nome, preparar(pedido["texto"]), temporario)
            os.replace(temporario, destino)
            print("@@" + json.dumps({"ok": True}), flush=True)
        except Exception as erro:  # uma frase ruim não pode calar o mestre
            print("@@" + json.dumps({"ok": False, "erro": str(erro)[:200]}), flush=True)


if __name__ == "__main__":
    main()
