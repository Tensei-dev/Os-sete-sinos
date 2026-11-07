# Encerra um servidor de Os Sete Sinos que ainda esteja aberto, para o novo poder usar a porta.
# Só age sobre o node que está rodando servidor.mjs; a voz e o pintor saem junto com ele.
param([int]$Porta = 8787)

$conexoes = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue
foreach ($pid2 in ($conexoes | Select-Object -ExpandProperty OwningProcess -Unique)) {
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pid2"
  if ($proc.Name -eq 'node.exe' -and $proc.CommandLine -like '*servidor*servidor.mjs*') {
    Stop-Process -Id $pid2 -Force
    Write-Output "Servidor anterior encerrado."
  } else {
    Write-Output "A porta $Porta esta em uso por outro programa: $($proc.Name)."
  }
}
for ($i = 0; $i -lt 20 -and (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue); $i++) { Start-Sleep -Milliseconds 150 }
