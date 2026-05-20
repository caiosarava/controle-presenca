# 📱 Guia de Instalação PWA - Controle de Presença

## O que é PWA?

PWA (Progressive Web App) é um aplicativo web que funciona como um aplicativo nativo, permitindo instalação em dispositivos móveis e desktop sem necessidade de lojas de aplicativos.

## ✨ Recursos Implementados

### Fase 1 - Estrutura Básica (Concluída)

- [x] **Manifest.json** atualizado com ícones e configurações
- [x] **Service Worker** com cache e fallback offline
- [x] **Meta tags PWA** em todas as páginas
- [x] **Página offline** personalizada
- [x] **Banner de instalação** do app
- [x] **Indicador de status** online/offline
- [x] **Ícones** em múltiplos tamanhos

### Fase 2 - Service Worker (Concluída)

- [x] Cache estratégico (cache-first, network-first)
- [x] Fallback para página offline
- [x] Atualização automática de cache
- [x] Limpeza de cache antigo

### Fase 3 - UI de Instalação (Concluída)

- [x] Banner de instalação automático
- [x] Botão "Instalar" funcional
- [x] Indicador visual de conexão
- [x] Notificação offline

---

## 🚀 Como Instalar

### Android (Chrome)

1. Acesse o sistema pelo Chrome
2. Aparecerá um banner: "Instale nosso app"
3. Clique em **"Instalar"**
4. Confirme em **"Adicionar**"
5. O app será instalado na tela inicial

### iOS (Safari)

1. Acesse o sistema pelo Safari
2. Toque no botão **Compartilhar** (quadrado com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme em **"Adicionar"**
5. O app aparecerá na tela inicial

### Desktop (Chrome/Edge)

1. Acesse o sistema
2. No canto superior direito, clique no ícone de **Instalar** (+)
3. Ou clique no banner "Instale nosso app"
4. Confirme a instalação
5. O app será adicionado à área de trabalho

---

## 📁 Estrutura de Arquivos

```
controle-presenca/
├── assets/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
├── css/
│   ├── pwa.css (NOVO)
│   └── ...
├── js/
│   ├── pwa.js (NOVO)
│   └── ...
├── admin/
│   ├── index.html
│   ├── locais.html
│   ├── usuarios.html
│   └── historico.html
├── index.html
├── dashboard.html
├── historico.html
├── offline.html (NOVO)
├── manifest.json (ATUALIZADO)
├── sw.js (ATUALIZADO)
└── generate-icons.html (NOVO - utilitário)
```

---

## 🔧 Funcionalidades PWA

### 1. Service Worker

O Service Worker (`sw.js`) gerencia o cache e funcionalidades offline:

- **Cache First**: Para assets estáticos (CSS, JS, imagens)
- **Network First**: Para requisições de API
- **Fallback Offline**: Redireciona para `/offline.html` quando sem conexão

### 2. Manifest

O `manifest.json` define:

- Nome e descrição do app
- Ícones em vários tamanhos
- URL inicial
- Cores do tema
- Atalhos (quick actions)

### 3. Meta Tags

Todas as páginas HTML incluem:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Presença">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
```

### 4. Offline Page

A página `/offline.html` é exibida quando:
- O usuário está sem internet
- O Service Worker não consegue carregar o recurso
- Há tentativa de navegação offline

---

## 🎨 Personalização

### Alterar Cores

Edite `css/pwa.css`:

```css
.install-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Alterar Ícones

1. Gere novos ícones em `generate-icons.html`
2. Substitua os arquivos em `/assets/`
3. Atualize `manifest.json` se necessário

### Alterar Mensagens

Edite os banners em `index.html` e `dashboard.html`:

```html
<div id="install-pwa-banner">
  <span>Seu texto aqui</span>
</div>
```

---

## 🧪 Testando

### 1. Verificar Service Worker

```javascript
// No console do navegador:
navigator.serviceWorker.controller
// Deve retornar: ServiceWorker { ... }
```

### 2. Simular Offline

1. Abra DevTools (F12)
2. Vá para a aba **Network**
3. Marque **Offline**
4. Recarregue a página
5. Deve aparecer a página offline

### 3. Testar Instalação

1. Limpe cache e dados do site
2. Recarregue a página
3. Deve aparecer o banner de instalação
4. Clique em "Instalar"

### 4. Verificar Cache

```javascript
// No console:
caches.keys().then(keys => console.log(keys));
// Deve mostrar: ['controle-presenca-v2']
```

---

## ⚠️ Considerações Importantes

### HTTPS é Obrigatório

- PWA requer HTTPS em produção
- Funciona em `http://localhost` para desenvolvimento
- Sem HTTPS, o Service Worker não registra

### Limitações do iOS

- Sem suporte a push notifications (até iOS 16.4+)
- Sem suporte a background sync
- Requer interação do usuário para instalar

### Cache

- O cache é versionado (`controle-presenca-v2`)
- Atualizações do app requerem nova versão do cache
- Usuários precisam atualizar a página para nova versão

---

## 🐛 Troubleshooting

### App não instala

- Verifique se está em HTTPS
- Verifique se `manifest.json` está correto
- Limpe cache e dados do navegador
- Tente em janela anônima

### Service Worker não registra

- Verifique console para erros
- Confirme que `sw.js` está no caminho correto
- Verifique escopo do Service Worker

### Offline não funciona

- Verifique se `/offline.html` existe
- Teste em modo offline do DevTools
- Verifique se Service Worker está ativo

---

## 📊 Próximos Passos (Opcional)

### Melhorias Futuras

- [ ] Adicionar push notifications
- [ ] Background sync para registros offline
- [ ] Cache de dados dinâmicos
- [ ] Splash screen personalizada
- [ ] Atualização automática de gráficos
- [ ] Modo escuro

### Otimizações

- [ ] Lazy loading de imagens
- [ ] Code splitting
- [ ] Compressão de assets
- [ ] Preload de recursos críticos

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

**Última atualização:** Maio 2026  
**Versão do PWA:** 1.0.0
