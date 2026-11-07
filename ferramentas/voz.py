"""Voz do mestre: mantém o modelo Piper carregado e atende o servidor local.

Recebe uma linha JSON {"texto", "arquivo"} pela entrada, grava o áudio e responde com linhas
iniciadas por @@. Uso: .ia\\venv\\Scripts\\python.exe -I ferramentas\\voz.py <modelo.onnx>
"""
import json
import os
import re
import sys
import wave

from piper import PiperVoice, SynthesisConfig

VELOCIDADE = 1.1  # acima de 1 a fala fica mais lenta, no ritmo de narração

# Grafia que o Piper lê melhor. Para corrigir uma pronúncia, acrescente o nome aqui.
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


def main():
    voz = PiperVoice.load(sys.argv[1])
    config = SynthesisConfig(length_scale=VELOCIDADE)
    for linha in sys.stdin:  # termina quando o servidor fecha a entrada
        pedido = json.loads(linha)
        destino, temporario = pedido["arquivo"], pedido["arquivo"] + ".tmp"
        try:
            with wave.open(temporario, "wb") as arquivo:
                voz.synthesize_wav(preparar(pedido["texto"]), arquivo, syn_config=config)
            os.replace(temporario, destino)
            print("@@" + json.dumps({"ok": True}), flush=True)
        except Exception as erro:  # uma frase ruim não pode calar o mestre
            print("@@" + json.dumps({"ok": False, "erro": str(erro)[:200]}), flush=True)


if __name__ == "__main__":
    main()
