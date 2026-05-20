-- ============================================
-- SCRIPT DE CORREÇÃO RÁPIDA
-- Execute APENAS este script no Supabase
-- ============================================

-- 1. Deletar policies antigas para evitar recursão
DO $$ BEGIN
    DROP POLICY IF EXISTS "users_select_own" ON public.users;
    DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
    DROP POLICY IF EXISTS "users_update_admin" ON public.users;
    DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
    DROP POLICY IF EXISTS "users_insert_own" ON public.users;
    DROP POLICY IF EXISTS "users_update_own" ON public.users;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- 2. Deletar trigger e função antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar nova função simplificada
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

-- 4. Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Criar novas policies (simplificadas)
-- Policy para o usuário ver o próprio perfil
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Policy para admin ver todos
CREATE POLICY "users_select_all_admin" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Policy para insert (apenas o trigger usa)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- Policy para update (admin ou próprio usuário)
CREATE POLICY "users_update_admin" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
        OR id = auth.uid()
    );

-- 6. Criar perfis para usuários existentes
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

-- 7. Atualizar seu usuário para admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'caio.sarava@gmail.com';

-- 8. Verificar resultado
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
