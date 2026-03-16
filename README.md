# Restaurant Ordering Frontend

Giao diện đặt món nhà hàng cho khách hàng & quản trị viên, xây dựng trên Next.js 16 App Router.

## Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | React Hooks (useState, useCallback, useMemo) |
| Auth | JWT localStorage + React Context |

## Cấu trúc

```
app/
├── page.tsx                 # Trang chủ: menu, giỏ hàng, đặt đơn, theo dõi đơn
├── layout.tsx               # Root layout + AuthProvider
├── globals.css              # Tailwind config
├── auth/
│   └── page.tsx             # Đăng nhập / Đăng ký
├── orders/
│   └── [id]/page.tsx        # Chi tiết đơn hàng + timeline trạng thái
├── admin/
│   ├── layout.tsx           # Guard: chỉ ADMIN mới vào được
│   ├── page.tsx             # Admin portal dashboard
│   ├── menu/page.tsx        # CRUD quản lý menu (tạo/sửa/xóa/tắt bán)
│   ├── orders/page.tsx      # Điều phối đơn hàng (accept/reject/lifecycle)
│   └── inventory/page.tsx   # Quản lý tồn kho
├── components/
│   └── Toast.tsx            # Toast notification system
├── providers/
│   └── AuthProvider.tsx     # Auth context (login, register, logout, isAdmin)
└── lib/
    ├── api.ts               # API client (fetch wrapper)
    ├── types.ts             # TypeScript interfaces
    └── utils.ts             # formatVND, ORDER_STATUS_LABELS, downloadCsv
```

## Trang & Tính năng

### Khách hàng
| Trang | Mô tả |
|-------|-------|
| `/` | Menu công khai, giỏ hàng, đặt đơn, danh sách đơn (polling 8s) |
| `/auth` | Đăng nhập / Đăng ký (hỗ trợ query `?mode=login\|register`) |
| `/orders/[id]` | Chi tiết đơn: danh sách món, tổng tiền, ghi chú, timeline trạng thái |

### Admin (yêu cầu role ADMIN)
| Trang | Mô tả |
|-------|-------|
| `/admin` | Dashboard admin — link tới quản lý menu, đơn hàng, tồn kho |
| `/admin/menu` | CRUD món ăn: tạo, sửa, xóa, toggle bán/tắt |
| `/admin/orders` | Điều phối đơn: xác nhận, từ chối, chuyển trạng thái |
| `/admin/inventory` | Xem & cập nhật tồn kho, thống kê, lịch sử, export CSV |

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 20
- Yarn hoặc npm

### Cài đặt dependencies

```bash
yarn install
# hoặc
npm install
```

### Biến môi trường

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com
```

Hoặc để chạy local với backend `serverless offline`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Chạy dev server

```bash
yarn dev
# hoặc
npm run dev
# App chạy tại http://localhost:3000
```

### Build production

```bash
yarn build
yarn start
```

## Luồng sử dụng

### Khách hàng
1. Xem menu công khai (không cần đăng nhập)
2. Đăng nhập / Đăng ký
3. Thêm món vào giỏ → Đặt hàng
4. Theo dõi trạng thái đơn real-time (polling 8s)
5. Nhận toast notification khi đơn được xác nhận/từ chối

### Admin
1. Đăng nhập bằng tài khoản admin
2. Vào `/admin` → Quản lý menu hoặc Duyệt đơn
3. CRUD menu: tạo món, cập nhật giá, tắt/mở bán, xóa
4. Duyệt đơn: xác nhận → đang nấu → sẵn sàng → hoàn thành

## Phân quyền

- **Public**: Xem menu (`/`, `/menu`)
- **User**: Đặt hàng, xem đơn (`/orders`)
- **Admin**: Quản lý menu, duyệt đơn, quản lý tồn kho (`/admin/*`)
- Route `/admin/*` tự động redirect về `/auth?mode=login` nếu không phải admin
