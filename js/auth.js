import { supabase } from './supabase.js';

export async function signIn(email, password) {
  try {
    // Fazer login
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!data.user) throw new Error('Usuário não encontrado');

    // Aguarda um pouco para garantir que o trigger foi executado
    await new Promise(resolve => setTimeout(resolve, 300));

    // Buscar perfil do usuário
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // Se não encontrar perfil, tenta criar
    if (!userData) {
      console.log('Perfil não encontrado, tentando criar...');
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email || email,
            nome: data.user.user_metadata?.nome || email.split('@')[0],
            role: 'normal',
            locais_autorizados: [],
          }
        ])
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        throw new Error('Não foi possível criar perfil. Contate o administrador.');
      }

      return { user: data.user, profile: newProfile, error: null };
    }

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao buscar perfil. Tente novamente.');
    }

    return { user: data.user, profile: userData, error: null };
  } catch (error) {
    console.error('Erro no login:', error);
    return { user: null, profile: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, profile: null, error };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile: userData, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { user: null, profile: null, error };
  }
}

export async function checkAuth() {
  const { user } = await getCurrentUser();
  
  if (!user) {
    window.location.href = '/index.html';
    return null;
  }

  return user;
}

export async function checkAdminAuth() {
  const { user, profile } = await getCurrentUser();
  
  if (!user || !profile || profile.role !== 'admin') {
    window.location.href = '/dashboard.html';
    return null;
  }

  return user;
}

export function getLocalStorageUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setLocalStorageUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function removeLocalStorageUser() {
  localStorage.removeItem('user');
}

export async function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export { supabase };
