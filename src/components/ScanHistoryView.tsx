import React, { useState } from 'react';
import { History, Trash2, Calendar, FileDown, CheckCircle2, Clock, ChevronLeft, Search, Bookmark } from 'lucide-react';
import { ScanResult } from '../types/crop';
import { deleteOfflineScan, updateScanNotes, clearAllScans } from '../services/historyStorage';

interface ScanHistoryViewProps {
  scans: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onRefreshScans: () => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  scans,
  onSelectScan,
  onRefreshScans
}) => {
  const [search, setSearch] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الفحص من السجل؟')) {
      deleteOfflineScan(id);
      onRefreshScans();
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agrosan_farm_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredScans = scans.filter((s) => {
    const matchesCrop = filterCrop === 'all' || s.crop.id === filterCrop;
    const matchesQuery = 
      s.crop.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      s.diseaseOrPest.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      (s.userNotes && s.userNotes.toLowerCase().includes(search.toLowerCase()));
    return matchesCrop && matchesQuery;
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>سجل الفحوصات الحقلية المحفوظة محلياً</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            جميع الفحوصات والتشخيصات تُحفظ على ذاكرة هاتفك وتعمل 100% بدون إنترنت
          </p>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold border border-stone-700 transition"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>تصدير نسخة احتياطية</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      {scans.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في سجل الفحوصات أو الملاحظات..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Scans List */}
      {filteredScans.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-10 text-center space-y-3">
          <History className="w-12 h-12 text-stone-700 mx-auto" />
          <h3 className="text-sm font-bold text-stone-300">لا توجد فحوصات مسجلة حتى الآن</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            قم بالتقاط صورة لورقة محصولك أو تجربة إحدى العينات الجاهزة لبدء بناء سجلك الزراعي الحادث بدون نت.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredScans.map((scan) => {
            const dateStr = new Date(scan.timestamp).toLocaleDateString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isHealthy = scan.diseaseOrPest.id === 'healthy_leaf';

            return (
              <div
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="group bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 transition cursor-pointer flex items-center justify-between gap-3 shadow-md"
              >
                {/* Image and Meta */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 border border-stone-800">
                    <img
                      src={scan.imageThumbnail}
                      alt={scan.crop.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{scan.crop.icon} {scan.crop.nameAr}</span>
                      <span className="text-[10px] text-stone-500">• {dateStr}</span>
                    </div>

                    <h4 className={`text-sm font-bold mt-0.5 ${isHealthy ? 'text-emerald-400' : 'text-stone-200'}`}>
                      {scan.diseaseOrPest.nameAr}
                    </h4>

                    {scan.userNotes && (
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-1 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{scan.userNotes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold text-emerald-400 block">{scan.confidence}% تطابق</span>
                    <span className="text-[10px] text-stone-500">
                      {scan.severity === 'critical' ? 'حرج' : scan.severity === 'high' ? 'مرتفع' : 'معتدل'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, scan.id)}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition"
                    title="حذف من السجل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronLeft className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
