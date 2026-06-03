import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  vi: {
    translation: {
      "blog.title": "DevBlog Pro",
      "blog.subtitle": "Kiến trúc web, tối ưu hóa và trải nghiệm lập trình viên.",
      "nav.home": "Trang chủ",
      "nav.rss": "RSS Feed",
      "nav.search": "Tìm kiếm",
      "nav.admin": "Quản trị",
      "search.placeholder": "Tìm kiếm bài viết...",
      "post.read_time": "{{min}} phút đọc",
      "post.back": "← Quay lại",
      "post.comments": "Bình luận",
      "post.add_comment": "Thêm bình luận",
      "post.send": "Gửi",
      "admin.title": "Hệ thống Headless CMS",
      "admin.not_auth": "Vui lòng đăng nhập để truy cập",
      "login.title": "Xác thực đa yếu tố (MFA)",
      "login.step1": "Đăng nhập",
      "login.step2": "Nhập mã MFA (6 chữ số)",
      "login.button": "Xác nhận",
      "theme.light": "Sáng",
      "theme.dark": "Tối",
      "theme.system": "Hệ thống"
    }
  },
  en: {
    translation: {
      "blog.title": "DevBlog Pro",
      "blog.subtitle": "Web architecture, optimization, and developer experience.",
      "nav.home": "Home",
      "nav.rss": "RSS Feed",
      "nav.search": "Search",
      "nav.admin": "Admin",
      "search.placeholder": "Search articles...",
      "post.read_time": "{{min}} min read",
      "post.back": "← Go back",
      "post.comments": "Comments",
      "post.add_comment": "Add a comment",
      "post.send": "Send",
      "admin.title": "Headless CMS System",
      "admin.not_auth": "Please login to access",
      "login.title": "Multi-Factor Authentication",
      "login.step1": "Login",
      "login.step2": "Enter MFA code (6 digits)",
      "login.button": "Verify",
      "theme.light": "Light",
      "theme.dark": "Dark",
      "theme.system": "System"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "vi", // default to vietnamese per user input
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
