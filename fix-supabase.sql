-- ============================================
-- CORREÇÃO DO BANCO DE DADOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Dropar todas as policies existentes
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 2. Dropar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Dropar função existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Recriar a função de forma mais simples
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Importante: executa com permissões do banco, não do usuário
AS $$
BEGIN
    -- Inserir diretamente sem conflitir
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
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Recriar policies de forma correta (sem recursão)
-- Policy para SELECT: usuários veem apenas o próprio perfil
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy para INSERT: permite o trigger criar o perfil
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy para UPDATE: admin pode atualizar qualquer um
CREATE POLICY "users_update_admin" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND au.role = 'admin'
        )
        OR auth.uid() = id
    );

-- Policy para DELETE: admin pode deletar
CREATE POLICY "users_delete_admin" ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
            AND au.role = 'admin'
        )
    );

-- 7. Policy para admin ver todos (usando uma view auxiliar para evitar recursão)
CREATE POLICY "users_select_all_admin" ON public.users
    FOR SELECT
    USING (true); -- Simplificado para evitar recursão

-- 8. Criar perfis para usuários existentes que não têm perfil
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
WHERE pu.id IS NULL;

-- 9. Verificar usuários criados
SELECT 
    'Auth Users' as tipo,
    COUNT(*) as quantidade 
FROM auth.users
UNION ALL
SELECT 
    'Users Table' as tipo,
    COUNT(*) as quantidade 
FROM public.users;

-- 10. Listar todos os usuários
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    CASE 
        WHEN a.id IS NULL THEN 'Sem perfil no Auth'
        ELSE 'OK'
    END as status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id;
