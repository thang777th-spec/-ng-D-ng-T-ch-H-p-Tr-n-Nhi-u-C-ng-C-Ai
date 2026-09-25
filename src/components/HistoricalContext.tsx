import React, { useState } from 'react';
import { BookOpen, ShieldAlert, ChevronDown, ChevronUp, Radio } from 'lucide-react';

export const HistoricalContext: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-black/40 p-4 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left text-amber-300 hover:text-amber-200 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="font-cinzel text-sm font-bold tracking-wide uppercase">
            Bối cảnh lịch sử: Bi kịch tình báo "Englandspiel" (1942 - 1944)
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-400/80 font-mono-code">
          <span>{isExpanded ? 'Thu gọn' : 'Tìm hiểu'}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2.5 border-t border-amber-900/30 pt-3 text-xs text-slate-300 leading-relaxed font-sans">
          <p>
            Đoạn văn này khắc họa một trong những hồi bi kịch đen tối và căng thẳng nhất của Thế chiến II:
            <strong className="text-amber-300"> Chiến dịch Englandspiel (Chiến dịch Bắc Cực)</strong>.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 pt-1 font-mono-code text-[11px]">
            <div className="rounded-lg bg-black/40 border border-slate-800 p-2.5">
              <span className="text-amber-400 block font-bold mb-1">📍 Tại Hà Lan bị chiếm đóng:</span>
              Cơ quan phản gián Đức (Abwehr do Hermann Giskes chỉ huy) bắt được các đặc vụ điện đài của cơ quan SOE Anh.
              Quân Đức không phá hủy máy phát, mà ép hoặc giả mạo tín hiệu để tiếp tục gửi điện về London, dàn dựng bẫy đón hơn 50 điệp viên và hàng tấn vũ khí nhảy dù rơi thẳng vào tay địch.
            </div>
            <div className="rounded-lg bg-black/40 border border-slate-800 p-2.5">
              <span className="text-amber-400 block font-bold mb-1">📍 Tại Bộ chỉ huy London:</span>
              Các bức điện mật vẫn tấp nập gửi về. Dù một số mật mã thiếu dấu hiệu kiểm tra an ninh (security check), các chỉ huy vẫn tin rằng đường dây còn trong sạch.
              Mỗi bức điện phát ra là thêm một sinh mạng lâm nguy.
            </div>
          </div>
          <p className="italic text-amber-400/90 pt-1">
            "Đến thời điểm nào, thông tin nhận được đã đủ để ngừng chiến dịch?" — Câu hỏi nhức nhối vang lên trong không gian điện đài ngột ngạt, nơi sự thật và cạm bẫy chỉ cách nhau một làn sóng vô tuyến.
          </p>
        </div>
      )}
    </div>
  );
};
