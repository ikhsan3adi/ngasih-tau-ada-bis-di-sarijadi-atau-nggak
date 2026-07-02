# Ngasih Tau Ada Bis di Sarijadi Atau Nggak

![Cron job status](https://api.cron-job.org/jobs/7747227/eee7b6edbe2c4079/status-7.svg)
![Cron job status](https://api.cron-job.org/jobs/7747232/5ff65282b08e9755/status-7.svg)

> [!INFO]
> 
> - **Bot (notifier):** [@sarijadibustracker_bot](https://t.me/sarijadibustracker_bot)
> - **Live Visualizer:** <http://ikhsan3adi.is-a.dev/ngasih-tau-ada-bis-di-sarijadi-atau-nggak/>
> - **Bemo Proxy:** <https://young-field-2d3d.ikhsan3adi.workers.dev>
>   - Endpoints: `/api/live` & `/api/tmb`

Skrip kurang kerjaan buat mantau posisi bis dan spam notif Telegram pas ada bis yang masuk atau keluar area geofence. 

Latar belakangnya gini: Gua bikin ini murni karena capek jadi korban ghosting bis pas pulang kuliah. Nungguin bis di daerah Sarijadi, Cibogo, Surya Sumantri atau Sukawarna tuh kayak nungguin kepastian dari gebetan, nggak jelas kapan datengnya. Berbekal skill reverse engineering tingkat dewa (baca: inspect element endpoint API BEMO asli), akhirnya jadilah bot ini biar server yang nungguin bis. Sekalian pamer ke circle lu lah kalo lu bisa ngoding hal-hal canggih gini.

## Fitur

- Nyolong... eh maksudnya ngambil data lokasi bis secara real-time.
- Ngecek bisnya udah masuk poligon (area) yang dituju atau belum.
- Nyepam chat Telegram pake plat nomor, rute, arah, dan timestamp biar kelihatan kayak anak IT beneran.
- Pake `turf.js` buat kalkulasi matematika yang lu aja waktu sekolah pada bolos.
- Nyimpen state bis sebelumnya biar nggak spam mulu pas bisnya lagi diem di dalem poligon. 
- **Visualizer Real-time Map:** Dashboard peta live interaktif berbasis React + Vite + Tailwind CSS v4 + Leaflet untuk memantau pergerakan bis secara visual langsung di browser.

## Modal Biar Bisa Jalan

- Bun (kalo masih pake Node.js lu kurang edgy).
- Token Bot Telegram (bikin sendiri di BotFather, jangan manja).
- Chat ID Telegram (buat nampung spam).
- Akun Cloudflare gratisan (buat CORS Proxy).

## Environment Variables

Bikin file `.env` di root directory. Isinya ginian:

- `TELEGRAM_BOT_TOKEN`: Token bot lu yang gampang dibobol itu.
- `TELEGRAM_CHAT_ID`: ID chat tempat lu mau pamer notif.
- `PORT`: Port buat HTTP server biar Render ga rewel (default `3000`).
- `POLL_INTERVAL_SEC`: Jeda waktu polling dalam detik (default `60`).
- `SLEEP_START_HOUR`: Jam mulai tidur WIB (default `19`).
- `SLEEP_END_HOUR`: Jam selesai tidur WIB (default `5`).
- `SLEEP_INTERVAL_SEC`: Durasi loop pas mode tidur, biar ga boros request (default `3600`).
- `BYPASS_SLEEP_MODE`: Set `true` kalo bot lu mau begadang 24 jam nonstop tanpa kenal lelah.

## Cara Install (Kalo lu gak paham mending turu)

1. Clone repo ini. Kalo gak tau cara clone, balek warnet aja deck.
2. Install dependencies pake Bun:
   ```bash
   bun install
   ```

## Cara Pake

Jalanin scriptnya biar dia mantau terus-terusan sampe server lu meledak:

```bash
bun start
```

Atau, kalo lu mau jalanin sekali doang terus mati (cocok buat cron job atau karena lu takut kuota abis):

```bash
bun start -1
```

Kalo lu ngerasa kurang greget mantau Sarijadi doang, tambahin parameter `-bdg` biar dia load poligon se-Bandung (`test-polygons.json`). Biar makin pusing tuh RAM:

```bash
bun start -bdg
```

## Ngetest Kode (Biar seolah-olah programmer elit)

Jalanin test suite biar kelihatan nerapin TDD padahal copas sana sini:

```bash
bun test
```

---

## Deployment ke Render (Biar jalan gratisan tapi hemat kuota)

Daripada bayar $7 per bulan buat background worker, mending kita deploy sebagai **Web Service** gratisan di Render. Biar Render kaga rewel minta port binding, aplikasi ini udah otomatis ngebuka server HTTP di port `3000` (atau port dinamis dari Render lewat env `PORT`) dengan endpoint health check di `/health` atau `/`.

Tapi inget, Render gratisan bakal otomatis tidur (turu) kalo ga ada request masuk selama 15 menit. Masalahnya, waktu bangun (*cold start*) Render bisa makan waktu 1-3 menit, sedangkan pinger kayak **Cron-job.org** punya batas timeout 30 detik. Jadi kalau `cron-job.org` nembak pertama kali pas Render lagi turu, dia bakal dapet error 503 keburu timeout.

Biar bersinergi dan ga ada error 503, kita pake trik gabungan **GitHub Actions** dan **Cron-job.org**:

### Langkah 1: Setup Alarm Pagi (GitHub Actions)
Di repo ini udah disediakan workflow `.github/workflows/wakeup.yml`. Tugasnya adalah ngebangunin Render pagi-pagi pake loop pinger yang sabar (punya batas waktu 5 menit).

1. Push kode ini ke GitHub.
2. Buka tab **Settings** di repository GitHub lu -> **Secrets and variables** -> **Actions** -> pilih tab **Variables** -> klik **New repository variable**.
3. Isi **Name** dengan `RENDER_APP_URL` dan **Value** dengan URL health check Render lu (contoh: `https://bemo-bot.onrender.com/health`).
4. GitHub Actions bakal otomatis jalan tiap pukul **04:16 WIB** buat manasin dan ngebangunin Render lu sampai sukses merespon `200 OK`.

### Langkah 2: Setup Pinger Harian (Cron-job.org)
Setelah Render dipastikan bangun oleh GitHub Actions, pinger dari `cron-job.org` bertugas menjaga agar Render tetep melek sepanjang jam operasional bis.

1. Buat akun gratis di **Cron-job.org**.
2. Set zona waktu (timezone) akun/job lu ke **Asia/Jakarta** (WIB).
3. Buat dua (2) cron job yang mengarah ke URL health check web service Render lu (misal: `https://bemo-bot.onrender.com/health`):
   - **Job 1 (Pukul 04:30 - 04:55 WIB):**
     - Jadwal Cron: `30,35,40,45,50,55 4 * * *`
   - **Job 2 (Pukul 05:00 - 18:55 WIB):**
     - Jadwal Cron: `*/5 5-18 * * *`
4. Di luar jam itu (pukul 19:00 - 04:15 WIB), pinger bakal libur nembak. Setelah 15 menit tanpa request (sekitar pukul 19:15 WIB), kontainer Render lu bakal otomatis tidur nyenyak demi menghemat kuota jam gratisan Render lu.

---

## Visualizer Peta Live (GitHub Pages Ready)

Biar makin lengkap, ada visualizer peta web interaktif di dalam folder `/visualizer`. Visualizer ini bakal nge-render rute bis secara realtime (update tiap 10s) dan mendeteksi geofence secara visual di browser.

### Mengatasi CORS Error di Browser (Pake Cloudflare Workers)
Karena API UPTD Bandung kaga ngasih header CORS, browser lu bakal ngeblokir request langsung (CORS blocked error). AllOrigins/CORS proxy publik lainnya sering lambat dan diblokir Cloudflare bemo. 

Solusinya kita pake **Cloudflare Workers** sebagai reverse proxy yang super ngebut dan gratis (0ms cold start):

1. Daftar/masuk ke [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Buat Worker baru (misal namanya `bemo-proxy`).
3. Klik **Edit Code** dan paste script proxy JavaScript ini:
   ```javascript
    export default {
      async fetch(request) {
        const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle preflight request browser
        if (request.method === "OPTIONS") {
          return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        let targetUrl = "";

        if (url.pathname === "/api/live") {
          targetUrl = "https://bemo.uptangkutan-bandung.id/map/live";
        } else if (url.pathname === "/api/tmb") {
          targetUrl = "https://bemo.uptangkutan-bandung.id/map/tmb/";
        } else {
          return new Response("Not Found", { status: 404, headers: corsHeaders });
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });
          
          const data = await response.text();
          return new Response(data, {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 502,
            headers: corsHeaders
          });
        }
      }
    }
   ```
4. Klik **Save and Deploy**. Salin URL Worker lu (misal: `https://bemo-proxy.username.workers.dev/`).

### Deploy Visualizer ke GitHub Pages Otomatis
Repositori ini udah dilengkapi workflow GitHub Actions `.github/workflows/gh-pages.yml` yang bakal otomatis nge-build dan deploy visualizer ke branch `gh-pages` tiap kali lu push ke branch `master`.

1. Masuk ke **Settings** repositori GitHub lu -> **Secrets and variables** -> **Actions** -> tab **Variables**.
2. Klik **New repository variable**.
3. Beri nama **`BEMO_PROXY_URL`** dan isikan **URL Cloudflare Worker** lu tadi sebagai nilainya.
4. Lakukan push/commit kode ke GitHub branch `master`. GitHub Actions bakal nge-build visualizer dan menyuntikkan URL Worker lu secara otomatis saat build-time.
5. Buka tab **Settings** repositori lu -> **Pages** -> ganti Source ke Deploy from a branch dan pilih branch `gh-pages`.
6. Web visualizer lu bakal live di `https://username.github.io/ngasih-tau-ada-bis-di-sarijadi-atau-nggak/`.

### Menjalankan Visualizer di Lokal
Untuk development atau sekadar ngetes visualizer di laptop sendiri (Vite dev server bakal otomatis nge-proxy API bemo tanpa kena CORS):

```bash
# Menjalankan Vite Dev Server visualizer (jalan di localhost:3000)
bun run visualize

# Mem-build berkas produksi visualizer secara lokal
bun run build:visualizer
```

---
