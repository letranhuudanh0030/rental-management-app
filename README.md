# Quản Lý Phòng Trọ

Ứng dụng quản lý phòng trọ đơn giản dành cho chủ nhà Việt Nam, tối ưu cho thiết bị di động.

## Tính năng

- **Tổng quan**: Dashboard hiển thị doanh thu tháng, tỷ lệ lấp đầy, cảnh báo hóa đơn quá hạn
- **Danh sách phòng**: Quản lý phòng theo tầng, tìm kiếm, xem trạng thái (đang thuê/trống/bảo trì)
- **Ghi điện nước**: Nhập số đồng hồ điện/nước hàng tháng, tự động tính tiêu thụ
- **Hóa đơn**: Xem chi tiết hóa đơn với tiền phòng, điện, nước, dịch vụ
- **Thu tiền**: Theo dõi thanh toán, lọc theo trạng thái, gọi điện/Zalo nhanh

## Cài đặt

### Yêu cầu

- Node.js 18+ 
- pnpm (khuyên dùng) hoặc npm/yarn

### Chạy ở máy local

```bash
# Clone project
git clone <repository-url>
cd v0-project

# Cài đặt dependencies
pnpm install

# Chạy development server
pnpm dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

### Build production

```bash
pnpm build
pnpm start
```

## Cấu trúc thư mục

```
├── app/
│   ├── globals.css      # Styles và theme colors
│   ├── layout.tsx       # Root layout với font tiếng Việt
│   └── page.tsx         # Trang chính với navigation
├── components/
│   ├── bottom-nav.tsx   # Thanh điều hướng dưới cùng
│   ├── dashboard.tsx    # Trang tổng quan
│   ├── room-list.tsx    # Danh sách phòng
│   ├── meter-input.tsx  # Ghi số điện nước
│   ├── billing-page.tsx # Xem hóa đơn
│   └── payment-tracking.tsx # Theo dõi thu tiền
├── lib/
│   └── data.ts          # Types và mock data
└── components/ui/       # Shadcn UI components
```

## Công nghệ sử dụng

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Font**: Inter (hỗ trợ tiếng Việt)

## Tùy chỉnh

### Thay đổi dữ liệu mẫu

Chỉnh sửa file `lib/data.ts` để thay đổi:
- Danh sách phòng (`mockRooms`)
- Giá điện/nước/phòng (`mockPrices`)
- Hóa đơn mẫu (`mockBills`)

### Thay đổi màu sắc

Chỉnh sửa CSS variables trong `app/globals.css`:
- `--primary`: Màu chính (xanh lá)
- `--accent`: Màu nhấn (vàng cam)
- `--background`: Màu nền

## Tích hợp database (tùy chọn)

Ứng dụng hiện sử dụng mock data. Để tích hợp database thật:

1. Kết nối Supabase hoặc database khác
2. Tạo các bảng: `rooms`, `tenants`, `meters`, `bills`, `payments`
3. Thay thế mock data bằng API calls

# AI tools used:

v0 by Vercel - https://v0.dev?utm_source=chatgpt.com

## License

MIT
