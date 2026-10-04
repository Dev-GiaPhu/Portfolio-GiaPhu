# Portfolio Admin

Trang quản trị:

- GitHub Pages project site: `/Portfolio-GiaPhu/admin/`
- Nếu dùng custom domain ở root: `/admin/`

## Thiết lập lần đầu

1. Mở Supabase Dashboard của project portfolio.
2. Vào **SQL Editor**.
3. Chạy toàn bộ file:
   `admin/supabase-cms.sql`
4. Vào **Authentication → Users**.
5. Tạo user:
   - Email: `giaphufpt1@gmail.com`
   - Password: tự đặt password riêng của bạn.
6. Mở trang `/admin/` và đăng nhập.

Password không nằm trong repository.

## Điều khiển editor

- Click text trên preview: sửa trực tiếp.
- Click ảnh: đổi URL hoặc upload ảnh mới.
- `Ctrl + S`: lưu lên Supabase.
- `Ctrl + Z`: hoàn tác.
- `Ctrl + Shift + Z`: làm lại.
- Nút **Khôi phục dữ liệu đã lưu**: xóa override CMS của phần tử đang chọn và quay về nội dung mặc định trong source.

## Bảo mật

Supabase RLS chỉ cho tài khoản có email
`giaphufpt1@gmail.com`
ghi/xóa nội dung và upload media.

Người khác có thể biết URL `/admin/` vì website/repository là public, nhưng không thể ghi dữ liệu nếu không đăng nhập đúng tài khoản.
