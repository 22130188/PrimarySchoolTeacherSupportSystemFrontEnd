import { useEffect, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ChevronRight, GraduationCap, Image as ImageIcon, Loader2, PlayCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getPublishedGuides, youtubeEmbedUrl } from '../../services/guideApi';
import { GUIDES as FALLBACK_GUIDES } from './index';

const normalizeFallback = () => FALLBACK_GUIDES.map((guide, guideIndex) => ({
  ...guide, sortOrder: guideIndex,
  steps: guide.steps.map(([title, content], stepIndex) => ({ title, content, sortOrder: stepIndex })),
}));

const ROLE_FUNCTIONS = [
  {
    id: 'chuc-nang-giao-vien', role: 'Giáo viên', icon: BookOpenCheck, accent: 'violet',
    intro: 'Tạo học liệu, tổ chức lớp học, giao nhiệm vụ và theo dõi kết quả học tập.',
    groups: [
      { title: 'Tài khoản và trang tổng quan', items: ['Đăng ký, đăng nhập, đăng xuất và đăng nhập bằng Google', 'Xem trang tổng quan, tìm kiếm và mở lại nội dung gần đây', 'Cập nhật hồ sơ, ảnh đại diện, thông tin trường và lớp phụ trách', 'Đổi mật khẩu, xem thông báo và phản hồi từ quản trị viên'] },
      { title: 'Bài giảng', items: ['Tạo và quản lý bài giảng DOCX, PPTX, DOCX/PPTX Collabora', 'Soạn, định dạng, chèn hình và sử dụng thư viện ảnh minh họa', 'Lưu bản nháp; tìm kiếm, lọc theo loại, môn và khối lớp', 'Xem trước, chỉnh sửa, đổi tên, nhân bản và xóa bài giảng', 'Dùng mẫu; chia sẻ cho giáo viên khác hoặc vào lớp học', 'Dịch nội dung và xuất/tải tệp bài giảng'] },
      { title: 'Bài kiểm tra và câu hỏi', items: ['Tạo, xem trước, chỉnh sửa, xuất bản và xóa bài kiểm tra hoặc bài tập', 'Cấu hình môn, khối, thời gian, thời hạn, lượt làm và hướng dẫn', 'Tạo câu hỏi trắc nghiệm, đáp án, điểm số và nội dung minh họa', 'Tìm kiếm, lọc và tái sử dụng ngân hàng câu hỏi', 'Giao bài; xem lượt làm, kết quả, điểm và thống kê học sinh'] },
      { title: 'Lớp học', items: ['Tạo, tìm kiếm, lọc và mở chi tiết lớp', 'Chỉnh sửa thông tin hoặc xóa lớp', 'Mời học sinh bằng email, liên kết hoặc mã lớp; tạo lại mã/liên kết', 'Quản lý thành viên, lời mời và xóa học sinh khỏi lớp', 'Đăng thông báo, bài tập, bài kiểm tra và bài giảng', 'Bình luận, quản lý bài đăng và nội dung đã giao'] },
      { title: 'AI, hình ảnh và học liệu', items: ['Chuyển văn bản thành giọng nói, nghe thử và tải âm thanh', 'Dịch Việt–Anh/Anh–Việt; luyện và đánh giá phát âm', 'Tạo ảnh AI; tải ảnh, cắt, điều chỉnh và thiết kế minh họa', 'Vẽ hình học, phân số, số, đồng hồ, lịch, biểu đồ, thước đo, chữ và nhãn dán', 'Duyệt sách giáo khoa theo môn/khối và đọc từng trang'] },
      { title: 'Hỗ trợ', items: ['Mở hướng dẫn sử dụng', 'Gửi báo lỗi hoặc góp ý', 'Theo dõi thông báo và câu trả lời của quản trị viên'] },
    ],
  },
  {
    id: 'chuc-nang-hoc-sinh', role: 'Học sinh', icon: GraduationCap, accent: 'teal',
    intro: 'Tham gia lớp, tiếp nhận học liệu, làm bài và sử dụng các công cụ hỗ trợ học tập.',
    groups: [
      { title: 'Tài khoản và trang tổng quan', items: ['Đăng ký, đăng nhập, đăng xuất và đăng nhập bằng Google', 'Xem bài giảng, bài tập và bài kiểm tra mới nhất trong lớp', 'Cập nhật hồ sơ, ảnh đại diện, thông tin trường và lớp', 'Đổi mật khẩu, xem thông báo và phản hồi từ quản trị viên'] },
      { title: 'Lớp học và trao đổi', items: ['Tham gia lớp bằng mã, liên kết hoặc chấp nhận lời mời', 'Xem danh sách lớp và thông tin giáo viên phụ trách', 'Xem bảng tin, thông báo, bài tập, bài kiểm tra và bài giảng', 'Đăng nội dung được phép, bình luận và quản lý bài đăng của mình', 'Xem giáo viên và các thành viên trong lớp'] },
      { title: 'Học bài và làm bài', items: ['Xem bài giảng được chia sẻ theo quyền giáo viên cấp', 'Sao chép bài giảng khi được cho phép', 'Mở bài tập/kiểm tra, xem hướng dẫn và thời gian làm', 'Chọn đáp án, nộp bài, nhận điểm và xem lịch sử làm bài', 'Làm lại bài tập khi còn lượt'] },
      { title: 'Công cụ học tập và học liệu', items: ['Chuyển văn bản thành giọng nói để luyện nghe', 'Dịch Việt–Anh/Anh–Việt', 'Ghi âm, luyện phát âm và xem kết quả đánh giá', 'Tạo hoặc chỉnh sửa hình minh họa tại công cụ được mở', 'Duyệt sách giáo khoa theo môn/khối và đọc từng trang'] },
      { title: 'Hỗ trợ', items: ['Mở hướng dẫn sử dụng', 'Gửi báo lỗi hoặc góp ý', 'Theo dõi thông báo và câu trả lời của quản trị viên'] },
    ],
  },
];

const ROLE_GUIDE_ANCHORS = {
  'Giáo viên': ['bat-dau', 'tao-bai-giang', 'tao-bai-kiem-tra', 'quan-ly-lop-hoc', 'cong-cu-ai-va-hoc-lieu', 'bao-loi-hoac-gop-y'],
  'Học sinh': ['hoc-sinh-bat-dau', 'hoc-sinh-lop-hoc', 'hoc-sinh-hoc-va-lam-bai', 'hoc-sinh-cong-cu-hoc-tap', 'hoc-sinh-ho-tro'],
};

export default function ManagedHelpPage() {
  const [guides, setGuides] = useState(normalizeFallback);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    getPublishedGuides().then((data) => {
      const list = Array.isArray(data) ? data : data?.content || [];
      if (list.length) setGuides(list);
    }).catch(() => setUsingFallback(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const anchor = decodeURIComponent(window.location.hash.slice(1));
    requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [guides, loading]);

  const handleGuideClick = (event, anchor) => {
    event.preventDefault();
    window.history.replaceState(null, '', `#${anchor}`);
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <div className="min-h-screen bg-slate-50"><Navbar />
    <main className="pt-16">
      <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-b from-violet-100 via-purple-50 to-white px-4 py-10 md:py-12"><div className="pointer-events-none absolute left-[8%] top-12 h-3 w-3 rounded-full bg-violet-300/60" /><div className="pointer-events-none absolute right-[12%] top-20 h-4 w-4 rounded-full bg-fuchsia-200/70" /><div className="pointer-events-none absolute bottom-14 left-[18%] h-2.5 w-2.5 rounded-full bg-teal-200/70" /><div className="pointer-events-none absolute bottom-10 right-[20%] h-3 w-3 rounded-full bg-violet-200/70" /><div className="relative mx-auto max-w-6xl text-center"><h1 className="text-3xl font-extrabold tracking-tight text-violet-600 md:text-4xl">Hướng dẫn sử dụng TeachPrimary</h1><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Hướng dẫn trực quan, ngắn gọn và được cập nhật bởi quản trị viên.</p></div></section>
      {loading && <div className="flex justify-center py-8"><Loader2 className="h-7 w-7 animate-spin text-violet-500" /></div>}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24"><p className="px-3 pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Nội dung hướng dẫn</p>{ROLE_FUNCTIONS.map((section) => { const Icon = section.icon; const teacher = section.accent === 'violet'; return <div key={section.id} className="mb-4 last:mb-0"><div className={'mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ' + (teacher ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700')}><Icon className="h-4 w-4" /><span>{section.role}</span></div>{section.groups.map((group, index) => <a key={group.title} href={'#' + ROLE_GUIDE_ANCHORS[section.role][index]} onClick={(event) => handleGuideClick(event, ROLE_GUIDE_ANCHORS[section.role][index])} className="flex items-center justify-between rounded-xl py-2 pl-5 pr-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-violet-700"><span>{group.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></a>)}</div>; })}</aside>
        <div className="space-y-10">{usingFallback && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Đang hiển thị nội dung hướng dẫn mặc định vì dịch vụ dữ liệu tạm thời chưa kết nối.</p>}{guides.map((guide) => <section id={guide.slug || guide.id} key={guide.id || guide.slug} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="mb-7"><h2 className="text-2xl font-bold text-slate-900">{guide.title}</h2><p className="mt-2 text-slate-500">{guide.description}</p></div><div className="space-y-8">{[...(guide.steps || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((step, index) => { const videoUrl = youtubeEmbedUrl(step.videoUrl); return <article key={step.id || `${guide.id}-${index}`} className="grid gap-4 md:grid-cols-[48px_1fr]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-200">{index + 1}</div><div><h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-500" />{step.title}</h3><p className="mt-2 whitespace-pre-line leading-7 text-slate-600">{step.content}</p>{step.imageUrl && <img src={step.imageUrl} alt={step.imageAlt || step.title} loading="lazy" className="mt-4 max-h-[560px] w-full rounded-2xl border border-slate-200 object-contain bg-slate-50" />}{videoUrl && <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-slate-950"><iframe src={videoUrl} title={`Video: ${step.title}`} className="h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}{!step.imageUrl && !videoUrl && <div className="mt-4 flex min-h-36 items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50"><div className="text-center text-violet-500"><ImageIcon className="mx-auto h-7 w-7" /><p className="mt-2 text-xs font-semibold">Minh họa đang được cập nhật</p></div></div>}</div></article>; })}</div>{guide.note && <div className="mt-8 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800"><PlayCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>{guide.note}</p></div>}</section>)}</div>
      </div>
    </main><Footer /></div>;
}
