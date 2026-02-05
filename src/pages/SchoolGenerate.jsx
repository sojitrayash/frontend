import React, { useEffect, useRef, useState } from 'react';
import { api, clearAuthSession, getSchoolPrivateKey } from '../lib/api';

function parseCsv(text) {
  const src = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      cell = '';
      const isEmptyRow = row.every((c) => String(c || '').trim() === '');
      if (!isEmptyRow) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (!row.every((c) => String(c || '').trim() === '')) rows.push(row);
  return rows;
}

function normalizeKey(s) {
  return String(s || '').trim();
}

function mapErpRowToFields({ rowObj, rename }) {
  const out = {};
  const r = rename && typeof rename === 'object' ? rename : {};
  for (const [k, v] of Object.entries(rowObj || {})) {
    const key = normalizeKey(r[k] || k);
    if (!key) continue;
    out[key] = v == null ? '' : String(v);
  }
  return out;
}

export default function SchoolGenerate() {
  const [mode, setMode] = useState('OFF');
  const [batchTab, setBatchTab] = useState('CSV');
  const [csvFile, setCsvFile] = useState(null);
  const [batchIncludeHtml, setBatchIncludeHtml] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [formData, setFormData] = useState({
    grNo: '',
    studentName: '',
    uid: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [generated, setGenerated] = useState(false);
  const [qrValue, setQrValue] = useState(null);
  const [certificateId, setCertificateId] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [documentHash, setDocumentHash] = useState(null);
  const [status, setStatus] = useState('');

  const [templatePreviewHtml, setTemplatePreviewHtml] = useState('');
  const templateFrameRef = useRef(null);

  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateKey, setActiveTemplateKey] = useState('lc_default_v1');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('lc_default_v1');

  const [dataSource, setDataSource] = useState('MANUAL'); // MANUAL | ERP_CSV
  const [extraFields, setExtraFields] = useState({});
  const [kvKey, setKvKey] = useState('');
  const [kvValue, setKvValue] = useState('');

  const [erpCsvFile, setErpCsvFile] = useState(null);
  const [erpRows, setErpRows] = useState([]);
  const [erpHeaders, setErpHeaders] = useState([]);
  const [erpSelectedIndex, setErpSelectedIndex] = useState(-1);
  const [erpSearch, setErpSearch] = useState('');
  const [erpRename, setErpRename] = useState({});

  const loadMode = async () => {
    try {
      const res = await api.get('/api/tenant/settings');
      const m = String(res.data?.computerised_mode || 'OFF').toUpperCase() === 'ON' ? 'ON' : 'OFF';
      setMode(m);

      const rename = res.data?.erp_config?.rename;
      setErpRename(rename && typeof rename === 'object' ? rename : {});
    } catch {
      setMode('OFF');
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await api.get('/api/templates');
      const base = Array.isArray(res.data?.templates) ? res.data.templates : [];
      const tenant = Array.isArray(res.data?.tenantTemplates) ? res.data.tenantTemplates : [];
      const merged = new Map();
      for (const t of base) merged.set(t.key, { ...t, source: 'BASE' });
      for (const t of tenant) merged.set(t.key, { ...t, source: 'TENANT' });
      const list = Array.from(merged.values()).sort((a, b) => String(a.key).localeCompare(String(b.key)));
      setTemplates(list);
      const active = res.data?.activeTemplateKey || 'lc_default_v1';
      setActiveTemplateKey(active);
      setSelectedTemplateKey((prev) => prev || active);
      if (!selectedTemplateKey) setSelectedTemplateKey(active);
    } catch {
      // ignore
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadMode();
    loadTemplates();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addField = () => {
    const k = normalizeKey(kvKey);
    if (!k) return;
    setExtraFields((prev) => ({ ...prev, [k]: String(kvValue || '') }));
    setKvKey('');
    setKvValue('');
  };

  const removeField = (k) => {
    setExtraFields((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const setActiveTemplate = async () => {
    if (!selectedTemplateKey) return;
    setStatus('Setting active template...');
    try {
      const res = await api.put('/api/tenant/template', { activeTemplateKey: selectedTemplateKey });
      const active = res.data?.activeTemplateKey || selectedTemplateKey;
      setActiveTemplateKey(active);
      setStatus('Active template updated');
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    if (!erpCsvFile) {
      setErpRows([]);
      setErpHeaders([]);
      setErpSelectedIndex(-1);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const text = await erpCsvFile.text();
        const rows = parseCsv(text);
        if (!rows.length) return;
        const headers = rows[0].map((h) => String(h || '').trim());
        const out = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const obj = {};
          for (let c = 0; c < headers.length; c++) {
            obj[headers[c]] = r[c] == null ? '' : String(r[c]);
          }
          out.push(obj);
        }
        if (!cancelled) {
          setErpHeaders(headers);
          setErpRows(out);
          setErpSelectedIndex(out.length ? 0 : -1);
        }
      } catch {
        if (!cancelled) {
          setErpHeaders([]);
          setErpRows([]);
          setErpSelectedIndex(-1);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [erpCsvFile]);

  const applyErpSelection = () => {
    if (erpSelectedIndex < 0 || erpSelectedIndex >= erpRows.length) return;
    const row = erpRows[erpSelectedIndex];
    const mapped = mapErpRowToFields({ rowObj: row, rename: erpRename });

    const gr = mapped.grNo || mapped['grNo'] || mapped['GR No'] || mapped['G.R. No.'] || mapped['GRNO'] || mapped['GrNo'] || '';
    const name = mapped.studentName || mapped['studentName'] || mapped['Student Name'] || mapped['STUDENTNAME'] || '';
    const uid = mapped.uid || mapped['UID'] || mapped['Uid'] || '';
    const date = mapped.date || mapped['Date'] || formData.date;

    setFormData((prev) => ({
      ...prev,
      grNo: String(gr || prev.grNo || ''),
      studentName: String(name || prev.studentName || ''),
      uid: String(uid || prev.uid || ''),
      date: String(date || prev.date || ''),
    }));

    const ignore = new Set(['grNo', 'studentName', 'uid', 'date']);
    const extras = {};
    for (const [k, v] of Object.entries(mapped)) {
      if (ignore.has(k)) continue;
      if (v == null) continue;
      const vv = String(v);
      if (!vv.trim()) continue;
      extras[k] = vv;
    }
    setExtraFields(extras);
    setStatus('ERP row applied to form');
  };

  const handleGenerate = async () => {
    setStatus('Generating...');
    try {
      const headers = {};
      if (mode === 'ON') {
        const pk = getSchoolPrivateKey();
        if (!pk) {
          setStatus('Missing school private key. Go to Settings and set it (or do First Login again).');
          return;
        }
        headers['x-school-private-key'] = pk;
      }

      if (mode === 'ON' && selectedTemplateKey && selectedTemplateKey !== activeTemplateKey) {
        await api.put('/api/tenant/template', { activeTemplateKey: selectedTemplateKey });
        setActiveTemplateKey(selectedTemplateKey);
      }

      const res = await api.post(
        '/api/certificates/generate',
        {
          grNo: formData.grNo,
          studentName: formData.studentName,
          fields: {
            uid: formData.uid,
            date: formData.date,
            ...extraFields,
          },
        },
        { headers }
      );
      setCertificateId(res.data.certificateId);
      setQrValue(res.data.qrValue); // QR stores verification link (includes LC ID)
      setTxHash(res.data.txHash || null);
      setDocumentHash(res.data.documentHash || null);
      setGenerated(true);
      setStatus('Generated');

      try {
        const htmlRes = await api.get(`/api/certificates/${encodeURIComponent(res.data.certificateId)}/html`, {
          responseType: 'text',
        });
        setTemplatePreviewHtml(String(htmlRes.data || ''));
      } catch {
        setTemplatePreviewHtml('');
      }
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const handlePrint = () => {
    if (templateFrameRef.current?.contentWindow && templatePreviewHtml) {
      templateFrameRef.current.contentWindow.focus();
      templateFrameRef.current.contentWindow.print();
      return;
    }
    window.print();
  };

  const downloadPdf = async () => {
    if (!certificateId) return;
    setStatus('Preparing PDF...');
    try {
      const res = await api.get(`/api/certificates/${encodeURIComponent(certificateId)}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LC_${formData.grNo || certificateId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('PDF downloaded');
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const refreshTemplatePreview = async () => {
    if (!certificateId) return;
    setStatus('Refreshing template preview...');
    try {
      const htmlRes = await api.get(`/api/certificates/${encodeURIComponent(certificateId)}/html`, {
        responseType: 'text',
      });
      setTemplatePreviewHtml(String(htmlRes.data || ''));
      setStatus('Template preview refreshed');
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const downloadSampleCsv = () => {
    const sample = [
      'grNo,studentName,uid,date',
      '1001,Ravi Kumar,123456789012,2026-02-04',
      '1002,Neha Patel,234567890123,2026-02-04',
      '1002,Neha Patel,234567890123,2026-02-04  # duplicate GR (will be skipped)',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lc_batch_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchGenerate = async () => {
    setBatchStatus('Batch generating...');
    try {
      if (batchTab === 'ERP') {
        setBatchStatus('ERP import is not implemented yet (needs your ERP sample format).');
        return;
      }

      if (!csvFile) {
        setBatchStatus('Please choose a CSV file.');
        return;
      }

      const headers = {};
      if (mode === 'ON') {
        const pk = getSchoolPrivateKey();
        if (!pk) {
          setBatchStatus('Missing school private key. Go to Settings and set it first.');
          return;
        }
        headers['x-school-private-key'] = pk;
      }

      const fd = new FormData();
      fd.append('csvFile', csvFile);
      if (batchIncludeHtml) fd.append('includeHtml', '1');

      const res = await api.post('/api/certificates/batch-generate', fd, {
        headers,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lc_batch_${mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setBatchStatus('Batch ZIP downloaded. Open report.json inside the zip to see duplicates/errors.');
    } catch (e) {
      setBatchStatus(e.response?.data?.error || e.message);
    }
  };

  const logout = () => {
    clearAuthSession();
    window.location.href = '/';
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Generate Leaving Certificate</h2>
              <p className="mt-1 text-sm text-slate-600">
                {mode === 'OFF'
                  ? 'OFF mode: Generate blank LC → handwriting → Register upload (OCR+anchor)'
                  : 'ON mode: Generate computerised LC → hash+anchor immediately (Register upload disabled)'}
              </p>
            </div>
            <button onClick={logout} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">
              Logout
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-slate-900">Computerised Mode</div>
                <span className={mode === 'ON' ? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700' : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700'}>
                  {mode}
                </span>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-600">Template</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={selectedTemplateKey}
                    onChange={(e) => setSelectedTemplateKey(e.target.value)}
                    disabled={templatesLoading}
                  >
                    {templates.length ? (
                      templates.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.key} {t.source === 'TENANT' ? '(tenant)' : '(base)'}
                        </option>
                      ))
                    ) : (
                      <option value="lc_default_v1">lc_default_v1</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={setActiveTemplate}
                    disabled={!selectedTemplateKey || templatesLoading}
                  >
                    Set Active
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">Active: <b>{activeTemplateKey}</b></div>
              </div>

              {mode === 'ON' ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  ON mode: Enter data manually or load from ERP CSV, then Generate. The system anchors the hash on-chain and embeds VD.
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  OFF mode: This generates a printable LC (QR + ID). After handwriting/signing, anchor it from Register.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-extrabold text-slate-900">Data Source</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={dataSource === 'MANUAL' ? 'rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800' : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'}
                  onClick={() => setDataSource('MANUAL')}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  className={dataSource === 'ERP_CSV' ? 'rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800' : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'}
                  onClick={() => setDataSource('ERP_CSV')}
                  disabled={mode !== 'ON'}
                >
                  ERP CSV (ON mode)
                </button>
              </div>

              {dataSource === 'ERP_CSV' ? (
                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-600">Upload ERP CSV</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setErpCsvFile(e.target.files?.[0] || null)}
                    disabled={mode !== 'ON'}
                  />

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-600">Search (GR / Name)</label>
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={erpSearch}
                        onChange={(e) => setErpSearch(e.target.value)}
                        placeholder="Type GR No or name"
                        disabled={mode !== 'ON' || !erpRows.length}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600">Select Row</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={erpSelectedIndex}
                        onChange={(e) => setErpSelectedIndex(Number(e.target.value))}
                        disabled={mode !== 'ON' || !erpRows.length}
                      >
                        {erpRows
                          .map((r, idx) => ({ r, idx }))
                          .filter(({ r }) => {
                            const q = String(erpSearch || '').trim().toLowerCase();
                            if (!q) return true;
                            const joined = Object.values(r).join(' ').toLowerCase();
                            return joined.includes(q);
                          })
                          .slice(0, 200)
                          .map(({ r, idx }) => (
                            <option key={idx} value={idx}>
                              #{idx + 1} {r.grNo || r['GR No'] || r['G.R. No.'] || ''} {r.studentName || r['Student Name'] || ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={applyErpSelection}
                      disabled={mode !== 'ON' || erpSelectedIndex < 0}
                    >
                      Apply ERP Row
                    </button>
                    <div className="text-xs text-slate-500 self-center">Rows: <b>{erpRows.length}</b> • Columns: <b>{erpHeaders.length}</b></div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-xs text-slate-500">
                  Manual entry supports dynamic fields too (you can add key/value pairs).
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-600">G.R. No.</label>
                <input name="grNo" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onChange={handleChange} value={formData.grNo} placeholder="G.R. No." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Student Full Name</label>
                <input name="studentName" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onChange={handleChange} value={formData.studentName} placeholder="Full Name" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">UID (optional)</label>
                <input name="uid" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onChange={handleChange} value={formData.uid} placeholder="UID" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Date</label>
                <input name="date" type="date" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onChange={handleChange} value={formData.date} />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-extrabold text-slate-900">Extra Fields (dynamic)</div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Field key (e.g. Father Name)"
                  value={kvKey}
                  onChange={(e) => setKvKey(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Value"
                  value={kvValue}
                  onChange={(e) => setKvValue(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={addField}
                >
                  Add Field
                </button>
              </div>

              {Object.keys(extraFields).length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-3">Key</th>
                        <th className="py-2 pr-3">Value</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(extraFields).map(([k, v]) => (
                        <tr key={k} className="border-t border-slate-100">
                          <td className="py-2 pr-3 font-semibold text-slate-900">{k}</td>
                          <td className="py-2 pr-3 text-slate-700">{String(v)}</td>
                          <td className="py-2">
                            <button type="button" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => removeField(k)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">No extra fields yet.</div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handleGenerate} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100" type="button">
                Generate
              </button>
              {generated ? (
                <>
                  <button onClick={downloadPdf} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">Download PDF</button>
                  <button onClick={handlePrint} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">Print</button>
                  <button onClick={refreshTemplatePreview} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">Refresh Preview</button>
                </>
              ) : null}
            </div>

            {status ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{status}</div>
            ) : null}

            {certificateId ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div><span className="text-xs font-bold text-slate-500">Certificate ID</span><div className="font-semibold text-slate-900 break-words">{certificateId}</div></div>
                  <div><span className="text-xs font-bold text-slate-500">QR payload</span><div className="font-semibold text-slate-900 break-words">Verification link</div></div>
                  {mode === 'ON' ? (
                    <>
                      <div><span className="text-xs font-bold text-slate-500">Tx Hash</span><div className="font-semibold text-slate-900 break-words">{txHash || '—'}</div></div>
                      <div><span className="text-xs font-bold text-slate-500">Document Hash</span><div className="font-semibold text-slate-900 break-words">{documentHash || '—'}</div></div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {generated ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <div className="p-5">
            <h3 className="text-base font-extrabold text-slate-900">Template Preview</h3>
            <p className="mt-1 text-sm text-slate-600">Rendered by backend template HTML (same as PDF).</p>

            <div className="mt-4">
              {templatePreviewHtml ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <iframe
                    ref={templateFrameRef}
                    title="lc-template-preview"
                    style={{ width: '100%', height: 820, border: 0 }}
                    srcDoc={templatePreviewHtml}
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Could not load template preview. You can still download PDF.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Batch Generate</h3>
              <p className="mt-1 text-sm text-slate-600">Generate multiple LCs from CSV. In ON mode it anchors during generation.</p>
            </div>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={downloadSampleCsv}>Download Sample CSV</button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={batchTab === 'CSV' ? 'rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-extrabold text-sky-800' : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'}
              type="button"
              onClick={() => setBatchTab('CSV')}
            >
              CSV Upload
            </button>
            <button
              className={batchTab === 'ERP' ? 'rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-extrabold text-sky-800' : 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'}
              type="button"
              onClick={() => setBatchTab('ERP')}
            >
              ERP Import
            </button>
          </div>

          {batchTab === 'CSV' ? (
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-600">CSV File</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <div className="mt-2 text-xs text-slate-500">
                Required: grNo, studentName. Optional: uid, date. Extra columns become dynamic fields.
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={batchIncludeHtml}
                  onChange={(e) => setBatchIncludeHtml(e.target.checked)}
                />
                Include rendered HTML in ZIP (debug templates)
              </label>

              <div className="mt-3">
                <button onClick={handleBatchGenerate} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-800 hover:bg-sky-100" type="button">
                  Generate ZIP
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Use the ERP Import page for bulk generation from ERP-exported CSV.
            </div>
          )}

          {batchStatus ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{batchStatus}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
