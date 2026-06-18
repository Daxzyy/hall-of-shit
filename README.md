# HOS Archive

Image gallery web app dengan REST API untuk WhatsApp bot.

## Struktur Folder

```
hos-archive/
├── server.js         ← Express backend + API endpoints
├── data.json         ← Database file (JSON)
├── package.json
├── public/
│   └── index.html    ← Frontend gallery (dark theme)
└── images/           ← Folder untuk gambar lokal (opsional)
```

## Setup & Jalankan

```bash
npm install
npm start
```

Akses di: `http://localhost:3000`

Ubah port dengan env variable:
```bash
PORT=8080 npm start
```

## API Endpoints

### GET /api/list
Ambil semua data.

```json
{
  "status": "success",
  "count": 6,
  "data": [...]
}
```

### POST /api/add
Tambah entry baru.

**Body:**
```json
{
  "title": "Judul Gambar",
  "category": "A",
  "description": "Deskripsi gambar",
  "image": "https://example.com/image.jpg",
  "date": "2024-01-01"
}
```

**Response:**
```json
{
  "status": "success",
  "id": "1700000001234",
  "message": "Entry added"
}
```

### DELETE /api/delete/:id
Hapus entry berdasarkan ID (timestamp).

```
DELETE /api/delete/1700000001234
```

**Response:**
```json
{
  "status": "success",
  "message": "Entry deleted"
}
```

## Fitur Frontend

- Dark theme dengan grid responsive
- Filter kategori: All, A, B, C
- Search by title / description
- Sort: Newest / Oldest
- Lightbox zoom saat klik gambar
- Tombol delete dengan konfirmasi (anti-accidental)
- Loading spinner & error handling
- Counter jumlah item

## Integrasi WhatsApp Bot

Contoh penggunaan dari bot (misalnya dengan `node-fetch`):

```js
// Ambil semua data
const res = await fetch('http://localhost:3000/api/list');
const data = await res.json();

// Tambah entry
await fetch('http://localhost:3000/api/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Foto Baru',
    category: 'A',
    description: 'Deskripsi foto',
    image: 'https://...',
    date: '2024-01-01'
  })
});

// Hapus entry
await fetch('http://localhost:3000/api/delete/1700000001234', {
  method: 'DELETE'
});
```
