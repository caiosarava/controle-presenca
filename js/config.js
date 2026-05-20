// ===============================================
// CONFIGURAÇÃO DO SUPABASE
// ===============================================
// 1. Crie uma conta em https://supabase.com
// 2. Crie um novo projeto
// 3. Execute o script supabase-schema.sql no SQL Editor
// 4. Copie a URL e a Chave Anônima do projeto
// 5. Substitua os valores abaixo
// ===============================================

// URL e Chave do Supabase
const SUPABASE_URL = 'https://nxgvbxkgfetmjjnadhhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Z3ZieGtnZmV0bWpqbmFkaGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTA5MTUsImV4cCI6MjA5NDc4NjkxNX0.t77ROt4sF92O4F2KgnoQwlPdf743CVsOW_Rg6x6_Urg';

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
