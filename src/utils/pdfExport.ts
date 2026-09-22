import { jsPDF } from 'jspdf';
import { Project, TimeSession, FreelancerProfile } from '../types';
import { formatCurrency } from './currency';

export interface TimesheetPDFExportOptions {
  project: Project;
  sessions: TimeSession[];
  profile?: FreelancerProfile | null;
}

/**
 * Exports Timesheet report as a high-quality PDF,
 * retaining the exact beloved layout, content, and dark theme of the original PNG export.
 */
export async function exportTimesheetPDF({
  project,
  sessions,
  profile,
}: TimesheetPDFExportOptions): Promise<void> {
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1131; // Matches standard A4 ratio (1 : 1.414)

  const totalWorkedMinutes = sessions.reduce((sum, s) => sum + s.workDurationMinutes, 0);
  const totalWorkedHours = totalWorkedMinutes / 60;

  const authorName = profile?.name || '未設定姓名';
  const authorRole = profile?.title || '未設定職業';

  const ROWS_PER_PAGE_FIRST = 18;
  const ROWS_PER_PAGE_SUBSEQUENT = 20;

  // Split sessions into pages
  const pagesData: TimeSession[][] = [];
  if (sessions.length === 0) {
    pagesData.push([]);
  } else {
    const remaining = [...sessions];
    pagesData.push(remaining.splice(0, ROWS_PER_PAGE_FIRST));
    while (remaining.length > 0) {
      pagesData.push(remaining.splice(0, ROWS_PER_PAGE_SUBSEQUENT));
    }
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const fontStack = '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", system-ui, -apple-system, sans-serif';

  for (let pIdx = 0; pIdx < pagesData.length; pIdx++) {
    const pageSessions = pagesData[pIdx];
    const isFirstPage = pIdx === 0;
    const currentPageNum = pIdx + 1;
    const totalPages = pagesData.length;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // 1. Full dark canvas background (Slate 900)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let startTableY = 240;

    if (isFirstPage) {
      // 2. Header Card (Slate 800)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 40, CANVAS_WIDTH - 80, 170);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 22px ${fontStack}`;
      ctx.fillText('FreeLife Log 詳細工時紀錄', 70, 85);

      // Author & Project Info (Exact text & emerald color from PNG)
      ctx.font = `bold 15px ${fontStack}`;
      ctx.fillStyle = '#34d399'; // Emerald 400
      ctx.fillText(`製表人：${authorName} (${authorRole})`, 70, 120);

      ctx.fillStyle = '#cbd5e1'; // Slate 300
      ctx.font = `14px ${fontStack}`;
      ctx.fillText(`專案名稱：${project.name}   |   客戶：${project.clientName || '未指定'}`, 70, 150);
      
      const projCurrency = project.currency || profile?.defaultCurrency || 'HKD';
      const contractSuffix = project.totalContractAmount
        ? `   |   合約金額：${formatCurrency(project.totalContractAmount, projCurrency)}`
        : '';
      ctx.fillText(
        `累計總淨工時：${totalWorkedHours.toFixed(1)} 小時 (${totalWorkedMinutes} 分鐘)${contractSuffix}`,
        70,
        178
      );

      startTableY = 240;
    } else {
      // Continuation Header for Subsequent Pages
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 40, CANVAS_WIDTH - 80, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 18px ${fontStack}`;
      ctx.fillText(`FreeLife Log 詳細工時紀錄 (續頁)`, 70, 75);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = `14px ${fontStack}`;
      ctx.fillText(
        `專案：${project.name}   |   頁碼：${currentPageNum} / ${totalPages}`,
        70,
        100
      );

      startTableY = 150;
    }

    // 3. Sessions Table Header
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, startTableY, CANVAS_WIDTH - 80, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 13px ${fontStack}`;
    ctx.fillText('日期', 60, startTableY + 25);
    ctx.fillText('時間區段', 160, startTableY + 25);
    ctx.fillText('工作任務內容描述', 280, startTableY + 25);
    ctx.fillText('淨工時', 690, startTableY + 25);

    // 4. Session Rows
    let y = startTableY + 45;
    ctx.font = `13px ${fontStack}`;

    if (pageSessions.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('（此專案目前尚無 Timesheet 紀錄）', 60, y + 25);
    } else {
      pageSessions.forEach((s, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#1e293b' : '#0f172a';
        ctx.fillRect(40, y - 5, CANVAS_WIDTH - 80, 36);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(s.date, 60, y + 17);

        const timeRange =
          s.startTime && s.startTime !== '--:--'
            ? `${s.startTime}-${s.endTime || '結束'}`
            : '手動工時';
        ctx.fillText(timeRange, 160, y + 17);

        const desc =
          s.taskDescription.length > 28
            ? s.taskDescription.substring(0, 28) + '...'
            : s.taskDescription || '專注工作';
        ctx.fillText(desc, 280, y + 17);

        const sH = Math.floor(s.workDurationMinutes / 60);
        const sM = s.workDurationMinutes % 60;
        const sDur = sH > 0 ? (sM > 0 ? `${sH}h ${sM}m` : `${sH}h`) : `${sM}m`;
        ctx.fillText(sDur, 690, y + 17);

        y += 38;
      });
    }

    // 5. Footer (Exact text and position from original PNG)
    ctx.fillStyle = '#64748b';
    ctx.font = `11px ${fontStack}`;
    const dateStr = new Date().toLocaleDateString();
    const footerText =
      totalPages > 1
        ? `Generated by FreeLife Log • Professional Timesheet Export • ${dateStr} • Page ${currentPageNum}/${totalPages}`
        : `Generated by FreeLife Log • Professional Timesheet Export • ${dateStr}`;
    ctx.fillText(footerText, 40, CANVAS_HEIGHT - 45);

    // 6. Convert canvas page to PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (pIdx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  // Save PDF file
  const cleanProjectName = project.name.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
  pdf.save(`${cleanProjectName}_Timesheet.pdf`);
}
