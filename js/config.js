// ===============================================
// CONFIGURAÇÃO DO SUPABASE
// ===============================================
// 1. Crie uma conta em https://supabase.com
// 2. Crie um novo projeto
// 3. Execute o script supabase-schema.sql no SQL Editor
// 4. Copie a URL e a Chave Anônima do projeto
// 5. Substitua os valores abaixo ou use variáveis de ambiente
// ===============================================

// Opção 1: Variáveis de ambiente (Vercel)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUA-CHAVE-ANONIMA';

// Raio padrão em metros (100m)
const GEO_RADIUS_DEFAULT = 100;

// Configuração do aplicativo
const CONFIG = {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
  defaultRadius: GEO_RADIUS_DEFAULT,
  appName: 'Controle de Presença',
  version: '1.0.0'
};

// Exportar para uso em outros módulos
export { CONFIG };
