-- ============================================
-- CORREÇÃO: Habilitar listagem de todos usuários
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Criar função para listar todos os usuários do auth
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER -- Executa com permissões de admin
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Dropar policies antigas para users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;

-- 3. Recriar policies simplificadas
-- Policy para o próprio usuário se ver
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy para admin ver todos (usando EXISTS para evitar recursão)
CREATE POLICY "users_select_all_admin" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.role = 'admin'
    )
  );

-- Policy para insert
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy para update (admin ou o próprio)
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.role = 'admin'
    )
    OR auth.uid() = id
  );

-- 4. Criar perfis para todos os usuários do auth que não têm
INSERT INTO public.users (id, email, nome, role, locais_autorizados)
SELECT 
  au.id,
  au.email,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'nome', ''),
    SPLIT_PART(au.email, '@', 1),
    'Usuário'
  ),
  COALESCE(
    (SELECT role FROM public.users pu WHERE pu.id = au.id),
    'normal'
  ),
  '{}'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  nome = EXCLUDED.nome;

-- 5. Verificar todos os usuários
SELECT 
  'Auth Users' as tabela,
  COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
  'Public Users' as tabela,
  COUNT(*) as quantidade
FROM public.users;

-- 6. Listar todos os usuários com detalhes
SELECT 
  au.id,
  au.email,
  COALESCE(pu.nome, au.raw_user_meta_data->>'nome', 'Sem nome') as nome,
  COALESCE(pu.role, 'normal') as role,
  CASE 
    WHEN pu.id IS NULL THEN 'Sem perfil na tabela public.users'
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
