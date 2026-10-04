# Portfolio Admin

Trang quản trị:

- GitHub Pages project site: `/Portfolio-GiaPhu/admin/`
- Nếu dùng custom domain ở root: `/admin/`

## Thiết lập lần đầu

1. Mở Supabase Dashboard của project portfolio.
2. Vào **SQL Editor**.
3. Chạy toàn bộ file:
   `admin/supabase-cms.sql`
4. Đảm bảo GitHub provider trong **Authentication → Providers** đang bật.
5. Mở trang `/admin/`.
6. Bấm **Đăng nhập bằng GitHub**.

Admin chỉ cho phép tài khoản OAuth có email
`giaphufpt1@gmail.com`
được quyền chỉnh sửa. Không cần password Supabase riêng.

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


## Redirect URL bắt buộc cho admin

Trong Supabase vào **Authentication → URL Configuration → Redirect URLs** và thêm:

`https://dev-giaphu.github.io/Portfolio-GiaPhu/admin/`

Nếu URL này chưa được allowlist, GitHub OAuth có thể đăng nhập xong nhưng không quay lại đúng trang admin.


## Nếu admin báo lỗi RLS khi lưu

Chạy lại **TOÀN BỘ** file `admin/supabase-cms.sql` mới nhất trong Supabase SQL Editor.

Bản policy mới kiểm tra trực tiếp `auth.users` và `auth.identities`, nên hoạt động cả khi GitHub để email ở chế độ private.

Sau khi chạy SQL:
1. Đăng xuất khỏi `/admin/`.
2. Đăng nhập lại bằng GitHub `Dev-GiaPhu` hoặc Google/email `giaphufpt1@gmail.com`.
3. Thử lưu lại.
