import { BookOpen, CheckCircle2, ChevronRight, Image as ImageIcon, PlayCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Nội dung dự phòng khi API hướng dẫn tạm thời chưa sẵn sàng.
// eslint-disable-next-line react-refresh/only-export-components
export const GUIDES = [
  {
    id: 'bat-dau', title: 'Bắt đầu sử dụng', description: 'Tạo tài khoản và thiết lập thông tin ban đầu.',
    steps: [
      ['Đăng ký tài khoản', 'Từ trang chủ, chọn “Đăng ký”, chọn vai trò Giáo viên hoặc Học sinh rồi nhập đầy đủ thông tin.'],
      ['Xác nhận và đăng nhập', 'Hoàn tất đăng ký, quay lại trang đăng nhập và dùng tài khoản vừa tạo.'],
      ['Cập nhật hồ sơ', 'Mở ảnh đại diện ở góc trên, chọn Hồ sơ cá nhân và bổ sung thông tin trường, lớp.'],
    ],
  },
  {
    id: 'bai-giang', title: 'Tạo bài giảng', description: 'Soạn, chỉnh sửa và chia sẻ bài giảng cho lớp học.',
    steps: [
      ['Mở Bài giảng', 'Tại thanh điều hướng, chọn Bài giảng rồi bấm Tạo bài giảng.'],
      ['Chọn cách soạn', 'Chọn trình soạn DOCX, PPTX hoặc Collabora tùy loại tài liệu cần tạo.'],
      ['Thêm nội dung', 'Nhập tiêu đề, nội dung; chèn hình, bảng và các công cụ minh họa cần thiết.'],
      ['Lưu và chia sẻ', 'Lưu bản nháp, kiểm tra lại nội dung rồi chia sẻ bài giảng vào lớp học phù hợp.'],
    ],
  },
  {
    id: 'kiem-tra', title: 'Tạo bài kiểm tra', description: 'Tạo câu hỏi, cấu hình và giao bài cho học sinh.',
    steps: [
      ['Mở Bài kiểm tra', 'Chọn Bài kiểm tra trên thanh điều hướng, sau đó chọn Tạo bài kiểm tra.'],
      ['Nhập thông tin chung', 'Điền tên bài, môn học, khối lớp, thời gian làm và hướng dẫn cho học sinh.'],
      ['Thêm câu hỏi', 'Tạo câu hỏi mới hoặc chọn từ ngân hàng câu hỏi; nhập đáp án và điểm số chính xác.'],
      ['Kiểm tra và giao bài', 'Xem trước toàn bộ đề, lưu lại, sau đó giao vào lớp và chọn thời hạn nộp bài.'],
    ],
  },
  {
    id: 'lop-hoc', title: 'Quản lý lớp học', description: 'Tạo lớp, mời học sinh và đăng nội dung.',
    steps: [
      ['Tạo hoặc tham gia lớp', 'Giáo viên chọn Tạo lớp; học sinh dùng liên kết hoặc mã mời được giáo viên cung cấp.'],
      ['Quản lý thành viên', 'Trong chi tiết lớp, mở tab Thành viên để mời, xem hoặc quản lý học sinh.'],
      ['Đăng nội dung', 'Dùng Bảng tin để đăng thông báo; dùng tab Bài học để giao bài giảng hoặc bài kiểm tra.'],
    ],
  },
  {
    id: 'cong-cu-ai', title: 'Công cụ AI và học liệu', description: 'Dịch, đọc văn bản, luyện phát âm và tạo hình minh họa.',
    steps: [
      ['Chọn công cụ', 'Mở Công cụ AI hoặc chọn trực tiếp Dịch thuật, Chuyển văn bản thành giọng nói, Phát âm hay Tạo ảnh.'],
      ['Nhập yêu cầu rõ ràng', 'Chọn ngôn ngữ/môn học phù hợp và mô tả ngắn gọn, đủ ý, phù hợp độ tuổi học sinh.'],
      ['Kiểm tra kết quả', 'Luôn đọc hoặc nghe lại kết quả AI, chỉnh lỗi kiến thức và ngôn ngữ trước khi dùng trong lớp.'],
      ['Lưu vào học liệu', 'Tải xuống hoặc đưa kết quả vào bài giảng, bài kiểm tra theo nhu cầu.'],
    ],
  },
  {
    id: 'phan-hoi', title: 'Báo lỗi hoặc góp ý', description: 'Gửi vấn đề ngay tại trang đang sử dụng và nhận trả lời qua thông báo.',
    steps: [
      ['Mở nút Trợ giúp', 'Bấm nút Trợ giúp ở góc dưới bên phải của bất kỳ trang nào.'],
      ['Chọn loại phản hồi', 'Chọn Báo lỗi nếu chức năng hoạt động sai, hoặc Góp ý nếu bạn muốn đề xuất cải tiến.'],
      ['Mô tả đủ thông tin', 'Ghi thao tác đã làm, kết quả mong muốn và kết quả thực tế. Không gửi mật khẩu.'],
      ['Theo dõi câu trả lời', 'Sau khi admin xử lý, câu trả lời sẽ xuất hiện trong mục Thông báo của tài khoản.'],
    ],
  },
];

function MediaPlaceholder({ stepNumber }) {
  return <div className="mt-4 flex min-h-44 items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 text-center"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-violet-500 shadow-sm"><ImageIcon className="h-6 w-6" /></div><p className="mt-3 text-sm font-semibold text-violet-700">Ảnh minh họa bước {stepNumber}</p><p className="mt-1 text-xs text-slate-500">Thêm ảnh chụp màn hình hoặc video ngắn tại đây</p></div></div>;
}

export default function HelpPage() {
  return <div className="min-h-screen bg-slate-50"><Navbar />
    <main className="pt-16">
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl text-center"><BookOpen className="mx-auto h-12 w-12" /><h1 className="mt-5 text-4xl font-extrabold md:text-5xl">Hướng dẫn sử dụng TeachPrimary</h1><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-violet-100">Các bước ngắn gọn, đúng thứ tự để giáo viên và học sinh dễ dàng làm theo.</p></div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24"><p className="px-3 pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Nội dung hướng dẫn</p>{GUIDES.map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700"><span>{guide.title}</span><ChevronRight className="h-4 w-4" /></a>)}</aside>
        <div className="space-y-10">{GUIDES.map((guide) => <section id={guide.id} key={guide.id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="mb-7"><h2 className="text-2xl font-bold text-slate-900">{guide.title}</h2><p className="mt-2 text-slate-500">{guide.description}</p></div><div className="space-y-8">{guide.steps.map(([title, text], index) => <article key={title} className="grid gap-4 md:grid-cols-[48px_1fr]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-200">{index + 1}</div><div><h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-500" />{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p><MediaPlaceholder stepNumber={index + 1} /></div></article>)}</div>{guide.id === 'cong-cu-ai' && <div className="mt-8 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800"><PlayCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>Nên dùng video 15–45 giây, chỉ quay một thao tác chính và không để lộ thông tin học sinh.</p></div>}</section>)}</div>
      </div>
    </main><Footer /></div>;
}
