import { supabase } from './supabase.js';

export async function buscarUsuarios() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, locais_autorizados');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { data: null, error };
  }
}

export async function buscarUsuarioPorId(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { data: null, error };
  }
}

export async function atualizarUsuario(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { data: null, error };
  }
}

export async function criarUsuario(userData) {
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          nome: userData.nome,
          role: userData.role || 'normal',
          locais_autorizados: userData.locais_autorizados || [],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { data: null, error };
  }
}

export async function deletarUsuario(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return { error };
  }
}

export async function buscarLocais() {
  try {
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    return { data: null, error };
  }
}

export async function buscarLocalPorId(localId) {
  try {
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .eq('id', localId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    return { data: null, error };
  }
}

export async function criarLocal(localData) {
  try {
    const { data, error } = await supabase
      .from('locais')
      .insert([localData])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar local:', error);
    return { data: null, error };
  }
}

export async function atualizarLocal(localId, updates) {
  try {
    const { data, error } = await supabase
      .from('locais')
      .update(updates)
      .eq('id', localId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    return { data: null, error };
  }
}

export async function deletarLocal(localId) {
  try {
    const { error } = await supabase
      .from('locais')
      .delete()
      .eq('id', localId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar local:', error);
    return { error };
  }
}

export async function buscarEstatisticas() {
  try {
    // Usar função SQL para contar usuários (respeita RLS)
    const { data: totalUsuariosData, error: erroUsuarios } = await supabase.rpc('get_total_usuarios');
    const totalUsuarios = erroUsuarios ? 0 : (totalUsuariosData || 0);

    const { data: totalLocais } = await supabase
      .from('locais')
      .select('*', { count: 'exact', head: true });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: registrosHoje } = await supabase
      .from('registros')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora', hoje.toISOString());

    return {
      totalUsuarios: totalUsuarios || 0,
      totalLocais: totalLocais || 0,
      registrosHoje: registrosHoje || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}

export async function buscarPresencaDia() {
  try {
    // Usar função SQL para contar presenças do dia
    const { data, error } = await supabase.rpc('get_presenca_dia');
    
    if (error) throw error;
    
    return data || 0;
  } catch (error) {
    console.error('Erro ao buscar presença do dia:', error);
    return 0;
  }
}

export async function buscarRegistrosPorPeriodo(dias = 7) {
  try {
    const hoje = new Date();
    const dataInicio = new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('registros')
      .select('tipo, data_hora')
      .gte('data_hora', dataInicio.toISOString());
    
    if (error) throw error;

    const registrosPorDia = {};
    const registrosPorTipo = { entrada: 0, saida: 0 };

    data.forEach((registro) => {
      const data = new Date(registro.data_hora).toLocaleDateString('pt-BR');
      registrosPorDia[data] = (registrosPorDia[data] || 0) + 1;
      registrosPorTipo[registro.tipo]++;
    });

    return {
      porDia: registrosPorDia,
      porTipo: registrosPorTipo,
    };
  } catch (error) {
    console.error('Erro ao buscar registros por período:', error);
    return null;
  }
}

export async function buscarUltimosRegistros(limite = 10) {
  try {
    const { data, error } = await supabase
      .from('registros')
      .select(`
        *,
        locais (nome),
        users (nome)
      `)
      .order('data_hora', { ascending: false })
      .limit(limite);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar últimos registros:', error);
    return { data: null, error };
  }
}
