# Người Mới Học AI — Sales Page

Trang bán hàng cho kênh **NGƯỜI MỚI HỌC AI** (chia sẻ thủ thuật ảnh AI, video AI, ứng dụng affiliate) + trang quản trị đo lường khách truy cập/khách để lại thông tin.

## Cấu trúc file

| File | Mô tả |
|---|---|
| `index.html` | Trang bán hàng chính (5 phần: hero, tiềm năng, template, feedback, xử lý từ chối + form đăng ký) |
| `admin.html` / `admin.js` | Trang quản trị — Phần 05: đo lượt truy cập, danh sách khách hàng |
| `style.css` / `admin.css` | Toàn bộ giao diện (nền hồng, tiêu đề Anton trắng, chữ nhỏ Arimo) |
| `script.js` | Logic trang bán hàng: ghi log lượt xem, gửi form, FAQ, lọc template |
| `config.js` | Nơi dán URL Google Apps Script sau khi deploy |
| `apps-script.gs` | Code backend dán vào Google Apps Script để lưu dữ liệu vào Google Sheets |

## Chạy thử ngay (chưa cần kết nối gì)

Mở trực tiếp `index.html` bằng trình duyệt (hoặc dùng Live Server). Trang sẽ chạy ở **chế độ demo**: dữ liệu lượt xem và form đăng ký được lưu tạm trong `localStorage` của trình duyệt, đủ để bạn xem giao diện `admin.html` hoạt động thử. Đây **không phải** dữ liệu khách hàng thật và chỉ tồn tại trên máy bạn.

Đây cũng là chế độ mặc định khi deploy lên Vercel (xem bên dưới) — bạn có thể đưa trang lên internet ngay, chưa cần cấu hình gì thêm. Khi nào cần đo lường khách thật từ mọi người truy cập, làm theo phần **Kết nối dữ liệu thật qua Google Sheets (tuỳ chọn, làm sau)**.

## Deploy lên Vercel (qua GitHub)

1. Tạo một **repository trống** trên GitHub (đăng nhập github.com bằng tài khoản của bạn → nút **New repository** → đặt tên vd `nguoi-moi-hoc-ai` → **không** tick "Add a README" → Create repository). Copy URL dạng `https://github.com/<username>/nguoi-moi-hoc-ai.git`.
2. Gửi URL đó để code được đẩy (push) lên repo.
3. Vào [vercel.com](https://vercel.com) → đăng nhập bằng Gmail của bạn (Vercel hỗ trợ đăng nhập bằng Google) → **Add New... → Project** → **Import** repo `nguoi-moi-hoc-ai` vừa tạo.
4. Ở bước cấu hình, chọn **Framework Preset: Other** (trang này là HTML/CSS/JS thuần, không cần build) → **Deploy**.
5. Sau ~30 giây, Vercel cấp cho bạn một URL dạng `https://nguoi-moi-hoc-ai.vercel.app` — đây là link sống, có thể chia sẻ ngay.
6. Mỗi lần bạn cập nhật code và push lên GitHub, Vercel sẽ tự động deploy lại bản mới.

## Kết nối dữ liệu thật qua Google Sheets (tuỳ chọn, làm sau)

### Bước 1 — Tạo Google Sheet
1. Vào [sheets.google.com](https://sheets.google.com) → tạo bảng tính mới, đặt tên ví dụ `Data - Nguoi Moi Hoc AI`.

### Bước 2 — Thêm Apps Script
1. Trong Sheet, vào menu **Extensions (Tiện ích mở rộng) → Apps Script**.
2. Xoá hết code mẫu, dán toàn bộ nội dung file [`apps-script.gs`](apps-script.gs) vào.
3. Bấm **Save** (biểu tượng đĩa mềm).

### Bước 3 — Deploy Web App
1. Bấm **Deploy → New deployment**.
2. Chọn loại **Web app**.
3. Cấu hình:
   - **Execute as**: Me (tài khoản của bạn)
   - **Who has access**: Anyone
4. Bấm **Deploy**, cấp quyền khi được hỏi (Authorize access).
5. Copy **Web app URL** dạng: `https://script.google.com/macros/s/xxxxxxxxxxxx/exec`

### Bước 4 — Gắn URL vào trang web
Có 2 cách (chọn 1):

**Cách A — Gắn cố định (khuyến nghị khi đưa lên hosting thật):**
Mở file `config.js`, dán URL vào:
```js
window.NMHA_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/xxxxxxxxxxxx/exec"
};
```

**Cách B — Gắn nhanh để test:**
Mở `admin.html`, dán URL vào ô **Google Apps Script Web App URL** ở đầu trang → bấm **Kết nối**. URL này được lưu trong `localStorage` của trình duyệt và được ưu tiên hơn `config.js`.

Sau khi kết nối, mỗi lượt khách mở `index.html` và mỗi lượt điền form sẽ tự động được ghi vào tab **Data** trong Google Sheet, đồng thời hiển thị realtime trên `admin.html`.

## Đưa hình ảnh/video thật lên trang

Trong `index.html`, các vị trí ảnh/video hiện là khối placeholder chuẩn tỉ lệ (`<div class="ph-card ...">`) để đảm bảo mọi ảnh cùng kích thước, cùng bố cục khi bạn thay thế. Khi có ảnh/video thật:

1. Thay thẻ `<div class="ph-card ...">...</div>` bằng `<img src="duong-dan-anh.jpg" alt="Mô tả ảnh" loading="lazy">` (giữ nguyên class `ph-card` để giữ đúng khung tỉ lệ), hoặc `<video>` cho phần video.
2. Dùng đúng kích thước ghi trên mỗi khối (ví dụ 1080×1080, 1080×1920, 1200×628) để ảnh không bị vỡ bố cục hoặc mất nét trên di động.

## Tuỳ biến nội dung / SEO

- `<title>`, `meta description`, Open Graph nằm trong `<head>` của `index.html` — sửa lại theo domain thật khi deploy.
- Đổi `og:url` và `rel="canonical"` sang domain thật của bạn.
- Dữ liệu FAQ (Phần 04 — Xử lý từ chối) đã được đánh dấu `schema.org FAQPage` để hỗ trợ SEO rich snippet trên Google — nếu sửa câu hỏi trong phần HTML, nhớ sửa luôn khối JSON-LD tương ứng ở đầu trang.

## Bảo mật trang quản trị

Theo yêu cầu hiện tại, `admin.html` **không có đăng nhập** — bất kỳ ai có link đều xem được danh sách khách hàng. Nếu sau này cần bảo mật, cách đơn giản nhất là:
- Đặt `admin.html` ở một đường dẫn khó đoán, không link công khai từ trang chủ, hoặc
- Thêm xác thực (mật khẩu, Google Sign-In) trước khi tải dữ liệu.
