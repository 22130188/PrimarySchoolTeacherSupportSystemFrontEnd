const MODULE_LABELS = {
  USERS: 'người dùng',
  USER: 'người dùng',
  PROFILE: 'hồ sơ',
  PERSONAL: 'hồ sơ',
  TOGGLE_STATUS: 'người dùng',
  TOGGLE_SHARING: 'câu hỏi',
  SCHOOL: 'trường học',
  CLASSES: 'lớp phụ trách',
  AUTH: 'xác thực',
  LOGOUT: 'đăng xuất',
  ROLES: 'vai trò',
  PERMISSIONS: 'quyền',
  CLASSROOMS: 'lớp học',
  CLASSROOM: 'lớp học',
  SUBJECTS: 'môn học',
  SUBJECT: 'môn học',
  CATEGORIES: 'danh mục',
  CATEGORY: 'danh mục',
  LESSONS: 'bài giảng',
  LESSON: 'bài giảng',
  DRAFTS: 'bài giảng',
  DRAFT: 'bài giảng',
  TESTS: 'bài kiểm tra',
  TEST: 'bài kiểm tra',
  EXERCISES: 'bài tập',
  EXERCISE: 'bài tập',
  EXAMS: 'bài kiểm tra',
  EXAM: 'bài kiểm tra',
  QUESTIONS: 'câu hỏi',
  QUESTION: 'câu hỏi',
  RESOURCES: 'tài nguyên',
  IMAGES: 'hình ảnh',
  IMAGE: 'hình ảnh',
  SAVE: 'hình ảnh',
  UPLOAD_IMAGE: 'hình ảnh',
  UPLOAD_AUDIO: 'âm thanh',
  TTS: 'âm thanh TTS',
  AUDIOS: 'âm thanh',
  AUDIO: 'âm thanh',
  NOTIFICATIONS: 'thông báo',
  NOTIFICATION: 'thông báo',
  FEEDBACK: 'phản hồi',
  GUIDES: 'hướng dẫn',
  GUIDE: 'hướng dẫn',
  DASHBOARD: 'bảng điều khiển',
  ACTION_LOGS: 'nhật ký hành động',
  ACCESS_LOGS: 'nhật ký truy cập',
  TEXTBOOKS: 'sách giáo khoa',
  TEXTBOOK: 'sách giáo khoa',
  TEMPLATES: 'mẫu bài giảng',
  TEMPLATE: 'mẫu bài giảng',
  POSTS: 'bài đăng',
  CLASSROOM_POSTS: 'bài đăng lớp học',
  ASSIGNMENTS: 'bài tập',
  ASSIGNMENT: 'bài tập',
  COMMENTS: 'bình luận',
  MEMBERS: 'thành viên',
  INVITE: 'lời mời',
  INVITATIONS: 'lời mời',
  CLASSROOM_SHARES: 'chia sẻ bài giảng',
  CLASSROOM_SHARE: 'chia sẻ bài giảng',
  SHARES: 'chia sẻ bài giảng',
  SHARE: 'chia sẻ bài giảng',
  OAUTH2: 'đăng nhập Google',
  CANVAS: 'canvas',
  TRANSLATE: 'dịch thuật',
  PRONUNCIATION: 'phát âm',
  CHECK: 'phát âm',
  DOCX: 'tài liệu Word',
  SYSTEM: 'hệ thống',
};

const EXACT_LABELS = {
  LOGIN: 'Đăng nhập',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất',
  CHANGE_PASSWORD: 'Đổi mật khẩu',
  PASSWORD_CHANGE: 'Đổi mật khẩu',
  SHARE_LESSONS_CLASS: 'Chia sẻ bài giảng vào lớp học',
  SHARE_LESSON_CLASS: 'Chia sẻ bài giảng vào lớp học',
  SHARE_LESSONS: 'Chia sẻ bài giảng cho giáo viên',
  SHARE_LESSON: 'Chia sẻ bài giảng cho giáo viên',
  CREATE_CLASSROOM_POSTS: 'Tạo bài đăng trên lớp học',
  UPDATE_CLASSROOM_POSTS: 'Cập nhật bài đăng lớp học',
  DELETE_CLASSROOM_POSTS: 'Xóa bài đăng lớp học',
  CREATE_POSTS: 'Tạo bài đăng trên lớp học',
  UPDATE_POSTS: 'Cập nhật bài đăng lớp học',
  DELETE_POSTS: 'Xóa bài đăng lớp học',
  CREATE_CLASSROOM_ANNOUNCEMENT: 'Tạo thông báo trên lớp học',
  UPDATE_CLASSROOM_ANNOUNCEMENT: 'Cập nhật thông báo lớp học',
  DELETE_CLASSROOM_ANNOUNCEMENT: 'Xóa thông báo lớp học',
  CREATE_CLASSROOM_ASSIGNMENT: 'Tạo bài tập trên lớp học',
  UPDATE_CLASSROOM_ASSIGNMENT: 'Cập nhật bài tập lớp học',
  DELETE_CLASSROOM_ASSIGNMENT: 'Xóa bài tập lớp học',
  CREATE_CLASSROOM_TEST: 'Tạo bài kiểm tra trên lớp học',
  UPDATE_CLASSROOM_TEST: 'Cập nhật bài kiểm tra lớp học',
  DELETE_CLASSROOM_TEST: 'Xóa bài kiểm tra lớp học',
  CREATE_COMMENTS: 'Thêm bình luận',
  UPDATE_COMMENTS: 'Cập nhật bình luận',
  DELETE_COMMENTS: 'Xóa bình luận',
  INVITE_CLASSROOM_MEMBER: 'Mời thành viên vào lớp học',
  IMPORT_CLASSROOM_MEMBERS: 'Nhập danh sách thành viên từ Excel',
  REMOVE_CLASSROOM_MEMBER: 'Xóa thành viên khỏi lớp học',
  RESEND_CLASSROOM_INVITATION: 'Gửi lại lời mời vào lớp',
  REVOKE_CLASSROOM_INVITATION: 'Thu hồi lời mời vào lớp',
  RESET_CLASSROOM_INVITE_LINK: 'Đặt lại liên kết mời lớp',
  RESET_CLASSROOM_CODE: 'Đặt lại mã lớp học',
  CREATE_CLASSROOMS: 'Tạo lớp học',
  UPDATE_CLASSROOMS: 'Cập nhật lớp học',
  DELETE_CLASSROOMS: 'Xóa lớp học',
  CREATE_INVITE: 'Mời thành viên vào lớp học',
  ARCHIVE_CLASSROOM: 'Lưu trữ lớp học',
  RESTORE_CLASSROOM: 'Khôi phục lớp học',
  DELETE_CLASSROOM_PERMANENT: 'Xóa vĩnh viễn lớp học',
  LOCK_CLASSROOM: 'Khóa lớp học',
  UNLOCK_CLASSROOM: 'Mở khóa lớp học',
  CREATE_INVITATIONS: 'Mời thành viên vào lớp học',
  SAVE_IMAGES: 'Lưu hình ảnh vào thư viện',
  UPLOAD_IMAGES: 'Tải hình ảnh lên',
  GENERATE_IMAGES: 'Tạo hình ảnh AI',
  DELETE_IMAGES: 'Xóa hình ảnh',
  CREATE_SAVE: 'Lưu hình ảnh vào thư viện',
  CREATE_UPLOAD_IMAGE: 'Tải hình ảnh lên',
  UPLOAD_UPLOAD_IMAGE: 'Tải hình ảnh lên',
  SAVE_TTS: 'Lưu âm thanh vào thư viện',
  UPLOAD_TTS: 'Tải âm thanh lên',
  CREATE_UPLOAD_AUDIO: 'Tải âm thanh lên',
  CONVERT_TTS: 'Chuyển văn bản thành giọng nói',
  CREATE_TTS: 'Lưu âm thanh vào thư viện',
  CREATE_CONVERT: 'Chuyển văn bản thành giọng nói',
  CHECK_PRONUNCIATION: 'Kiểm tra phát âm',
  CREATE_CHECK: 'Kiểm tra phát âm',
  CREATE_PRONUNCIATION: 'Kiểm tra phát âm',
  CREATE_EXERCISE: 'Tạo bài tập',
  UPDATE_EXERCISE: 'Cập nhật bài tập',
  DELETE_EXERCISE: 'Xóa bài tập',
  CREATE_EXAM: 'Tạo bài kiểm tra',
  UPDATE_EXAM: 'Cập nhật bài kiểm tra',
  DELETE_EXAM: 'Xóa bài kiểm tra',
  CREATE_TESTS: 'Tạo bài kiểm tra',
  UPDATE_TESTS: 'Cập nhật bài kiểm tra',
  DELETE_TESTS: 'Xóa bài kiểm tra',
  CREATE_LESSONS: 'Tạo bài giảng',
  UPDATE_LESSONS: 'Cập nhật bài giảng',
  DELETE_LESSONS: 'Xóa bài giảng',
  CREATE_DRAFTS: 'Tạo bài giảng',
  UPDATE_DRAFTS: 'Cập nhật bài giảng',
  DELETE_DRAFTS: 'Xóa bài giảng',
  CREATE_BILINGUAL_LESSON: 'Tạo bài giảng song ngữ',
  TRANSLATE_TRANSLATE: 'Tạo bài giảng song ngữ',
  CREATE_TRANSLATE: 'Tạo bài giảng song ngữ',
  TRANSLATE_LESSONS: 'Tạo bài giảng song ngữ',
  TOGGLE_USER_STATUS: 'Khóa/mở khóa tài khoản',
  UPDATE_TOGGLE_STATUS: 'Khóa/mở khóa tài khoản',
  USER_LOCK: 'Khóa tài khoản',
  TOGGLE_QUESTION_SHARING: 'Chia sẻ/bỏ chia sẻ câu hỏi',
  UPDATE_TOGGLE_SHARING: 'Chia sẻ/bỏ chia sẻ câu hỏi',
  UPDATE_PROFILE: 'Cập nhật hồ sơ cá nhân',
  UPDATE_PERSONAL: 'Cập nhật hồ sơ cá nhân',
  UPDATE_SCHOOL_INFO: 'Cập nhật thông tin trường',
  UPDATE_SCHOOL: 'Cập nhật thông tin trường',
  UPDATE_CLASSES_INFO: 'Cập nhật lớp phụ trách',
  UPDATE_CLASSES: 'Cập nhật lớp phụ trách',
  UPDATE_AVATAR: 'Cập nhật ảnh đại diện',
};

const moduleOf = (raw) => {
  if (!raw) return 'mục';
  const key = String(raw).toUpperCase().replace(/-/g, '_');
  return MODULE_LABELS[key] || key.toLowerCase().replace(/_/g, ' ');
};

/** Lấy classroomName từ description JSON (nếu có). */
export function getClassroomNameFromDescription(description) {
  if (!description) return '';
  try {
    const parsed = typeof description === 'string' ? JSON.parse(description) : description;
    return parsed?.classroomName ? String(parsed.classroomName) : '';
  } catch {
    return '';
  }
}

/** Mã hành động → nhãn tiếng Việt có dấu; kèm tên lớp nếu có. */
export function getActionLabel(action, description) {
  if (!action) return 'Thao tác không xác định';
  const code = String(action).trim().toUpperCase();
  const classroomName = getClassroomNameFromDescription(description);
  let label = EXACT_LABELS[code];
  if (!label) {
    // continue below
  } else {
    return classroomName ? `${label}: ${classroomName}` : label;
  }

  if (code.startsWith('VIEW_') && code.endsWith('_LIST')) {
    label = `Xem danh sách ${moduleOf(code.slice(5, -5))}`;
  } else if (code.startsWith('VIEW_') && code.endsWith('_DETAIL')) {
    label = `Xem chi tiết ${moduleOf(code.slice(5, -7))}`;
  } else if (code.startsWith('CREATE_')) label = `Tạo ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('UPDATE_')) label = `Cập nhật ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('DELETE_')) label = `Xóa ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('EXPORT_')) label = `Xuất ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('UPLOAD_')) label = `Tải lên ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('SHARE_') && code.endsWith('_CLASS')) {
    const mod = moduleOf(code.slice(6, -6));
    label = mod.includes('bài giảng') ? 'Chia sẻ bài giảng vào lớp học' : `Chia sẻ ${mod} vào lớp học`;
  } else if (code.startsWith('SHARE_')) {
    const mod = moduleOf(code.slice(6));
    label = mod.includes('bài giảng') ? 'Chia sẻ bài giảng cho giáo viên' : `Chia sẻ ${mod}`;
  } else if (code.startsWith('JOIN_')) label = `Tham gia ${moduleOf(code.slice(5))}`;
  else if (code.startsWith('SUBMIT_')) label = `Nộp ${moduleOf(code.slice(7))}`;
  else if (code.startsWith('GENERATE_')) label = `Tạo (AI) ${moduleOf(code.slice(9))}`;
  else if (code.startsWith('SAVE_')) label = `Lưu ${moduleOf(code.slice(5))}`;
  else if (code.startsWith('TRANSLATE_')) label = `Dịch ${moduleOf(code.slice(10))}`;
  else if (code.startsWith('CONVERT_')) label = `Chuyển đổi ${moduleOf(code.slice(8))}`;
  else if (code.startsWith('CHECK_')) label = `Kiểm tra ${moduleOf(code.slice(6))}`;
  else if (code.startsWith('EXTRACT_')) label = `Trích xuất ${moduleOf(code.slice(8))}`;
  else label = code.replace(/_/g, ' ').toLowerCase();

  return classroomName ? `${label}: ${classroomName}` : label;
}

export function getModuleLabel(module) {
  if (!module) return '-';
  const key = String(module).toUpperCase().replace(/-/g, '_');
  const label = MODULE_LABELS[key];
  if (!label) return String(module);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Danh sách mô-đun cho bộ lọc (value = mã DB, label = tiếng Việt). */
export const MODULE_FILTER_OPTIONS = [
  { value: 'auth', label: 'Xác thực' },
  { value: 'users', label: 'Người dùng' },
  { value: 'profile', label: 'Hồ sơ' },
  { value: 'classrooms', label: 'Lớp học' },
  { value: 'lessons', label: 'Bài giảng' },
  { value: 'tests', label: 'Bài kiểm tra' },
  { value: 'exercises', label: 'Bài tập' },
  { value: 'questions', label: 'Câu hỏi' },
  { value: 'posts', label: 'Bài đăng' },
  { value: 'assignments', label: 'Bài tập (lớp)' },
  { value: 'images', label: 'Hình ảnh' },
  { value: 'tts', label: 'Âm thanh TTS' },
  { value: 'pronunciation', label: 'Phát âm' },
  { value: 'categories', label: 'Danh mục' },
  { value: 'subjects', label: 'Môn học' },
  { value: 'templates', label: 'Mẫu bài giảng' },
  { value: 'feedback', label: 'Phản hồi' },
  { value: 'guides', label: 'Hướng dẫn' },
  { value: 'resources', label: 'Tài nguyên' },
];

/** Danh sách hành động cho bộ lọc (value = mã DB, label = tiếng Việt). */
export const ACTION_FILTER_OPTIONS = [
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'LOGIN_FAILED', label: 'Đăng nhập thất bại' },
  { value: 'LOGOUT', label: 'Đăng xuất' },
  { value: 'CHANGE_PASSWORD', label: 'Đổi mật khẩu' },
  { value: 'UPDATE_PROFILE', label: 'Cập nhật hồ sơ cá nhân' },
  { value: 'UPDATE_AVATAR', label: 'Cập nhật ảnh đại diện' },
  { value: 'TOGGLE_USER_STATUS', label: 'Khóa/mở khóa tài khoản' },
  { value: 'CREATE_CLASSROOMS', label: 'Tạo lớp học' },
  { value: 'UPDATE_CLASSROOMS', label: 'Cập nhật lớp học' },
  { value: 'DELETE_CLASSROOMS', label: 'Xóa lớp học' },
  { value: 'INVITE_CLASSROOM_MEMBER', label: 'Mời thành viên vào lớp học' },
  { value: 'REMOVE_CLASSROOM_MEMBER', label: 'Xóa thành viên khỏi lớp học' },
  { value: 'CREATE_CLASSROOM_ANNOUNCEMENT', label: 'Tạo thông báo trên lớp học' },
  { value: 'CREATE_CLASSROOM_ASSIGNMENT', label: 'Tạo bài tập trên lớp học' },
  { value: 'CREATE_CLASSROOM_TEST', label: 'Tạo bài kiểm tra trên lớp học' },
  { value: 'CREATE_LESSONS', label: 'Tạo bài giảng' },
  { value: 'UPDATE_LESSONS', label: 'Cập nhật bài giảng' },
  { value: 'DELETE_LESSONS', label: 'Xóa bài giảng' },
  { value: 'CREATE_BILINGUAL_LESSON', label: 'Tạo bài giảng song ngữ' },
  { value: 'SHARE_LESSONS', label: 'Chia sẻ bài giảng cho giáo viên' },
  { value: 'SHARE_LESSONS_CLASS', label: 'Chia sẻ bài giảng vào lớp học' },
  { value: 'CREATE_EXERCISE', label: 'Tạo bài tập' },
  { value: 'CREATE_EXAM', label: 'Tạo bài kiểm tra' },
  { value: 'UPDATE_EXERCISE', label: 'Cập nhật bài tập' },
  { value: 'UPDATE_EXAM', label: 'Cập nhật bài kiểm tra' },
  { value: 'DELETE_EXERCISE', label: 'Xóa bài tập' },
  { value: 'DELETE_EXAM', label: 'Xóa bài kiểm tra' },
  { value: 'TOGGLE_QUESTION_SHARING', label: 'Chia sẻ/bỏ chia sẻ câu hỏi' },
  { value: 'SAVE_IMAGES', label: 'Lưu hình ảnh vào thư viện' },
  { value: 'UPLOAD_IMAGES', label: 'Tải hình ảnh lên' },
  { value: 'CONVERT_TTS', label: 'Chuyển văn bản thành giọng nói' },
  { value: 'SAVE_TTS', label: 'Lưu âm thanh vào thư viện' },
  { value: 'CHECK_PRONUNCIATION', label: 'Kiểm tra phát âm' },
];
