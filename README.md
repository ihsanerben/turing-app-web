# Turing App Web

React, TypeScript ve Vite tabanlı frontend uygulaması.

## Docker ile başlatma

`turing-app-api` ve `turing-app-web` klasörleri yan yana bulunmalıdır. Backend klasöründeki
`.env` hazırken tüm uygulamayı tek komutla başlatın:

```bash
cd ../turing-app-api
docker compose up -d --build --wait
```

Frontend **http://localhost:5174**, backend **http://localhost:8086** adresinde açılır.
İlk kurulumdan sonra Docker Desktop → Containers → `turing-app-api` grubundaki Start/Stop
düğmesi tüm servisleri birlikte yönetir.

Frontend image'ı Node 22 üzerinde build edilir ve Nginx ile sunulur. Kaynak kod
değişikliklerini almak için `docker compose up -d --build --wait` yeniden çalıştırılır.
Tarayıcının API adresi build sırasında `http://localhost:8086` olarak ayarlanır.

## İsteğe bağlı Vite geliştirme

Host üzerinde Node.js ve npm kurulu olmalıdır. Önce backend klasöründe
`docker compose stop web` ile Docker frontend'ini durdurun; ardından bu klasörde:

```bash
npm ci
VITE_API_BASE_URL=http://localhost:8086 npm run dev -- --port 5174
```

Vite **http://localhost:5174** adresinde açılır; port doluysa başka porta geçmez.
Backend Docker içinde çalışmaya devam edebilir.

## Doğrulama

```bash
npm test
npm run lint
npm run build
```
