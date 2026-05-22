import { supabase } from './supabase.js';

export async function registrarPresenca(userId, localId, tipo, latitude, longitude) {
  try {
    const { data, error } = await supabase
      .from('registros')
      .insert([
        {
          user_id: userId,
          local_id: localId,
          tipo: tipo,
          latitude: latitude,
          longitude: longitude,
          data_hora: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (tipo === 'saida') {
      const entradaRegistro = await buscarUltimoRegistro(userId, 'entrada');
      if (entradaRegistro) {
        await atualizarTempoPermanencia(entradaRegistro.id, entradaRegistro.data_hora);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao registrar presença:', error);
    return { data: null, error };
  }
}

let lastRegistryCache = {};

export async function buscarUltimoRegistro(userId, tipo = null) {
  const cacheKey = `${userId}-${tipo || 'any'}`;
  const now = Date.now();

  if (lastRegistryCache[cacheKey] && (now - lastRegistryCache[cacheKey].time < 10000)) {
    return lastRegistryCache[cacheKey].data;
  }

  try {
    let query = supabase
      .from('registros')
      .select('*, locais (nome)')
      .eq('user_id', userId)
      .order('data_hora', { ascending: false })
      .limit(1);

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const result = data && data.length > 0 ? data[0] : null;
    lastRegistryCache[cacheKey] = { data: result, time: now };
    return result;
  } catch (error) {
    console.error('Erro ao buscar último registro:', error);
    return null;
  }
}

export async function buscarRegistros(userId, filters = {}) {
  try {
    let query = supabase
      .from('registros')
      .select('*, locais (nome), users (nome)')
      .eq('user_id', userId)
      .order('data_hora', { ascending: false });

    if (filters.dataInicio) {
      query = query.gte('data_hora', filters.dataInicio);
    }

    if (filters.dataFim) {
      query = query.lte('data_hora', filters.dataFim);
    }

    if (filters.localId) {
      query = query.eq('local_id', filters.localId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return { data: null, error };
  }
}

export async function buscarTodosRegistros(filters = {}) {
  try {
    let query = supabase
      .from('registros')
      .select('*, locais (nome), users (nome, email)')
      .order('data_hora', { ascending: false });

    if (filters.dataInicio) {
      query = query.gte('data_hora', filters.dataInicio);
    }

    if (filters.dataFim) {
      query = query.lte('data_hora', filters.dataFim);
    }

    if (filters.localId) {
      query = query.eq('local_id', filters.localId);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar todos os registros:', error);
    return { data: null, error };
  }
}

async function atualizarTempoPermanencia(registroId, dataHoraEntrada) {
  try {
    const agora = new Date();
    const entrada = new Date(dataHoraEntrada);
    const diffMs = agora - entrada;
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const tempoFormatado = `${horas}h ${minutos}m`;

    await supabase
      .from('registros')
      .update({
        tempo_permanencia: tempoFormatado,
      })
      .eq('id', registroId);
  } catch (error) {
    console.error('Erro ao atualizar tempo de permanência:', error);
  }
}

export async function buscarLocaisAutorizados(locaisIds) {
  try {
    if (!locaisIds || locaisIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .in('id', locaisIds);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    return { data: [], error };
  }
}

export function formatarTempoPermanencia(dataHoraEntrada, dataHoraSaida) {
  if (!dataHoraEntrada) return '-';
  
  const entrada = new Date(dataHoraEntrada);
  const saida = dataHoraSaida ? new Date(dataHoraSaida) : new Date();
  const diffMs = saida - entrada;
  
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${horas}h ${minutos}m`;
}

export function formatarDataHora(dataIso) {
  if (!dataIso) return '-';
  
  const data = new Date(dataIso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarData(dataIso) {
  if (!dataIso) return '-';
  
  const data = new Date(dataIso);
  return data.toLocaleDateString('pt-BR');
}

export function formatarHora(dataIso) {
  if (!dataIso) return '-';
  
  const data = new Date(dataIso);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
