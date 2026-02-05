import React from 'react';
import QRCodeLib from 'react-qr-code';

const QRCode = QRCodeLib.default || QRCodeLib;

export default function LcTemplate({
  grNo,
  studentName,
  uid,
  date,
  qrValue,
}) {
  return (
    <div className="lc-preview-wrapper">
      <div className="lc-container">
        <div className="lc-border">
          <div className="lc-inner-border">
            <div className="header-grid">
              <div className="logo-area">
                <div className="logo-circle">LOGO</div>
              </div>
              <div className="header-text-area">
                <div className="trust-top">
                  Managed By Shree Trimurti Educational &amp; Charitable Trust - Junagadh
                </div>
                <div className="school-name-text">NOBLE PRIMARY SCHOOL - JUNAGADH</div>
                <div className="school-address">
                  Noble Nagar, B/H Bus Stand, Junagadh - 362002 (Guj) 98043 25000
                </div>
                <div className="reg-box">Registration No. APL/2288/32775/2188/Ch Date : 30-03-89</div>
              </div>
            </div>

            <div className="cert-title-row">
              <div className="cert-title-box">
                <span className="ct-en">School Leaving Certificate</span>
                <span className="ct-gu">શાળા છોડ્યાનું પ્રમાણપત્ર</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 10px 5px 10px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              <span>Sr. No. ____________</span>
              <span>G.R.No./ જ.આર.નં. : {grNo || '____________'}</span>
            </div>

            <div className="lc-data-grid">
              <div className="d-row">
                <div className="d-num">1.</div>
                <div className="d-content">
                  <div className="d-label-en">Full Name of the Student (Surname first)</div>
                  <div className="d-label-gu">વિદ્યાર્થીનું પૂરું નામ (અટક પ્રથમ)</div>
                  <div style={{ marginTop: '6px', fontWeight: 700 }}>{studentName || ''}</div>
                </div>
              </div>
              <div className="d-row">
                <div className="d-num">2.</div>
                <div className="d-content">
                  <div className="d-label-en">Religion &amp; Caste</div>
                  <div className="d-label-gu">ધર્મ અને જાતિ</div>
                </div>
              </div>
              <div className="d-row">
                <div className="d-num">3.</div>
                <div className="d-content">
                  <div className="d-label-en">Mother's Name</div>
                  <div className="d-label-gu">માતાનું નામ</div>
                </div>
              </div>
              <div className="d-row">
                <div className="d-num">4.</div>
                <div className="d-content">
                  <div className="d-label-en">Place of Birth (With Taluka/District)</div>
                  <div className="d-label-gu">જન્મ સ્થળ (તાલુકા, જીલ્લા સહિત)</div>
                </div>
              </div>
              <div className="d-row">
                <div className="d-num">5.</div>
                <div className="d-content">
                  <div className="d-label-en">Date of Birth (in figures and words)</div>
                  <div className="d-sub">as per Christian Calendar</div>
                  <div className="d-label-gu">જન્મ તારીખ (આંકડામાં અને શબ્દમાં)</div>
                </div>
              </div>
              <div className="d-row">
                <div className="d-num">6.</div>
                <div className="d-content">
                  <div className="d-label-en">Last School Attended</div>
                  <div className="d-label-gu">ક્યાં ભણ્યા હતા તે છેલ્લી શાળા</div>
                </div>
              </div>

              <div className="d-row">
                <div className="d-half">
                  <div className="d-num" style={{ borderRight: 'none' }}>7.</div>
                  <div className="d-content" style={{ borderLeft: '1px solid #1a237e' }}>
                    <div className="d-label-en">Date of admission</div>
                    <div className="d-label-gu">પ્રવેશ તારીખ (ધોરણ સહિત)</div>
                  </div>
                </div>
                <div className="d-half d-no-border">
                  <div className="d-num" style={{ borderRight: 'none' }}>8.</div>
                  <div className="d-content" style={{ borderLeft: '1px solid #1a237e' }}>
                    <div className="d-label-en">Date of Leaving School</div>
                    <div className="d-label-gu">શાળા છોડ્યા તારીખ</div>
                  </div>
                </div>
              </div>

              <div className="d-row">
                <div className="d-num">9.</div>
                <div className="d-content">
                  <div className="d-label-en">In which Standard he/she Studying &amp; Since When?</div>
                  <div className="d-label-gu">કયા ધોરણમાં અભ્યાસ કરે છે અને ક્યારથી?</div>
                </div>
              </div>

              <div className="d-row">
                <div className="d-num">10.</div>
                <div className="d-content">
                  <div className="d-label-en">Reason for leaving school</div>
                  <div className="d-label-gu">શાળા છોડવાનું કારણ</div>
                </div>
              </div>

              <div className="d-row" style={{ borderBottom: 'none' }}>
                <div className="d-1-3">
                  <div className="d-content">
                    <span className="d-label-en" style={{ textAlign: 'center' }}>11. Progress / પ્રગતિ</span>
                  </div>
                </div>
                <div className="d-1-3">
                  <div className="d-content">
                    <span className="d-label-en" style={{ textAlign: 'center' }}>12. Conduct / વર્તણૂક</span>
                  </div>
                </div>
                <div className="d-1-3 d-no-border">
                  <div className="d-content">
                    <span className="d-label-en" style={{ textAlign: 'center' }}>13. Remarks / વિશેષ નોંધ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lc-data-grid" style={{ flex: 'none', borderTop: 'none' }}>
              <div className="date-uid-row">
                <div className="du-item" style={{ maxWidth: '150px' }}>Date : {date || ''}</div>
                <div className="du-item" style={{ borderRight: 'none' }}>UID No. {uid || '____________________'}</div>
              </div>
            </div>

            <div className="certify-text">
              I Certify that the above information is verified by me with School General Register and found to be correct.
              <br />
              આથી પ્રમાણિત કરવામાં આવે છે કે ઉપરની માહિતીની ચકાસણી શાળાના જનરલ રજીસ્ટર સાથે કરવામાં આવેલ છે. જે ખરી માલુમ પડી છે.
            </div>

            <div className="foot-row">
              <div className="sig-block">
                <div className="sig-line"></div>
                <div style={{ fontWeight: 'bold' }}>Clerk<br />કલાર્ક</div>
              </div>
              <div className="sig-block">
                <div style={{ fontWeight: 'bold' }}>PRINCIPAL</div>
                <div style={{ fontWeight: 'bold', color: '#1a237e' }}>NOBLE PRIMARY SCHOOL</div>
                <div style={{ fontWeight: 'bold' }}>JUNAGADH</div>
              </div>
            </div>

            {qrValue && (
              <div className="qr-float">
                <QRCode value={qrValue} size={110} />
                <div style={{ fontSize: '8px', marginTop: '2px', fontWeight: 'bold' }}>Scan to Verify</div>
              </div>
            )}

            <div className="warn-row">
              <strong>Statutory Warning:</strong> No one can issue this certificate or make any Changes in any entry except the headmaster of the school entries or the authorized person appointed for such work in the absence or unavailability of the principal.
              <br />
              શાળાના આચાર્ય અથવા તેમની ગેરહાજરીમાં સહી કરવા માટે અધિકૃત કરેલ વ્યક્તિ સિવાય અન્ય કોઈ વ્યક્તિ આ પ્રમાણપત્ર આપી શકશે નહિ કે તેની કોઈ નોંધમાં ફેરફાર કરી શકશે નહિ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
