-- ============================================
-- SQL PARA HABILITAR CADASTRO DE USUÁRIOS
-- Execute este script após o supabase-schema.sql
-- ============================================

-- Adicionar policy para permitir que usuários se cadastrem
-- Esta policy permite INSERT na tabela users para o próprio usuário

-- Drop policies existentes se necessário
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- Usuários podem criar seu próprio perfil ao se cadastrar
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Permitir que usuários atualizem seus próprios dados
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- CONFIGURAÇÃO DE SENHA NO SUPABASE
-- ============================================
-- No painel do Supabase, vá para:
-- Authentication > Settings > Password
-- Marque: "Enable password signups"
-- ============================================

-- ============================================
-- CRIAR PRIMEIRO ADMIN (OPCIONAL)
-- ============================================
-- Para criar o primeiro admin, execute:
-- 1. Crie um usuário normal via cadastro
-- 2. Atualize manualmente:
-- UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
-- ============================================
