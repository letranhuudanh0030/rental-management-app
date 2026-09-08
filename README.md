# Quản lý phòng trọ — Rental Management MVP

Ứng dụng fullstack cho chủ nhà trọ quy mô nhỏ (10–50 phòng) tại Việt Nam. Tối ưu mobile, workflow thu tiền hàng tháng nhanh, ít thao tác.

## Tech stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (Auth, Postgres, RLS)

## Tính năng

| Module | Mô tả |
|--------|--------|
| Đăng nhập / Đăng ký | Supabase Auth |
| Phòng | CRUD, lọc tầng, trạng thái |
| Khách thuê | Thêm khách, gán phòng, hợp đồng |
| Điện nước | Nhập số hàng loạt, spreadsheet-style |
| Hóa đơn | Tự tính điện/nước, tạo hóa đơn tháng |
| Thu tiền | Tiền mặt / chuyển khoản, lọc nợ |
| Nhắc nợ | Mẫu tin Zalo/SMS, sao chép nhanh |
| Tổng quan | Doanh thu, công nợ, tỷ lệ lấp phòng |

## Cài đặt

### 1. Clone & cài dependency

```bash
pnpm install
```

### 2. Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env.local` và điền URL + anon key
3. Chạy migration:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

Hoặc chạy các file trong `supabase/migrations/` theo thứ tự trên SQL Editor của dashboard.

4. Trong **Authentication → Providers**, bật Email. Tắt “Confirm email” nếu muốn dev nhanh (không khuyến nghị production).

### 3. Chạy app

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) → Đăng ký → **Cài đặt** → **Tải dữ liệu demo**.

## Cấu trúc thư mục

```
app/
  (auth)/login, signup
  (app)/          # Shell + bottom nav
  api/            # REST routes
lib/
  supabase/       # Client, server, middleware
  services/       # Invoice generation
  types/          # TypeScript models
  seed/           # Demo data
supabase/migrations/
```

## API (authenticated)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/dashboard` | Tổng quan |
| GET/POST | `/api/rooms` | Phòng |
| GET/POST | `/api/tenants` | Khách + hợp đồng |
| GET/POST | `/api/meters?period=YYYY-MM-01` | Điện nước |
| GET | `/api/invoices?period=` | Hóa đơn |
| POST | `/api/invoices/generate` | Tạo HĐ tháng |
| POST | `/api/payments` | Ghi nhận thu |
| GET/PATCH | `/api/settings` | Giá điện/nước |
| POST | `/api/seed` | Dữ liệu demo (dev) |

## Quy tắc nghiệp vụ

- **Điện/nước**: `(số mới − số cũ) × đơn giá` từ `landlord_settings`
- **Hóa đơn**: Tự tạo từ phòng `occupied` + chỉ số tháng + hợp đồng active
- **Thanh toán**: `unpaid` | `paid_cash` | `paid_transfer`
- **Quá hạn**: `unpaid` và `due_date < hôm nay`

## Production

```bash
pnpm build
pnpm start
```

Đặt biến môi trường trên Vercel/hosting. Không bật `ALLOW_SEED` trên production trừ khi cần.

## License

MIT
