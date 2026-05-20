export function exportarParaCSV(registros, nomeArquivo = 'registros_presenca.csv') {
  if (!registros || registros.length === 0) {
    console.error('Nenhum registro para exportar');
    return;
  }

  const cabecalho = 'nome_usuario,data_hora,local,tipo,tempo_permanencia';
  
  const linhas = registros.map((registro) => {
    const nomeUsuario = registro.users?.nome || 'N/A';
    const dataHora = formatarDataHora(registro.data_hora);
    const local = registro.locais?.nome || 'N/A';
    const tipo = registro.tipo || 'N/A';
    const tempoPermanencia = registro.tempo_permanencia || '-';
    
    return `"${nomeUsuario}","${dataHora}","${local}","${tipo}","${tempoPermanencia}"`;
  });

  const csv = [cabecalho, ...linhas].join('\n');
  
  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatarDataHora(dataIso) {
  if (!dataIso) return '-';
  
  const data = new Date(dataIso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatarDataParaNomeArquivo(data = new Date()) {
  const year = data.getFullYear();
  const month = String(data.getMonth() + 1).padStart(2, '0');
  const day = String(data.getDate()).padStart(2, '0');
  const hours = String(data.getHours()).padStart(2, '0');
  const minutes = String(data.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}`;
}
