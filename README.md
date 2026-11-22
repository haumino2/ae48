# AE48 · Sổ quỹ

> Repository công khai này sử dụng dữ liệu minh họa. Không có tên, công nợ hoặc file Excel thật. Bản dữ liệu thật vẫn giữ riêng trên máy.

Website tĩnh với biểu mẫu gửi bill và góp ý qua Netlify Forms. Không có tài khoản admin hoặc xác nhận thanh toán trong app. Công nợ vẫn cập nhật qua Excel. Trình duyệt chỉ nhớ tên đang xem, không giả lưu yêu cầu làm dữ liệu dùng chung.

## Xem và kiểm tra

Chạy `npm run dev`, mở http://127.0.0.1:4173. Có thể mở trực tiếp `dist/index.html` vì dữ liệu được đóng gói cùng trang.

`npm run build` chuyển bản trích xuất Excel thành `dist/data.json` và `dist/data.js`. `npm run check` kiểm tra cân đối, khách S18, làm tròn và loại các dòng không đủ dữ liệu.

## Cập nhật từ Excel

Nguồn hiện tại: file Google Drive được ghi trong `scripts/source-snapshot.json`. Khi nhận file mới, đọc/trích xuất file và cập nhật bản nguồn này, chạy build và check, xem lại giao diện rồi triển khai. Bộ chuyển đổi hiện hỗ trợ bố cục file AE48 đã kiểm tra; không phải trình import mọi file Excel tùy ý. Nếu bố cục đổi, cần cập nhật bộ chuyển đổi và mốc đối chiếu trong check.

Số tiền hiển thị là tạm tính từ chi tiết các buổi chưa collect. Các buổi đã collect hoặc đã cân (gồm S02 và N2) được bỏ khỏi dữ liệu web và cảnh báo. N10 chưa có bill, vẫn giữ ở trạng thái chờ. Danh sách công nợ, bộ chọn tên và CSV chỉ hiển thị người có số dư khác 0. Không suy ra giao dịch thu/hoàn từ collect status. Cả hai khách S18 được giữ trong phép tính. Thông và Thống là hai hồ sơ khác nhau theo nguồn. Ngày còn thiếu không được suy đoán.

## Deploy từ GitHub lên Netlify

Kết nối repository `haumino2/ae48` với một dự án AE48 riêng trên Netlify. File `netlify.toml` cấu hình lệnh kiểm tra `npm run check` và thư mục xuất bản `dist`. Không cần cài thêm thư viện. Mỗi lần push vào main, Netlify có thể tự deploy bản mới.

Dữ liệu tĩnh trong `dist` là dữ liệu hiện hành được đưa cùng website. File Excel trích xuất đầy đủ `scripts/source-snapshot.json` được giữ riêng trên máy và không đưa lên GitHub, cùng với cấu hình hosting Sites cũ. Khi không có file nguồn riêng tư, `npm run build` giữ nguyên dữ liệu đã chuẩn bị trong `dist`.


## Kích hoạt gửi bill và góp ý trên Netlify

1. Trong dự án AE48 trên Netlify, vào Forms và bật Enable form detection.
2. Deploy lại thư mục dist đầy đủ (hoặc ZIP giải nén). Netlify nhận hai biểu mẫu ae48-bills và ae48-comments từ HTML tĩnh.
3. Kiểm tra cả hai biểu mẫu trong Netlify Forms rồi gửi thử một yêu cầu kiểm thử đã được phép. Bản local/file và hosting chưa xử lý form sẽ khóa gửi, không báo thành công giả.
4. Admin đăng nhập Netlify để đọc yêu cầu. Có thể bật thông báo trong Forms > Submission notifications nếu muốn. Không cần đưa token Netlify vào website.
5. Duyệt nghiệp vụ bằng cách kiểm tra bill, người ứng, người chịu, tên mới và mã request_id để tránh nhập trùng; ghi khoản được duyệt vào Excel. Từ chối hoặc xử lý góp ý bên ngoài app. Cập nhật gói web từ file Excel mới.

Đây là hộp nhận yêu cầu, không phải màn hình duyệt trong app hay luồng comment công khai. Yêu cầu và góp ý gửi riêng admin. Không tự thay đổi data.json sau khi nhận form. Nhận file JPG/PNG/WebP/PDF tối đa 5MB. Không upload hóa đơn thật trong kiểm thử nếu chưa được cho phép.

Chưa kiểm chứng nhận yêu cầu thực tế trên Netlify vì chưa có dự án AE48 đã deploy/kết nối. Sau khi bật form detection phải redeploy rồi thử cả hai biểu mẫu trước khi chia sẻ cho nhóm. Tính năng này không hoạt động trên Sites hoặc GitHub Pages chỉ bằng cách tải HTML lên.
