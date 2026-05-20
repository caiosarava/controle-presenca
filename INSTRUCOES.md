# Instruções Rápidas - Controle de Presença

## Estrutura do Projeto

```
controle-presenca/
├── index.html                 # Tela de login
├── dashboard.html             # Dashboard do usuário (registro)
├── historico.html             # Histórico do usuário
├── admin/                     # Painel administrativo
│   ├── index.html            # Dashboard admin
│   ├── locais.html           # Gestão de locais
│   ├── usuarios.html         # Gestão de usuários
│   └── historico.html        # Histórico geral + CSV
├── css/                      # Estilos
├── js/                       # JavaScript
├── assets/                   # Ícones e imagens
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── supabase-schema.sql       # Schema do banco
├── vercel.json               # Config Vercel
└── README.md                 # Documentação completa
```

## Passo a Passo Rápido

### 1. Criar Projeto Supabase (5 min)

```
1. Acesse https://supabase.com
2. Sign up (crie conta)
3. New Project → Preencha dados
4. SQL Editor → New query
5. Cole o conteúdo de supabase-schema.sql → Run
6. Settings → API → Copie URL e anon key
```

### 2. Configurar Aplicação (2 min)

```
Edite js/config.js:
- SUPABASE_URL: sua URL do projeto
- SUPABASE_ANON_KEY: sua chave anônima
```

### 3. Criar Primeiro Admin (1 min)

```
No SQL Editor do Supabase:

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'seu@email.com';
```

### 4. Testar Localmente (1 min)

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# Acesse http://localhost:8000
```

### 5. Deploy na Vercel (3 min)

```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel

# Ou importe no site da Vercel
```

### 6. Cadastrar Locais e Usuários

```
1. Login como admin
2. Menu Locais → Novo Local
3. Menu Usuários → Novo Usuário
```

## URLs Importantes

- **Login:** http://localhost:8000 (ou seu domínio)
- **Dashboard Admin:** /admin/index.html
- **Supabase:** https://app.supabase.com
- **Vercel:** https://vercel.com

## Credenciais Padrão

- **Primeiro acesso:** Use email e senha que criar no Supabase
- **Role:** Atualize para 'admin' manualmente no SQL

## Testar Funcionalidades

### Usuário Normal
1. Login com usuário normal
2. Permitir localização
3. Verificar se botão habilita dentro do raio
4. Registrar entrada/saída
5. Ver histórico

### Admin
1. Dashboard com estatísticas
2. Cadastrar/editar locais
3. Criar usuários
4. Ver histórico geral
5. Exportar CSV

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| Erro de localização | Use HTTPS ou localhost |
| Login falha | Verifique credenciais no config.js |
| Botão não habilita | Verifique se está dentro do raio |
| Deploy falhou | Confira variáveis na Vercel |

## Próximos Passos

1. ✅ Projeto implantado
2. ✅ Admin configurado
3. ✅ Locais cadastrados
4. ✅ Usuários criados
5. ✅ Testes realizados

## Arquivos Principais

- **config.js:** Configuração do Supabase
- **auth.js:** Autenticação
- **geo.js:** Geolocalização
- **registro.js:** Registros de presença
- **admin.js:** Funções admin
- **export.js:** Exportação CSV

## Contato/Suporte

- Leia o README.md para documentação completa
- Consulte DEPLOY.md para guia detalhado
- Execute supabase-schema.sql no banco

---

**Tempo total estimado:** 10-15 minutos
