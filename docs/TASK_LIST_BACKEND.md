# Daftar Task & Endpoint Backend (Modul M5)
**Parent Task:** `PRO-117: Pengembangan Back-End & Database`  
**Platform:** Araya Business Hub Platform  
**Kelompok:** A5 · **Modul:** M5 (Portal Customer & Katalog Terpadu)  
**Status Keseluruhan:** ✅ 100% Selesai & Teruji  

---

## 📋 Tabel Ringkasan Subtask (Siap Dipindahkan ke Linear / Jira)

| No | ID Task (Linear) | Judul Subtask | Method & Path | User Story / Panduan | Status |
| :---: | :---: | :--- | :--- | :---: | :---: |
| 1 | `PRO-129` | Endpoint GET Pencarian & Filter Multi-Kriteria Katalog | `GET /api/m5/v1/catalog/products` | M5-US5 | ✅ Selesai |
| 2 | `PRO-130` | Endpoint POST Formulir Permintaan Layanan | `POST /api/m5/v1/service-requests` | M5-US2 | ✅ Selesai |
| 3 | `PRO-131` | Endpoint Cart Management (Add, Update, Delete) | `POST /api/m5/v1/cart/items` | M5-US3 | ✅ Selesai |
| 4 | `PRO-132` | Endpoint POST Checkout Order (Integrasi Modul M4) | `POST /api/m5/v1/cart/checkout` | M5-US4 (K-04) | ✅ Selesai |
| 5 | `PRO-133` | Endpoint GET Ringkasan Katalog & Unit Usaha (Overview) | `GET /api/m5/v1/catalog/overview` | M5-US1 | ✅ Selesai |
| 6 | `PRO-134` | Endpoint GET Riwayat Permintaan Layanan Customer | `GET /api/m5/v1/service-requests/my` | M5-US2 | ✅ Selesai |
| 7 | `PRO-135` | Endpoint GET Isi Keranjang Belanja & Counter Badge | `GET /api/m5/v1/cart` | M5-US3 | ✅ Selesai |
| 8 | `PRO-136` | Endpoint POST Webhook Event Idempotent Antarmodul | `POST /api/m5/v1/events` | Panduan Bab 5 | ✅ Selesai |
| 9 | `PRO-137` | Setup Skema Database Relasional & Migrasi Supabase | Database / Prisma | ERD M5 | ✅ Selesai |
| 10 | `PRO-138` | Setup Dokumentasi OpenAPI Swagger UI & Deployment | `GET /api/m5/v1/docs` | Panduan Bab 7 | ✅ Selesai |

---

## 🛠️ Rincian Detail Setiap Task Endpoint

### 1. `PRO-133: Endpoint GET Ringkasan Katalog & Unit Usaha (Overview)`
* **Method & Path:** `GET /api/m5/v1/catalog/overview`
* **User Story:** `M5-US1`
* **Deskripsi:** Menampilkan profil seluruh unit usaha BPU aktif (dari Modul M2) dan daftar katalog produk dalam satu kali pemanggilan API (halaman beranda customer).
* **Hak Akses:** Publik (tanpa login).
* **Format Respons (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "business_units": [
        {
          "id": 1,
          "name": "BPU Percetakan & Konveksi",
          "category": "Percetakan",
          "is_active": true
        }
      ],
      "products": [
        {
          "id": 31,
          "name": "Cetak Banner Vinyl Frontlite 280gr",
          "price": 25000,
          "unit_usaha_id": 1
        }
      ]
    }
  }
  ```
* **File Terkait:** `src/modules/catalog/controllers/v1/catalog.controller.ts`, `src/modules/catalog/catalog.service.ts`.

---

### 2. `PRO-129: Endpoint GET Pencarian & Filter Multi-Kriteria Katalog`
* **Method & Path:** `GET /api/m5/v1/catalog/products`
* **User Story:** `M5-US5`
* **Deskripsi:** Menyaring katalog produk berdasarkan kata kunci teks bebas `q`, `category`, `unit_usaha_id`, dan pagination (`page`, `per_page`).
* **Aturan Khusus:** Jika data tidak ditemukan, wajib mengembalikan HTTP 200 dengan data kosong `[]` (bukan error).
* **Query Parameters:**
  * `q` (string, opsional): Kata kunci pencarian (nama/deskripsi).
  * `unit_usaha_id` (number, opsional): ID unit usaha rujukan M2.
  * `category` (string, opsional): Kategori produk.
  * `page` (number, default: 1): Nomor halaman.
  * `per_page` (number, default: 20): Jumlah per halaman.
* **Format Respons (HTTP 200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 31,
        "name": "Cetak Banner Vinyl Frontlite 280gr",
        "category": "Percetakan",
        "price": 25000,
        "unit_usaha_id": 1,
        "is_active": true
      }
    ],
    "meta": {
      "page": 1,
      "per_page": 20,
      "total": 1,
      "total_pages": 1
    }
  }
  ```

---

### 3. `PRO-130: Endpoint POST Formulir Permintaan Layanan`
* **Method & Path:** `POST /api/m5/v1/service-requests`
* **User Story:** `M5-US2`
* **Deskripsi:** Menerima input formulir permohonan layanan langsung dari customer ke unit usaha BPU.
* **Validasi Input (Server-Side):**
  * `unit_usaha_id` (number, wajib): ID unit usaha tujuan.
  * `customer_name` (string, wajib): Nama lengkap customer.
  * `customer_email` (string, wajib): Format email valid.
  * `customer_phone` (string, wajib): Nomor kontak minimal 8 digit.
  * `title` (string, wajib): Judul permintaan.
  * `description` (string, wajib): Rincian kebutuhan layanan.
* **Aturan Error Validasi (HTTP 422):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Isian tidak lolos validasi",
      "fields": {
        "customer_email": "Format email tidak valid",
        "customer_phone": "Nomor telepon minimal 8 digit"
      }
    }
  }
  ```
* **Format Sukses (HTTP 201 Created):** Tersimpan di database Supabase dengan status `"diteruskan"`.

---

### 4. `PRO-134: Endpoint GET Riwayat Permintaan Layanan Customer`
* **Method & Path:** `GET /api/m5/v1/service-requests/my`
* **User Story:** `M5-US2`
* **Deskripsi:** Menampilkan riwayat permohonan layanan yang diajukan oleh customer yang sedang login.

---

### 5. `PRO-135: Endpoint GET Isi Keranjang Belanja & Counter Badge`
* **Method & Path:** `GET /api/m5/v1/cart`
* **User Story:** `M5-US3`
* **Deskripsi:** Mengambil seluruh item belanjaan customer, subtotal per item, akumulasi total harga belanja, dan jumlah badge counter.
* **Format Respons (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "cart_id": 1,
      "customer_id": 17,
      "items": [
        {
          "id": 10,
          "product_id": 31,
          "product_name": "Cetak Banner Vinyl Frontlite 280gr",
          "unit_price": 25000,
          "qty": 2,
          "subtotal": 50000,
          "is_active": true
        }
      ],
      "badge_count": 2,
      "total_items": 1,
      "total_amount": 50000
    }
  }
  ```

---

### 6. `PRO-131: Endpoint Cart Management (Add, Update, Delete)`
* **User Story:** `M5-US3`
* **Endpoint 1 (Tambah Item):** `POST /api/m5/v1/cart/items`
  * **Payload:** `{ "product_id": 31, "qty": 1 }`
  * **Aturan Bisnis:** Jika produk sudah ada di keranjang, kuantitas bertambah (`qty += 1`), bukan membuat entri duplikat (AC M5-US3.2).
* **Endpoint 2 (Update Kuantitas):** `PATCH /api/m5/v1/cart/items/:id`
  * **Payload:** `{ "qty": 3 }`
* **Endpoint 3 (Hapus 1 Item):** `DELETE /api/m5/v1/cart/items/:id`
* **Endpoint 4 (Kosongkan Keranjang):** `DELETE /api/m5/v1/cart`

---

### 7. `PRO-132: Endpoint POST Checkout Order (Integrasi Modul M4)`
* **Method & Path:** `POST /api/m5/v1/cart/checkout`
* **User Story:** `M5-US4` (Kontrak Resmi **K-04**)
* **Header:** `Authorization: Bearer <token Customer dari M1>`
* **Aturan Proteksi Keranjang Kosong (HTTP 422):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ITEMS_EMPTY",
      "message": "Keranjang masih kosong"
    }
  }
  ```
* **Alur Eksekusi Sukses (HTTP 201 Created):**
  1. Validasi keranjang memiliki item.
  2. M5 memanggil endpoint Modul M4: `POST /api/m4/v1/orders`.
  3. M4 mengembalikan ID Order dan status pesanan baru.
  4. M5 otomatis mengosongkan seluruh item di keranjang belanja.
  5. Customer menerima respons nomor Order resmi (misal: `ORD-20261028-0007`).

---

### 8. `PRO-136: Endpoint POST Webhook Event Idempotent Antarmodul`
* **Method & Path:** `POST /api/m5/v1/events`
* **Panduan Integrasi:** Bab 5 (Event Antarmodul)
* **Header:** `X-Service-Key: <kunci modul>`
* **Deskripsi:** Menerima notifikasi event antarmodul (seperti `sale.paid`, `order.paid`).
* **Jaminan Idempotency:** Memeriksa `event_id` (UUID) pada tabel `processed_events`. Jika event sudah pernah diterima, pemrosesan ulang diabaikan dan sistem tetap membalas HTTP 200 seketika untuk mencegah *retry loop*.

---

### 9. `PRO-137: Setup Database Relasional & Migrasi Supabase`
* **Ruang Lingkup:**
  * Pemodelan skema PostgreSQL pada `prisma/schema.prisma` (`carts`, `cart_items`, `service_requests`, `processed_events`).
  * Konfigurasi connection pooling Supabase (`aws-0-eu-west-1.pooler.supabase.com`).
  * Eksekusi migrasi skema tabel secara *live* ke database cloud.

---

### 10. `PRO-138: Setup Dokumentasi OpenAPI Swagger UI & Deployment Vercel`
* **Ruang Lingkup:**
  * Pembuatan spesifikasi resmi `docs/openapi.yaml` (OpenAPI 3.0.3).
  * Setup Swagger UI interaktif di endpoint `/api/m5/v1/docs`.
  * Konfigurasi serverless deployment Vercel (`api/index.ts`, `vercel.json`, `tsc-alias`) dengan status produksi aktif.
