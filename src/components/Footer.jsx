import { BookOpen, Mail, Phone, MapPin, Globe, Play, Share } from 'lucide-react';
import { FOOTER_LINKS } from '../data/homePageData';


export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12">

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TeachPrimary</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Hệ thống hỗ trợ giáo viên tiểu học soạn bài giảng và kiểm tra trực tuyến song ngữ tích hợp AI.
            </p>

            <div className="space-y-3">
              {[
                { icon: <Mail className="w-4 h-4" />, text: 'support@teachai.edu.vn' },
                { icon: <Phone className="w-4 h-4" />, text: '1800-TEACH-AI' },
                { icon: <MapPin className="w-4 h-4" />, text: 'Hồ Chí Minh, Việt Nam' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                  <span className="text-violet-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              {[
                { icon: <Globe className="w-4 h-4" />, label: 'Facebook' },
                { icon: <Play className="w-4 h-4" />, label: 'YouTube' },
                { icon: <Share className="w-4 h-4" />, label: 'Twitter' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-violet-600 hover:text-white transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>


          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold mb-4 text-sm">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-400 hover:text-white hover:underline underline-offset-2 transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © 2025 TeachPrimary — Hệ thống hỗ trợ giáo viên tiểu học. 🇻🇳
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Được xây dựng với</span>
            <span className="text-red-400 text-sm">❤</span>
            <span className="text-xs text-gray-500">bởi sinh viên Nông Lâm</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
