import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { downloadCSVReport, printMonthlyReport } from '../utils/exportUtils';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  Smartphone,
  Laptop,
  Check,
  Copy,
  QrCode,
  HelpCircle,
  X,
  FileJson,
} from 'lucide-react';
import { isClaudeArtifact, notify, saveFile } from '../utils/platform';

interface DataSyncModalProps {
  onClose: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ onClose }) => {
  const { state, exportData, importData } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'cross_device' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Generate share URL (contains full app link + QR code)
  const currentAppUrl = window.location.href;

  const handleExportJSON = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    saveFile(`portMrker-backup-${dateStr}.json`, exportData(), 'application/json');
  };

  const handleExportCSV = () => {
    downloadCSVReport(state);
  };

  const handlePrintPDF = () => {
    printMonthlyReport(state.selectedMonth, state);
  };

  const handleCopyJSON = () => {
    const jsonStr = exportData();
    navigator.clipboard
      .writeText(jsonStr)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => notify('Copy failed — use "Download JSON" instead'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processImport(content);
      }
    };
    reader.readAsText(file);
  };

  const processImport = (content: string) => {
    setImportError('');
    setImportSuccess(false);
    const success = importData(content);
    if (success) {
      setImportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setImportError(
        state.language === 'lo'
          ? 'ຮູບແບບໄຟລ໌ ຫຼື ຂໍ້ມູນບໍ່ຖືກຕ້ອງ! ກະລຸນາກວດສອບໄຟລ໌ JSON ຂອງ portMrker'
          : 'รูปแบบไฟล์หรือข้อมูลไม่ถูกต้อง! กรุณาตรวจสอบไฟล์ JSON ของ portMrker'
      );
    }
  };

  const handlePasteImport = () => {
    if (!importText.trim()) return;
    processImport(importText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {state.language === 'lo' ? 'ບັນທຶກຟາຍ & ໃຊ້ຮ່ວມກັນ (PC + ມືຖື)' : 'บันทึกไฟล์ & ซิงค์ข้ามอุปกรณ์ (PC + มือถือ)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                portMrker Data Export & Multi-Device Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold bg-slate-950/40">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-2 text-center transition flex items-center justify-center space-x-1.5 border-b-2 ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{state.language === 'lo' ? '1. ບັນທຶກຟາຍ' : '1. บันทึกไฟล์'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cross_device')}
            className={`py-3 px-2 text-center transition flex items-center justify-center space-x-1.5 border-b-2 ${
              activeTab === 'cross_device'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{state.language === 'lo' ? '2. ໃຊ້ຮ່ວມກັນ' : '2. ซิงค์มือถือ/PC'}</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-2 text-center transition flex items-center justify-center space-x-1.5 border-b-2 ${
              activeTab === 'import'
                ? 'border-blue-400 text-blue-300 bg-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{state.language === 'lo' ? '3. ນຳເຂົ້າຂໍ້ມູນ' : '3. นำเข้าข้อมูล'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* TAB 1: EXPORT FILES */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                {state.language === 'lo'
                  ? 'ທ່ານສາມາດດາວໂຫຼດຂໍ້ມູນງົບປະມານ, ລາຍຈ່າຍ, ແລະ ພອດການລົງທຶນທັງໝົດເປັນຟາຍຕ່າງໆ ເພື່ອເກັບໄວ້ເບິ່ງຍ້ອນຫຼັງໄດ້ຕະຫຼອດເວລາ:'
                  : 'คุณสามารถดาวน์โหลดข้อมูลงบประมาณ รายจ่าย และพอร์ตการลงทุนทั้งหมดเป็นไฟล์ต่างๆ เพื่อเก็บไว้ดูย้อนหลังได้ตลอดเวลา:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. CSV / Excel */}
                <button
                  onClick={handleExportCSV}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 transition text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-200 text-xs">Excel / CSV</strong>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {state.language === 'lo' ? 'ເບິ່ງຕາຕະລາງຍ້ອນຫຼັງ' : 'เปิดดูใน Excel/Sheets'}
                  </span>
                </button>

                {/* 2. PDF / Print */}
                <button
                  onClick={handlePrintPDF}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900 transition text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-200 text-xs">Print / PDF</strong>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {state.language === 'lo' ? 'ໃບສະຫຼຸບເດືອນນີ້' : 'ใบสรุปงบประจำเดือน'}
                  </span>
                </button>

                {/* 3. Full Backup JSON */}
                <button
                  onClick={handleExportJSON}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 transition text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-200 text-xs">Backup (JSON)</strong>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {state.language === 'lo' ? 'ກູ້ຄືນໄດ້ 100%' : 'สำหรับกู้คืนข้ามเครื่อง'}
                  </span>
                </button>

              </div>

              {/* Quick Copy Data Code */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    {state.language === 'lo' ? 'ຄັດລອກລະຫັດຂໍ້ມູນ (Copy Text Code)' : 'คัดลอกรหัสข้อมูล (Copy Text)'}
                  </span>
                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (state.language === 'lo' ? 'ຄັດລອກແລ້ວ!' : 'คัดลอกแล้ว!') : (state.language === 'lo' ? 'ຄັດລອກ' : 'คัดลอก')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {state.language === 'lo'
                    ? 'ທ່ານສາມາດກົດຄັດລອກລະຫັດນີ້ ແລ້ວສົ່ງເຂົ້າ WhatsApp/Telegram ເພື່ອໄປວາງໃສ່ໃນມືຖື ຫຼື ຄອມພິວເຕີໄດ້ທັນທີ.'
                    : 'คุณสามารถคัดลอกรหัสนี้แล้วส่งเข้า Line/Telegram เพื่อไปวางในมือถือหรือคอมพิวเตอร์ได้ทันที'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CROSS-DEVICE (PC + MOBILE) */}
          {activeTab === 'cross_device' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-800/40 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-sm">
                    <Laptop className="w-5 h-5" />
                    <span>⇄</span>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <strong className="text-slate-100 text-sm">
                    {state.language === 'lo' ? 'ວິທີໃຊ້ຮ່ວມກັນລະຫວ່າງ ຄອມ & ມືຖື' : 'วิธีใช้ร่วมกันระหว่าง คอม & มือถือ'}
                  </strong>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {state.language === 'lo'
                    ? 'ທ່ານສາມາດເປີດລິ້ງແອັບນີ້ໃນທັງ ຄອມພິວເຕີ ແລະ ໂທລະສັບມືຖື ໄດ້ພ້ອມກັນ! ເພື່ອຍ້າຍຂໍ້ມູນລະຫວ່າງ 2 ເຄື່ອງ ມີ 2 ວິທີງ່າຍໆ:'
                    : 'คุณสามารถเปิดลิงก์แอปนี้ได้ทั้งบนคอมพิวเตอร์และโทรศัพท์มือถือพร้อมกัน! การย้ายข้อมูลมี 2 วิธีง่ายๆ:'}
                </p>
              </div>

              {isClaudeArtifact && (
                <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-3.5 text-xs text-emerald-200 leading-relaxed">
                  <strong className="block text-emerald-300 mb-1">
                    ☁️ {state.language === 'lo' ? 'Sync ອັດຕະໂນມັດ' : state.language === 'th' ? 'ซิงก์อัตโนมัติ' : 'Automatic sync'}
                  </strong>
                  {state.language === 'lo'
                    ? 'ຂໍ້ມູນຖືກບັນທຶກໄວ້ໃນບັນຊີ Claude ຂອງທ່ານ. ເປີດລິ້ງໜ້າເວັບນີ້ໃນມືຖື ຫຼື ຄອມ (ເຂົ້າສູ່ລະບົບບັນຊີດຽວກັນ) ຂໍ້ມູນຈະກົງກັນເອງ ບໍ່ຕ້ອງຍ້າຍຟາຍ.'
                    : state.language === 'th'
                    ? 'ข้อมูลถูกบันทึกไว้ในบัญชี Claude ของคุณ เปิดลิงก์หน้าเว็บนี้บนมือถือหรือคอม (ล็อกอินบัญชีเดียวกัน) ข้อมูลจะตรงกันเอง ไม่ต้องย้ายไฟล์'
                    : 'Your data is saved to your Claude account. Open this page link on your phone or computer (signed in to the same account) and it stays in sync — no file transfer needed.'}
                </div>
              )}

              <div className="space-y-3">
                {/* Method 1: Export JSON File */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="font-semibold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">
                      1
                    </span>
                    <span>{state.language === 'lo' ? 'ດາວໂຫຼດຟາຍ JSON ແລ້ວສົ່ງເຂົ້າອີກເຄື່ອງ' : 'โหลดไฟล์ JSON แล้วส่งข้ามเครื่อง'}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] ml-6">
                    {state.language === 'lo'
                      ? 'ກົດ "1. ບັນທຶກຟາຍ" → ດາວໂຫຼດ Backup (JSON) → ສົ່ງຟາຍເຂົ້າ WhatsApp/Telegram → ເປີດໃນມືຖື ແລ້ວກົດ "3. ນຳເຂົ້າຂໍ້ມູນ".'
                      : 'กดแท็บ "1. บันทึกไฟล์" → โหลด Backup (JSON) → ส่งเข้า Line/Telegram → เปิดในมือถือกด "3. นำเข้าข้อมูล"'}
                  </p>
                </div>

                {/* Method 2: Copy Code */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="font-semibold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <span>{state.language === 'lo' ? 'ຄັດລອກຂໍ້ຄວາມ Code ວາງຂ້າມເຄື່ອງ' : 'คัดลอกข้อความ Code วางข้ามเครื่อง'}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] ml-6">
                    {state.language === 'lo'
                      ? 'ກົດປຸ່ມ "ຄັດລອກລະຫັດຂໍ້ມູນ" → ສົ່ງຂໍ້ຄວາມຫາໂຕເອງ → ເປີດແອັບໃນມືຖື → ກົດ "3. ນຳເຂົ້າຂໍ້ມູນ" ແລ້ວກົດ ວາງ (Paste).'
                      : 'กด "คัดลอกรหัสข้อมูล" → ส่งข้อความหาตัวเอง → เปิดแอปในมือถือ → กด "3. นำเข้าข้อมูล" แล้ววาง'}
                  </p>
                </div>

                {/* Link Info (the page's own URL is a sandbox address on claude.ai, so hide it there) */}
                {!isClaudeArtifact && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">App Web Link</span>
                    <span className="text-xs text-amber-300 font-mono truncate block">{currentAppUrl}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentAppUrl);
                      notify(state.language === 'lo' ? 'ຄັດລອກລິ້ງແອັບແລ້ວ!' : 'คัดลอกลิงก์แอปแล้ว!');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shrink-0"
                  >
                    {state.language === 'lo' ? 'ຄັດລອກລິ້ງ' : 'คัดลอกลิงก์'}
                  </button>
                </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT DATA */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                {state.language === 'lo'
                  ? 'ເລືອກໄຟລ໌ JSON ຈາກເຄື່ອງ ຫຼື ວາງລະຫັດຂໍ້ມູນທີ່ຄັດລອກມາ ເພື່ອໂຫຼດຂໍ້ມູນທັງໝົດກັບມາ:'
                  : 'เลือกไฟล์ JSON จากเครื่อง หรือวางรหัสข้อมูลที่คัดลอกมา เพื่อโหลดข้อมูลทั้งหมดกลับมา:'}
              </p>

              {/* Option A: Upload File */}
              <div className="bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer relative transition">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                <div className="font-semibold text-slate-200 text-xs">
                  {state.language === 'lo' ? 'ກົດເລືອກໄຟລ໌ JSON ຈາກເຄື່ອງ' : 'คลิกเลือกไฟล์ JSON จากเครื่อง'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {state.language === 'lo' ? 'ຮອງຮັບໄຟລ໌ portMrker-backup.json' : 'รองรับไฟล์ portMrker-backup.json'}
                </div>
              </div>

              {/* Option B: Paste Text Code */}
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block text-[11px]">
                  {state.language === 'lo' ? 'ຫຼື ວາງລະຫັດຂໍ້ຄວາມ (Paste JSON Code):' : 'หรือวางรหัสข้อความ (Paste JSON Code):'}
                </label>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": 1, "rates": {...}, "holdings": {...}}'
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!importText.trim()}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg transition"
                >
                  {state.language === 'lo' ? 'ໂຫຼດຂໍ້ມູນຈາກຂໍ້ຄວາມ' : 'โหลดข้อมูลจากข้อความ'}
                </button>
              </div>

              {/* Feedback messages */}
              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-center font-semibold animate-in fade-in">
                  ✓ {state.language === 'lo' ? 'ກູ້ຄືນ ແລະ ອັບເດດຂໍ້ມູນສຳເລັດແລ້ວ!' : 'กู้คืนและอัปเดตข้อมูลสำเร็จแล้ว!'}
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-center animate-in fade-in">
                  {importError}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
          >
            {t.cancel}
          </button>
        </div>

      </div>
    </div>
  );
};
