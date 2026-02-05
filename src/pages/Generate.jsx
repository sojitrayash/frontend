import React, { useState } from 'react';
import QRCodeLib from 'react-qr-code';
import './Generate.css';

const QRCode = QRCodeLib.default || QRCodeLib;

const Generate = () => {
    const [formData, setFormData] = useState({
        grNo: '',
        studentName: '',
        uid: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [generated, setGenerated] = useState(false);
    const [qrValue, setQrValue] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/generate-lc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentData: formData })
            });
            const data = await response.json();
            setQrValue(JSON.stringify(data.qrPayload));
            setGenerated(true);
        } catch (err) {
            console.error("Error generating", err);
            setQrValue(JSON.stringify({ id: 'DEMO-' + Date.now(), ver: '1.0' }));
            setGenerated(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="gen-page-root">
            <div className="gen-form-section no-print">
                <h2 className="gen-title">Generate Leaving Certificate</h2>
                <div className="gen-grid">
                    <input name="grNo" placeholder="G.R. No." className="gen-input" onChange={handleChange} />
                    <input name="studentName" placeholder="Full Name" className="gen-input" onChange={handleChange} />
                    <input name="uid" placeholder="UID No." className="gen-input" onChange={handleChange} />
                </div>
                <div style={{ marginTop: '20px' }}>
                    <button onClick={handleGenerate} className="btn btn-primary">Generate Template</button>
                    {generated && (
                        <button onClick={handlePrint} className="btn btn-success">Print Certificate</button>
                    )}
                </div>
            </div>

            {/* PREVIEW / PRINT AREA */}
            {generated && (
                <div className="lc-preview-wrapper">
                    <div className="lc-container">
                        <div className="lc-border">
                            <div className="lc-inner-border">

                                {/* Header */}
                                <div className="header-grid">
                                    <div className="logo-area">
                                        <div className="logo-circle">LOGO</div>
                                    </div>
                                    <div className="header-text-area">
                                        <div className="trust-top">Managed By Shree Trimurti Educational & Charitable Trust - Junagadh</div>
                                        <div className="school-name-text">NOBLE PRIMARY SCHOOL - JUNAGADH</div>
                                        <div className="school-address">Noble Nagar, B/H Bus Stand, Junagadh - 362002 (Guj) 98043 25000</div>
                                        <div className="reg-box">Registration No. APL/2288/32775/2188/Ch Date : 30-03-89</div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="cert-title-row">
                                    <div className="cert-title-box">
                                        <span className="ct-en">School Leaving Certificate</span>
                                        <span className="ct-gu">શાળા છોડ્યાનું પ્રમાણપત્ર</span>
                                    </div>
                                </div>

                                {/* SR/GR Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 5px 10px', fontSize: '14px', fontWeight: 'bold' }}>
                                    <span>Sr. No. ____________</span>
                                    <span>G.R.No./ જ.આર.નં. : {formData.grNo || '____________'}</span>
                                </div>

                                {/* Data Grid */}
                                <div className="lc-data-grid">
                                    {/* Row 1 */}
                                    <div className="d-row">
                                        <div className="d-num">1.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Full Name of the Student (Surname first)</div>
                                            <div className="d-label-gu">વિદ્યાર્થીનું પૂરું નામ (અટક પ્રથમ)</div>
                                        </div>
                                    </div>
                                    {/* Row 2 */}
                                    <div className="d-row">
                                        <div className="d-num">2.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Religion & Caste</div>
                                            <div className="d-label-gu">ધર્મ અને જાતિ</div>
                                        </div>
                                    </div>
                                    {/* Row 3 */}
                                    <div className="d-row">
                                        <div className="d-num">3.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Mother's Name</div>
                                            <div className="d-label-gu">માતાનું નામ</div>
                                        </div>
                                    </div>
                                    {/* Row 4 */}
                                    <div className="d-row">
                                        <div className="d-num">4.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Place of Birth (With Taluka/District)</div>
                                            <div className="d-label-gu">જન્મ સ્થળ (તાલુકા, જીલ્લા સહિત)</div>
                                        </div>
                                    </div>
                                    {/* Row 5 */}
                                    <div className="d-row">
                                        <div className="d-num">5.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Date of Birth (in figures and words)</div>
                                            <div className="d-sub">as per Christian Calendar</div>
                                            <div className="d-label-gu">જન્મ તારીખ (આંકડામાં અને શબ્દમાં)</div>
                                        </div>
                                    </div>
                                    {/* Row 6 */}
                                    <div className="d-row">
                                        <div className="d-num">6.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Last School Attended</div>
                                            <div className="d-label-gu">ક્યાં ભણ્યા હતા તે છેલ્લી શાળા</div>
                                        </div>
                                    </div>
                                    {/* Row 7/8 Split */}
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
                                    {/* Row 9 */}
                                    <div className="d-row">
                                        <div className="d-num">9.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">In which Standard he/she Studying & Since When?</div>
                                            <div className="d-label-gu">કયા ધોરણમાં અભ્યાસ કરે છે અને ક્યારથી?</div>
                                        </div>
                                    </div>
                                    {/* Row 10 */}
                                    <div className="d-row">
                                        <div className="d-num">10.</div>
                                        <div className="d-content">
                                            <div className="d-label-en">Reason for leaving school</div>
                                            <div className="d-label-gu">શાળા છોડવાનું કારણ</div>
                                        </div>
                                    </div>
                                    {/* Row 11/12/13 Split */}
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

                                {/* Date UID Row */}
                                <div className="lc-data-grid" style={{ flex: 'none', borderTop: 'none' }}>
                                    <div className="date-uid-row">
                                        <div className="du-item" style={{ maxWidth: '150px' }}>Date : {formData.date}</div>
                                        <div className="du-item" style={{ borderRight: 'none' }}>UID No. {formData.uid || '____________________'}</div>
                                    </div>
                                </div>

                                {/* Certification Text */}
                                <div className="certify-text">
                                    I Certify that the above information is verified by me with School General Register and found to be correct.<br />
                                    આથી પ્રમાણિત કરવામાં આવે છે કે ઉપરની માહિતીની ચકાસણી શાળાના જનરલ રજીસ્ટર સાથે કરવામાં આવેલ છે. જે ખરી માલુમ પડી છે.
                                </div>

                                {/* Signatures */}
                                <div className="foot-row">
                                    <div className="sig-block">
                                        <div className="sig-line"></div>
                                        <div style={{ fontWeight: 'bold' }}>Clerk<br />કલાર્ક</div>
                                    </div>
                                    {/* QR Code can sit here in middle or absolute bottom */}
                                    <div className="sig-block">
                                        <div style={{ fontWeight: 'bold' }}>PRINCIPAL</div>
                                        <div style={{ fontWeight: 'bold', color: '#1a237e' }}>NOBLE PRIMARY SCHOOL</div>
                                        <div style={{ fontWeight: 'bold' }}>JUNAGADH</div>
                                    </div>
                                </div>

                                {/* QR Absolute */}
                                {qrValue && (
                                    <div className="qr-float">
                                        <QRCode value={qrValue} size={110} />
                                        <div style={{ fontSize: '8px', marginTop: '2px', fontWeight: 'bold' }}>Scan to Verify</div>
                                    </div>
                                )}

                                {/* Statutory Warning */}
                                <div className="warn-row">
                                    <strong>Statutory Warning:</strong> No one can issue this certificate or make any Changes in any entry except the headmaster of the school entries or the authorized person appointed for such work in the absence or unavailability of the principal.
                                    <br />
                                    શાળાના આચાર્ય અથવા તેમની ગેરહાજરીમાં સહી કરવા માટે અધિકૃત કરેલ વ્યક્તિ સિવાય અન્ય કોઈ વ્યક્તિ આ પ્રમાણપત્ર આપી શકશે નહિ કે તેની કોઈ નોંધમાં ફેરફાર કરી શકશે નહિ.
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Generate;
