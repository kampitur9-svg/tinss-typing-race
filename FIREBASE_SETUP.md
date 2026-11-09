# Firebase orqali poyga xonalari

1. Firebase’da loyiha yarating va **Web app** qo‘shing.
2. **Authentication → Sign-in method** bo‘limida **Anonymous** usulini yoqing.
3. **Realtime Database** yarating va uning `databaseURL` manzilini oling.
4. Web app sozlamalaridagi `apiKey`, `authDomain`, `projectId`, `databaseURL` va `appId` qiymatlarini `firebase-config.js` fayliga kiriting.
5. `database.rules.json` ichidagi qoidalarni Realtime Database’ning **Rules** bo‘limiga joylang va **Publish** qiling.
6. Papkani terminalda ochib `py -m http.server 8000` buyrug‘ini bajaring, so‘ng `http://localhost:8000` manzilini oching. `index.html` faylini bevosita (`file://`) ochmang.

Web ilova konfiguratsiyasi ommaviy klient sozlamasidir; service-account kaliti yoki boshqa maxfiy ma’lumotni bu fayllarga kiritmang. Ushbu qoidalar anonim kirgan istalgan foydalanuvchiga xona kodini bilsa, xonaga kirish imkonini beradi. Shuning uchun qoidalarni faqat demo uchun ishlating, maxfiy ma’lumot yoki ishlab chiqarish xizmati uchun emas.
