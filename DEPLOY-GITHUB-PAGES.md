# 🌐 Guia de Deploy - Frontend (GitHub Pages)

## 🎯 O que vamos fazer?

Hospedar o frontend Angular no GitHub Pages **100% GRÁTIS**.

---

## 📋 PRÉ-REQUISITOS

- [ ] Backend já deployado (Fly.io ou Railway)
- [ ] URL do backend anotada
- [ ] Repositório no GitHub
- [ ] Node.js e npm instalados

---

## 🔧 PASSO A PASSO

### **1. Instalar angular-cli-ghpages**

```powershell
cd c:\Users\joao-\OneDrive\Documentos\TCC\umland-frontend

npm install --save-dev angular-cli-ghpages
```

---

### **2. Atualizar API Config**

Edite: `src/config/api.config.ts`

```typescript
export const API_CONFIG = {
  // Sua URL do Fly.io ou Railway (SUBSTITUA!)
  production: 'https://umland-backend.fly.dev',
  
  // Local (para desenvolvimento)
  local: 'http://localhost:9090',
  
  // Auto-detecta ambiente
  get baseUrl() {
    const hostname = window.location.hostname;
    
    // Se estiver em localhost, usa API local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return this.local;
    }
    
    // Caso contrário, usa produção
    return this.production;
  }
};
```

**Importante:** Substitua `https://umland-backend.fly.dev` pela sua URL real!

---

### **3. Atualizar angular.json (Base Href)**

Edite: `angular.json`

Procure por `"outputPath"` e adicione depois dele:

```json
{
  "projects": {
    "umland-frontend": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/umland-frontend/browser",
            "baseHref": "/umland-frontend/"
          }
        }
      }
    }
  }
}
```

**⚠️ Importante:** 
- Se seu repositório se chama `umland-frontend`, use `/umland-frontend/`
- Se é outro nome, ajuste: `/nome-do-repo/`
- Se for `seu-usuario.github.io` (repo especial), use `/`

---

### **4. Build para Produção**

```powershell
npm run build -- --configuration production --base-href /umland-frontend/
```

**O que acontece:**
- ⚙️ Compila TypeScript
- 📦 Minifica código
- 🗜️ Otimiza imagens
- 📁 Cria pasta `dist/umland-frontend/browser/`

Aguarde 1-2 minutos...

---

### **5. Deploy no GitHub Pages**

```powershell
npx angular-cli-ghpages --dir=dist/umland-frontend/browser
```

**O que acontece:**
1. Cria branch `gh-pages` (se não existir)
2. Copia arquivos de `dist/` para lá
3. Faz push para GitHub
4. GitHub Pages publica automaticamente

**Output esperado:**
```
Successfully published via angular-cli-ghpages!
https://sidneihenrique.github.io/umland-frontend/
```

---

### **6. Ativar GitHub Pages (Primeira Vez)**

1. Vá no GitHub: `https://github.com/sidneihenrique/umland-frontend`
2. Clique em **"Settings"**
3. No menu lateral, **"Pages"**
4. Em **"Source"**, selecione:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Clique **"Save"**
6. Aguarde 1-2 minutos

**Sua URL será:**
```
https://sidneihenrique.github.io/umland-frontend/
```

---

### **7. Configurar CORS no Backend**

⚠️ **Importante!** Atualize o backend para aceitar requisições do frontend:

#### **Se usou Fly.io:**
```powershell
flyctl secrets set SPRING_WEB_CORS_ALLOWED_ORIGIN_PATTERNS="https://sidneihenrique.github.io,http://localhost:4200"
flyctl deploy
```

#### **Se usou Railway:**
1. Vá no projeto Railway
2. Serviço backend → Variables
3. Edite `SPRING_WEB_CORS_ALLOWED_ORIGIN_PATTERNS`:
```
https://sidneihenrique.github.io,http://localhost:4200
```
4. Aguarde redeploy automático

---

### **8. Testar**

1. Acesse: `https://sidneihenrique.github.io/umland-frontend/`
2. Abra DevTools (F12)
3. Console → Não deve ter erros de CORS
4. Network → Requisições para backend devem funcionar

---

## 🔄 ATUALIZAÇÕES FUTURAS

### **Deploy rápido:**

Depois de fazer mudanças:

```powershell
# 1. Build
npm run build -- --configuration production --base-href /umland-frontend/

# 2. Deploy
npx angular-cli-ghpages --dir=dist/umland-frontend/browser
```

### **Ainda mais rápido (criar script):**

Edite `package.json`:

```json
{
  "scripts": {
    "deploy": "ng build --configuration production --base-href /umland-frontend/ && npx angular-cli-ghpages --dir=dist/umland-frontend/browser"
  }
}
```

Agora basta:
```powershell
npm run deploy
```

---

## 🤖 AUTOMAÇÃO COM GITHUB ACTIONS (Opcional)

Quer deploy automático a cada push? Crie workflow:

### **Criar `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # ou master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build -- --configuration production --base-href /umland-frontend/
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/umland-frontend/browser
          cname: # Se tiver domínio customizado
```

**Salve e comite:**
```powershell
git add .github/workflows/deploy.yml
git commit -m "Add auto-deploy workflow"
git push
```

Agora a cada `git push`, deploy automático! 🚀

---

## 🔐 CONFIGURAÇÕES ADICIONAIS

### **Usar Domínio Customizado (Opcional)**

Se tiver domínio próprio (ex: `umland.com.br`):

1. **No GitHub:**
   - Settings → Pages
   - Custom domain: `umland.com.br`

2. **No seu provedor de DNS:**
   - Adicione registro CNAME:
   ```
   www.umland.com.br → sidneihenrique.github.io
   ```
   - Ou A records (IPs do GitHub Pages)

---

## 🐛 TROUBLESHOOTING

### **404 ao acessar rota direta**

GitHub Pages não suporta SPA routing nativamente.

**Solução:** Criar `404.html` que redireciona:

Em `src/404.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    sessionStorage.redirect = location.href;
  </script>
  <meta http-equiv="refresh" content="0;URL='/'">
</head>
<body></body>
</html>
```

Copie para `dist/` antes do deploy.

### **CSS/JS não carregam**

Verifique `baseHref` no `angular.json` e comando de build.

Deve ser: `--base-href /nome-do-repo/`

### **CORS bloqueando**

1. Verifique se backend está configurado
2. URL no `api.config.ts` está correta?
3. Backend aceita HTTPS (não HTTP)

### **Assets não carregam**

Verifique caminhos relativos:
```typescript
// ✅ Correto
<img src="assets/logo.png">

// ❌ Errado
<img src="/assets/logo.png">
```

---

## 📊 MONITORAMENTO

### **Ver deploys:**
1. GitHub → Actions
2. Histórico de builds e deploys

### **Ver tráfego:**
- GitHub Insights → Traffic
- Ver visitantes, páginas populares

---

## 🎯 CHECKLIST FINAL

- [ ] `angular-cli-ghpages` instalado
- [ ] `api.config.ts` atualizado com URL do backend
- [ ] `angular.json` tem `baseHref` correto
- [ ] Build sem erros: `npm run build`
- [ ] Deploy realizado: `npx angular-cli-ghpages`
- [ ] GitHub Pages ativado
- [ ] Site acessa: `https://usuario.github.io/repo/`
- [ ] CORS configurado no backend
- [ ] Endpoints funcionam (teste no site)

---

## 🚀 INTEGRAÇÃO COMPLETA

### **Arquitetura Final:**

```
┌─────────────────────────────────┐
│  GitHub Pages (Frontend)        │
│  https://usuario.github.io/     │
└────────────┬────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────┐
│  Fly.io ou Railway (Backend)    │
│  https://backend.fly.dev        │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  PostgreSQL (Database)          │
└─────────────────────────────────┘
```

### **URLs Finais:**

- **Frontend**: `https://sidneihenrique.github.io/umland-frontend/`
- **Backend**: `https://umland-backend.fly.dev`
- **Swagger**: `https://umland-backend.fly.dev/swagger-ui.html`

---

## 💡 DICAS

### **Testar local antes:**
```powershell
# Simula produção
npm run build -- --configuration production --base-href /umland-frontend/

# Serve local (instalar http-server)
npx http-server dist/umland-frontend/browser -p 8080

# Acesse: http://localhost:8080/umland-frontend/
```

### **Branch strategy:**
- `main` → Desenvolvimento
- `gh-pages` → Produção (automático)
- Crie `develop` para features

### **Performance:**
- Angular já otimiza no build prod
- Lazy loading de módulos
- Compression automática do GitHub Pages

---

## ✅ PRONTO!

**Workflow completo:**

```powershell
# 1. Desenvolver local
npm start

# 2. Testar com backend local
docker compose up

# 3. Build para produção
npm run build -- --configuration production --base-href /umland-frontend/

# 4. Deploy
npx angular-cli-ghpages --dir=dist/umland-frontend/browser

# 5. Testar online
# https://sidneihenrique.github.io/umland-frontend/
```

---

## 🎓 PARA O TCC

**Mencione:**
- Frontend hospedado no GitHub Pages (gratuito)
- Deploy automatizado
- CDN global (GitHub)
- SSL/HTTPS incluso
- Integração com backend em nuvem

**Diagrama de deploy:**
```
Git Push → GitHub → Build → GitHub Pages → Online
```

**Boa sorte! 🎉**
