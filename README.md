# Ngasih Tau Ada Bis di Sarijadi Atau Nggak

Skrip kurang kerjaan buat mantau posisi bis dan spam notif Telegram pas ada bis yang masuk atau keluar area geofence. 

Latar belakangnya gini: Gua bikin ini murni karena capek jadi korban ghosting bis pas pulang kuliah. Nungguin bis di daerah Sarijadi, Cibogo, Surya Sumantri atau Sukawarna tuh kayak nungguin kepastian dari gebetan, nggak jelas kapan datengnya. Daripada kaki pegel berdiri di pinggir jalan dan ngerasa jadi anak kosan paling merana se-Bandung gara-gara ketinggalan bis, mending gua bikin bot aja biar server yang nungguin. Sekalian pamer ke circle lu lah kalo lu bisa ngoding.

## Fitur

- Nyolong... eh maksudnya ngambil data lokasi bis secara real-time.
- Ngecek bisnya udah masuk poligon (area) yang dituju atau belum.
- Nyepam chat Telegram pake plat nomor, rute, arah, dan timestamp biar kelihatan kayak anak IT beneran.
- Pake `turf.js` buat kalkulasi matematika yang lu aja waktu sekolah pada bolos.
- Nyimpen state bis sebelumnya biar nggak spam mulu pas bisnya lagi diem di dalem poligon. 

## Modal Biar Bisa Jalan

- Bun (kalo masih pake Node.js lu kurang edgy).
- Token Bot Telegram (bikin sendiri di BotFather, jangan manja).
- Chat ID Telegram (buat nampung spam).

## Environment Variables

Bikin file `.env` di root directory. Isinya ginian:

- `TELEGRAM_BOT_TOKEN`: Token bot lu yang gampang dibobol itu.
- `TELEGRAM_CHAT_ID`: ID chat tempat lu mau pamer notif.
- `BEMO_API_URL`: URL API buat ngambil posisi bis. Kalo nanya dapet dari mana, reverse engineering lah banh.

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
