# QuickNote — Store Görselleri

5 adet HTML ekran görüntüsü oluşturuldu. Her dosya **1080×1920px** boyutundadır (Play Store / App Store standart portre formatı).

## Dosyalar

| Dosya | İçerik | Renk |
|-------|---------|------|
| `screenshot-1-hero.html` | Ana ekran — not ızgarası, koyu mod | İndigo/Mor |
| `screenshot-2-editor.html` | Not düzenleyici — biçimlendirme, kategori, etiket | Mor/Koyu |
| `screenshot-3-checklist.html` | Checklist modu — ilerleme çubuğu | Yeşil |
| `screenshot-4-themes.html` | 8 tema + açık/koyu mod karşılaştırması | Sarı/Amber |
| `screenshot-5-features.html` | Tüm özellikler özet | Mavi |

## PNG'ye Dönüştürme (önerilen yöntemler)

### 1. Chrome'da manuel
1. HTML dosyasını Chrome'da aç
2. `Cmd+Shift+P` → "Capture full size screenshot"
3. Otomatik olarak PNG indirilir

### 2. Puppeteer ile (Node.js)
```bash
npm install puppeteer
node convert.js
```

### 3. Online araç
https://htmlcsstoimage.com veya https://screenshotone.com

## Play Store Gereksinimleri
- Minimum: 320px genişlik
- Maksimum: 3840px
- Format: JPG veya 24-bit PNG (alpha yok)
- Max boyut: 8MB
