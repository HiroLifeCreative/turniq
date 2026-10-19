/** Exportar reportes: PDF (expo-print) y CSV (expo-sharing). */
import { Platform } from 'react-native';
import { fmtMoney, fmtHours, calcWeekTotals, type JobLike, type ShiftLike } from '../lib/calc';
import { parseYmd } from '../lib/dates';
import type { Job, Shift } from '../store';

export interface ReportRow {
  job: Job;
  hours: number;
  gross: number;
  net: number;
}

export function buildReport(
  shifts: Shift[],
  jobs: Job[],
  settings: { umbralExtraHrs: number; multExtra: number },
): { totals: ReturnType<typeof calcWeekTotals>; rows: ReportRow[] } {
  const jobsById: Record<string, JobLike> = Object.fromEntries(jobs.map((j) => [j.id, j]));
  const totals = calcWeekTotals(shifts, jobsById, settings.umbralExtraHrs, settings.multExtra);
  const byJob = new Map<string, ShiftLike[]>();
  for (const s of shifts) {
    const arr = byJob.get(s.jobId) ?? [];
    arr.push(s);
    byJob.set(s.jobId, arr);
  }
  const rows: ReportRow[] = [];
  for (const [jobId, arr] of byJob) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) continue;
    const t = calcWeekTotals(arr, jobsById, 1e9, 1); // sin extra en el desglose por trabajo
    rows.push({ job, hours: t.hours, gross: t.gross, net: t.net });
  }
  return { totals, rows };
}

export function reportToCsv(title: string, rows: ReportRow[], totals: { hours: number; gross: number; net: number }): string {
  const lines = [`Turniq — ${title}`, 'Trabajo,Horas,Bruto,Neto'];
  for (const r of rows) lines.push(`"${r.job.nombre}",${r.hours.toFixed(2)},${r.gross.toFixed(2)},${r.net.toFixed(2)}`);
  lines.push(`"TOTAL",${totals.hours.toFixed(2)},${totals.gross.toFixed(2)},${totals.net.toFixed(2)}`);
  return lines.join('\n');
}

export async function shareCsv(csv: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const FileSystem = require('expo-file-system') as typeof import('expo-file-system');
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  const path = `${FileSystem.cacheDirectory ?? ''}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv);
  await Sharing.shareAsync(path, { mimeType: 'text/csv' });
}

export async function sharePdf(
  title: string,
  rows: ReportRow[],
  totals: { hours: number; gross: number; net: number },
  shifts: Shift[],
  jobsById: Record<string, Job>,
): Promise<void> {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td>${r.job.nombre}</td><td>${r.hours.toFixed(2)}</td><td>${fmtMoney(r.gross)}</td><td>${fmtMoney(r.net)}</td></tr>`,
    )
    .join('');
  const shiftsHtml = shifts
    .map((s) => {
      const j = jobsById[s.jobId];
      return `<tr><td>${s.fecha}</td><td>${j?.nombre ?? ''}</td><td>${s.horaEntrada}–${s.horaSalida ?? '…'}</td><td>${fmtMoney(s.propinas + s.bono)}</td></tr>`;
    })
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:sans-serif;color:#0c0e13;padding:32px}
    h1{font-size:26px;letter-spacing:-0.5px}h2{font-size:18px;margin-top:28px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;font-size:14px}
    th{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#646b7a}
    .tot{font-weight:800}.brand{color:#0064E0}
    </style></head><body>
    <h1 class="brand">Turniq</h1><h1>${title}</h1>
    <p>Horas: <b>${fmtHours(totals.hours)}</b> · Bruto: <b>${fmtMoney(totals.gross)}</b> · Neto: <b>${fmtMoney(totals.net)}</b></p>
    <h2>Por trabajo</h2>
    <table><tr><th>Trabajo</th><th>Horas</th><th>Bruto</th><th>Neto</th></tr>${rowsHtml}
    <tr class="tot"><td>Total</td><td>${totals.hours.toFixed(2)}</td><td>${fmtMoney(totals.gross)}</td><td>${fmtMoney(totals.net)}</td></tr></table>
    <h2>Turnos</h2>
    <table><tr><th>Fecha</th><th>Trabajo</th><th>Horario</th><th>Extras</th></tr>${shiftsHtml}</table>
    </body></html>`;
  void parseYmd;
  if (Platform.OS === 'web') {
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
    w?.print();
    return;
  }
  const Print = require('expo-print') as typeof import('expo-print');
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}
