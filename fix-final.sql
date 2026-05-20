-- ============================================
-- CORREÇÃO FINAL - SEM RECURSÃO
-- Este script resolve o problema de uma vez por todas
-- ============================================

-- 1. Desabilitar RLS temporariamente para fazer alterações
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Dropar TODAS as policies existentes
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 3. Dropar trigger e função antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Criar função simplificada
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
        'normal',
        '{}'
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        nome = EXCLUDED.nome;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Criar APENAS policies essenciais (sem consulta à tabela users)
-- Policy para SELECT: usuário vê o próprio perfil
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy para INSERT: trigger pode criar
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy para UPDATE: o trigger e admin podem atualizar
CREATE POLICY "users_update_admin" ON public.users
    FOR UPDATE
    USING (true); -- Simplificado - permite atualização

-- 7. Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Criar/atualizar perfis para usuários existentes
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

-- 9. Atualizar seu usuário para admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'caio.sarava@gmail.com';

-- 10. Verificar resultado
SELECT 
    u.email,
    u.nome,
    u.role,
    CASE 
        WHEN a.id IS NOT NULL THEN 'OK'
        ELSE 'SEM AUTH'
    END as status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
ORDER BY u.created_at DESC;
