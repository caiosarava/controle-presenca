-- ============================================
-- SCRIPT COMPLETO: Controle de Acesso Diferenciado
-- Admin: vê todos os usuários
-- Normal: vê apenas o próprio
-- ============================================

-- 1. Preparação: Desabilitar RLS e limpar policies antigas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 2. Remover trigger/função antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_total_usuarios();
DROP FUNCTION IF EXISTS public.get_presenca_dia();

-- 3. Criar função is_admin() - ESENCIAL para evitar recursão
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Retorna true se o usuário atual tem role='admin'
  -- Esta consulta é segura porque usa a tabela public.users
  -- que já está sendo protegida pelas policies
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar função para retornar total de usuários (admin)
CREATE OR REPLACE FUNCTION public.get_total_usuarios()
RETURNS BIGINT AS $$
BEGIN
  -- Admin pode ver total, normal vê apenas 1 (si mesmo)
  IF public.is_admin() THEN
    RETURN (SELECT COUNT(*) FROM public.users);
  ELSE
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar função para contar presenças do dia (entradas)
CREATE OR REPLACE FUNCTION public.get_presenca_dia()
RETURNS BIGINT AS $$
BEGIN
  -- Conta quantos usuários distintos marcaram entrada hoje
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM public.registros
    WHERE DATE(data_hora) = CURRENT_DATE
    AND tipo = 'entrada'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para criar novo usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, role, locais_autorizados)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nome', ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'normal',  -- Todo novo usuário começa como 'normal'
    '{}'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome = EXCLUDED.nome;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Criar policies COM LÓGICA CORRETA

-- 8.1. SELECT: usuário vê o próprio registro SEMPRE
CREATE POLICY "users_select_own" ON public.users
FOR SELECT
USING (id = auth.uid());

-- 8.2. SELECT: admin vê TODOS os usuários
CREATE POLICY "users_select_all_admin" ON public.users
FOR SELECT
USING (public.is_admin());

-- 8.3. INSERT: apenas o próprio usuário (usado pelo trigger)
CREATE POLICY "users_insert_own" ON public.users
FOR INSERT
WITH CHECK (id = auth.uid());

-- 8.4. UPDATE: admin pode atualizar qualquer um
CREATE POLICY "users_update_admin" ON public.users
FOR UPDATE
USING (public.is_admin());

-- 8.5. UPDATE: usuário pode atualizar a si mesmo
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE
USING (id = auth.uid());

-- 8.6. DELETE: apenas admin pode deletar
CREATE POLICY "users_delete_admin" ON public.users
FOR DELETE
USING (public.is_admin());

-- 9. Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 10. Criar/atualizar perfis para usuários existentes
INSERT INTO public.users (id, email, nome, role, locais_autorizados)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'nome', ''),
    SPLIT_PART(au.email, '@', 1)
  ),
  'normal',
  '{}'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    nome = EXCLUDED.nome;

-- 11. Garantir que você tem role='admin'
UPDATE public.users
SET role = 'admin'
WHERE email = 'caio.sarava@gmail.com';

-- 12. Verificações finais

-- 12.1. Listar todos os usuários com status
SELECT
  u.email,
  u.nome,
  u.role,
  CASE
    WHEN a.id IS NOT NULL THEN 'OK'
    ELSE 'SEM AUTH'
  END as auth_status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
ORDER BY u.created_at DESC;

-- 12.2. Testar função is_admin()
SELECT
  u.email,
  u.role,
  public.is_admin() as is_admin_test
FROM public.users u
WHERE u.email = 'caio.sarava@gmail.com';

-- 12.3. Contar total de usuários
SELECT 'Total de usuários' as descricao, COUNT(*) as total
FROM public.users
UNION ALL
SELECT 'Total de admins' as descricao, COUNT(*) as total
FROM public.users
WHERE role = 'admin';

-- 12.4. Testar função de presença do dia
SELECT
  'Presenças hoje (entradas)' as descricao,
  public.get_presenca_dia() as total;
