import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { bookingsApi, tutorsApi } from "../../lib/api";
import "./PaymentConfirmation.css";

// Default Ethiopian mobile payment methods (previously from mockPaymentMethods.json)
const DEFAULT_ETHIOPIAN_METHODS = [
  { id: "cbe", name: "CBE Birr", accountNumber: "1000123456789", accountName: "Abugida Tutor", isPrimary: true },
  { id: "telebirr", name: "Telebirr", accountNumber: "0911234567", accountName: "Abugida Tutor", isPrimary: false },
  { id: "awash", name: "Awash Bank", accountNumber: "0142300012345", accountName: "Abugida Tutor", isPrimary: false },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

function PaymentConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Load current booking from state or localStorage
  const booking = useMemo(() => {
    const stateBooking = location.state?.booking;

    let bookList = [];
    try {
      const saved = localStorage.getItem("abugida_student_bookings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          bookList = parsed;
        }
      }
    } catch (error) {
      console.error("Unable to read saved bookings:", error);
    }

    const fallbackBooking =
      bookList.find((entry) => String(entry.bookingId) === String(bookingId)) ||
      bookList[0] ||
      null;

    return {
      ...fallbackBooking,
      ...(stateBooking || {}),
      bookingId: stateBooking?.bookingId || fallbackBooking?.bookingId || bookingId || "bk-204",
      tutorId: stateBooking?.tutorId || fallbackBooking?.tutorId || 1,
      tutorName: stateBooking?.tutorName || fallbackBooking?.tutorName || "Dr. Abebe Bekele",
      tutorAvatar:
        stateBooking?.tutorAvatar ||
        fallbackBooking?.tutorAvatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      subject: stateBooking?.subject || fallbackBooking?.subject || "Mathematics",
      topic: stateBooking?.topic || fallbackBooking?.topic || "Calculus I: Limits, Continuity & Chain Rule",
      date: stateBooking?.date || fallbackBooking?.date || "Today, Oct 24",
      time: stateBooking?.time || fallbackBooking?.time || "04:00 PM",
      duration: stateBooking?.duration || fallbackBooking?.duration || "60 mins",
      sessionType:
        stateBooking?.sessionType || fallbackBooking?.sessionType || "1-on-1 Private Live Session",
      totalPrice: Number(stateBooking?.totalPrice ?? fallbackBooking?.totalPrice ?? 27),
      serviceFee: Number(stateBooking?.serviceFee ?? fallbackBooking?.serviceFee ?? 2),
      price: Number(stateBooking?.price ?? fallbackBooking?.price ?? 25),
      studentName: stateBooking?.studentName || fallbackBooking?.studentName || "Nahom Tadesse",
      studentEmail: stateBooking?.studentEmail || fallbackBooking?.studentEmail || "nahom.student@abugida.edu.et",
      studentPhone: stateBooking?.studentPhone || fallbackBooking?.studentPhone || "+251 91 234 5678",
      status: stateBooking?.status || fallbackBooking?.status || "Payment Pending",
      transactionRef: stateBooking?.transactionRef || fallbackBooking?.transactionRef || "",
      paymentMethod: stateBooking?.paymentMethod || fallbackBooking?.paymentMethod || "",
      receiptImage: stateBooking?.receiptImage || fallbackBooking?.receiptImage || "",
    };
  }, [bookingId, location.state]);

  // Load Tutor's customized payment methods
  const tutorPaymentMethods = useMemo(() => {
    try {
      const storedMap = localStorage.getItem("abugida_tutor_payment_methods");
      if (storedMap) {
        const parsed = JSON.parse(storedMap);
        const tutorKey = String(booking.tutorId);
        const nameKey = booking.tutorName?.toLowerCase();
        if (parsed[tutorKey] && parsed[tutorKey].length > 0) {
          return parsed[tutorKey];
        }
        if (nameKey && parsed[nameKey] && parsed[nameKey].length > 0) {
          return parsed[nameKey];
        }
      }
    } catch (err) {
      console.error("Failed to load custom tutor payment methods:", err);
    }

    // Dynamic fallback customized with tutor's name
    return DEFAULT_ETHIOPIAN_METHODS.map((m) => ({
      ...m,
      accountName: booking.tutorName || m.accountName,
    }));
  }, [booking.tutorId, booking.tutorName]);

  const [selectedMethodId, setSelectedMethodId] = useState(() => {
    const primary = tutorPaymentMethods.find((m) => m.isPrimary);
    return primary ? primary.id : tutorPaymentMethods[0]?.id || "pm-telebirr";
  });

  // Receipt Upload & Verification Form State
  const [transactionRef, setTransactionRef] = useState(booking.transactionRef || "");
  const [payerName, setPayerName] = useState(booking.studentName || "Nahom Tadesse");
  const [payerPhone, setPayerPhone] = useState(booking.studentPhone || "+251 91 234 5678");
  const [receiptImage, setReceiptImage] = useState(booking.receiptImage || "");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [studentRemarks, setStudentRemarks] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptSubmitted, setReceiptSubmitted] = useState(
    booking.status === "Pending Approval" || !!booking.receiptImage
  );

  const selectedMethod = useMemo(() => {
    return (
      tutorPaymentMethods.find((m) => m.id === selectedMethodId) ||
      tutorPaymentMethods[0] ||
      DEFAULT_ETHIOPIAN_METHODS[0]
    );
  }, [tutorPaymentMethods, selectedMethodId]);

  const subtotal = Number(booking.price || 0);
  const fee = Number(booking.serviceFee || 0);
  const totalUSD = Number(booking.totalPrice || subtotal + fee);
  const totalETB = Math.round(totalUSD * 125); // ~125 ETB / USD exchange rate

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2200);
  };

  // Receipt file upload handler
  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMessage("Please upload an image file (JPG, PNG, WebP) of your transfer receipt.");
      return;
    }

    setReceiptFileName(file.name);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Receipt for Tutor Review
  const handleSubmitReceipt = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!transactionRef.trim()) {
      setErrorMessage("Please enter your Transaction Reference / Confirmation ID.");
      return;
    }

    if (!receiptImage) {
      setErrorMessage("Please upload a screenshot or photo of your payment receipt.");
      return;
    }

    setProcessing(true);

    const updatedBooking = {
      ...booking,
      status: "Pending Approval",
      paymentStatus: "receipt_submitted",
      paymentMethod: selectedMethod.type,
      paymentAccountUsed: selectedMethod.accountNumber,
      paymentAccountName: selectedMethod.accountName,
      transactionRef: transactionRef.trim().toUpperCase(),
      payerName: payerName.trim(),
      payerPhone: payerPhone.trim(),
      receiptImage: receiptImage,
      receiptFileName: receiptFileName || "receipt-slip.png",
      receiptNote: studentRemarks.trim(),
      receiptUploadedAt: new Date().toISOString(),
    };

    // Send to backend API asynchronously
    bookingsApi
      .uploadReceipt(booking.bookingId, {
        paymentMethod: selectedMethod.type,
        paymentAccountUsed: selectedMethod.accountNumber,
        paymentAccountName: selectedMethod.accountName,
        transactionRef: transactionRef.trim().toUpperCase(),
        payerName: payerName.trim(),
        payerPhone: payerPhone.trim(),
        receiptImage: receiptImage,
        receiptFileName: receiptFileName || "receipt-slip.png",
        receiptNote: studentRemarks.trim(),
      })
      .catch((err) => {
        console.warn("Backend receipt sync notice:", err.message);
      });

    setTimeout(() => {
      try {
        const saved = localStorage.getItem("abugida_student_bookings");
        const currentList = saved ? JSON.parse(saved) : [];
        const list = Array.isArray(currentList) ? currentList : [];

        const updatedList = list.some((entry) => String(entry.bookingId) === String(booking.bookingId))
          ? list.map((entry) =>
              String(entry.bookingId) === String(booking.bookingId) ? updatedBooking : entry
            )
          : [updatedBooking, ...list];

        localStorage.setItem("abugida_student_bookings", JSON.stringify(updatedList));
      } catch (error) {
        console.error("Failed to save booking receipt:", error);
      }

      setProcessing(false);
      setReceiptSubmitted(true);
    }, 600);
  };

  const initials = booking.tutorName
    ? booking.tutorName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "T";

  return (
    <Layout>
      <div className="payment-confirmation-page">
        {/* Top Breadcrumb */}
        <div className="confirmation-breadcrumb-bar">
          <div className="container breadcrumb-container">
            <Link to={`/booking/${booking.tutorId}`} className="breadcrumb-back-link">
              ← Back to Booking Details
            </Link>
            <div className="breadcrumb-trail">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to="/student/bookings">My Bookings</Link>
              <span>/</span>
              <span className="current">Payment & Receipt</span>
            </div>
          </div>
        </div>

        <div className="container payment-confirmation-shell">
          <header className="confirmation-header">
            <span className="confirmation-badge">
              {receiptSubmitted ? "Receipt Awaiting Approval" : "Direct Local Payment"}
            </span>
            <h1>
              {receiptSubmitted ? "Payment Receipt Submitted" : "Transfer Tuition & Upload Receipt"}
            </h1>
            <p>
              {receiptSubmitted
                ? `Your payment receipt has been submitted to ${booking.tutorName} for verification. Once approved, your session link will be ready.`
                : `Transfer the exact tutoring fee directly to ${booking.tutorName}'s verified Telebirr or Bank Account below, then upload your transaction receipt.`}
            </p>
          </header>

          <div className="confirmation-layout">
            {/* ────── LEFT COLUMN: PAYMENT METHODS & RECEIPT UPLOAD ────── */}
            <section className="confirmation-panel payment-form-panel">
              {receiptSubmitted ? (
                <div className="confirmation-success-box">
                  <div className="pending-status-icon">⏳</div>
                  <p className="success-title">Receipt Uploaded & Sent to Tutor</p>
                  <p className="success-message">
                    Thank you! Your payment receipt has been delivered to{" "}
                    <strong>{booking.tutorName}</strong>. The tutor will verify your transaction
                    and approve your booking reservation shortly.
                  </p>

                  {/* 3-Step Visual Progress Tracker */}
                  <div className="booking-progress-stepper">
                    <div className="step-node completed">
                      <div className="step-circle">✓</div>
                      <span>1. Reserved</span>
                    </div>
                    <div className="step-line active"></div>
                    <div className="step-node completed">
                      <div className="step-circle">✓</div>
                      <span>2. Receipt Uploaded</span>
                    </div>
                    <div className="step-line in-progress"></div>
                    <div className="step-node pending">
                      <div className="step-circle">3</div>
                      <span>3. Tutor Approval</span>
                    </div>
                  </div>

                  {/* Submission Summary Details */}
                  <div className="submitted-receipt-card">
                    <div className="receipt-summary-grid">
                      <div className="receipt-summary-item">
                        <span className="s-label">Booking ID:</span>
                        <strong className="s-val font-mono">{booking.bookingId}</strong>
                      </div>
                      <div className="receipt-summary-item">
                        <span className="s-label">Payment Method:</span>
                        <strong className="s-val">{selectedMethod.type}</strong>
                      </div>
                      <div className="receipt-summary-item">
                        <span className="s-label">Transaction Ref:</span>
                        <strong className="s-val font-mono text-primary">
                          {transactionRef || booking.transactionRef || "TLB-7489218"}
                        </strong>
                      </div>
                      <div className="receipt-summary-item">
                        <span className="s-label">Amount Transferred:</span>
                        <strong className="s-val price-highlight">
                          {formatCurrency(totalUSD)} (~{totalETB.toLocaleString()} ETB)
                        </strong>
                      </div>
                    </div>

                    {receiptImage && (
                      <div className="receipt-preview-inline">
                        <span className="preview-label">Uploaded Receipt Screenshot:</span>
                        <div className="receipt-img-frame">
                          <img
                            src={receiptImage}
                            alt="Payment Receipt Preview"
                            className="receipt-thumb-img"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="confirmation-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => navigate("/student/bookings")}
                    >
                      View in My Bookings
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => navigate("/student/dashboard")}
                    >
                      Back to Dashboard
                    </button>
                    <button
                      type="button"
                      className="text-action-button"
                      onClick={() => setReceiptSubmitted(false)}
                    >
                      ✏️ Edit or Re-upload Receipt
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReceipt} className="payment-flow-form">
                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="payment-alert-error" role="alert">
                      <span>⚠️ {errorMessage}</span>
                    </div>
                  )}

                  {/* 1. SELECT TUTOR'S PAYMENT METHOD */}
                  <div className="section-block">
                    <div className="section-heading">
                      <span className="step-tag">Step 1</span>
                      <h2>Choose {booking.tutorName.split(" ")[0]}'s Payment Method</h2>
                    </div>
                    <p className="section-sub">
                      Select how you want to transfer tuition to your tutor:
                    </p>

                    <div className="eth-methods-grid" role="radiogroup">
                      {tutorPaymentMethods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <div
                            key={method.id}
                            className={`eth-method-card ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedMethodId(method.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                          >
                            <div className="eth-card-top">
                              <span className="eth-icon">
                                {method.type.includes("Telebirr")
                                  ? "📱"
                                  : method.type.includes("CBE")
                                  ? "🏦"
                                  : "🏛️"}
                              </span>
                              <span className="eth-radio-indicator">
                                {isSelected ? "●" : "○"}
                              </span>
                            </div>
                            <h4 className="eth-name">{method.type}</h4>
                            <span className="eth-account-mini">{method.accountNumber}</span>
                            {method.isPrimary && (
                              <span className="eth-primary-chip">Preferred</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. TUTOR'S ACCOUNT DETAILS & TRANSFER INSTRUCTIONS */}
                  <div className="section-block tutor-acc-details-block">
                    <div className="section-heading">
                      <span className="step-tag">Step 2</span>
                      <h2>Tutor Account Details & Transfer Amount</h2>
                    </div>

                    <div className="account-instruction-card">
                      <div className="acc-info-header">
                        <div>
                          <span className="acc-bank-type">{selectedMethod.type}</span>
                          <h3 className="acc-holder-name">{selectedMethod.accountName}</h3>
                        </div>
                        <div className="transfer-amount-badge">
                          <span className="amt-label">Transfer Amount</span>
                          <strong className="amt-usd">{formatCurrency(totalUSD)}</strong>
                          <span className="amt-etb">≈ {totalETB.toLocaleString()} ETB</span>
                        </div>
                      </div>

                      <div className="acc-data-rows">
                        <div className="acc-field-row">
                          <div className="field-info">
                            <span className="label">Account / Phone Number:</span>
                            <strong className="val font-mono code-highlight">
                              {selectedMethod.accountNumber}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className={`btn-copy-acc ${copiedField === "acc" ? "copied" : ""}`}
                            onClick={() => handleCopy(selectedMethod.accountNumber, "acc")}
                          >
                            {copiedField === "acc" ? "Copied ✓" : "Copy Number 📋"}
                          </button>
                        </div>

                        {selectedMethod.branch && (
                          <div className="acc-field-row">
                            <div className="field-info">
                              <span className="label">Branch:</span>
                              <span className="val">{selectedMethod.branch}</span>
                            </div>
                          </div>
                        )}

                        <div className="acc-field-row">
                          <div className="field-info">
                            <span className="label">Required Booking Reference / Reason:</span>
                            <strong className="val font-mono">{booking.bookingId}</strong>
                          </div>
                          <button
                            type="button"
                            className={`btn-copy-acc ${copiedField === "ref" ? "copied" : ""}`}
                            onClick={() => handleCopy(booking.bookingId, "ref")}
                          >
                            {copiedField === "ref" ? "Copied ✓" : "Copy ID 📋"}
                          </button>
                        </div>
                      </div>

                      {selectedMethod.instructions && (
                        <div className="tutor-custom-notes">
                          <span className="note-icon">💡</span>
                          <p>
                            <strong>Tutor Note:</strong> {selectedMethod.instructions}
                          </p>
                        </div>
                      )}

                      {selectedMethod.qrCode && (
                        <div className="qr-scan-wrapper">
                          <p className="qr-title">📱 Scan QR Code with Mobile Banking App:</p>
                          <img
                            src={selectedMethod.qrCode}
                            alt="Payment QR Code"
                            className="qr-large-preview"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. UPLOAD PAYMENT RECEIPT & SENDER INFO */}
                  <div className="section-block">
                    <div className="section-heading">
                      <span className="step-tag">Step 3</span>
                      <h2>Upload Transfer Receipt Screenshot</h2>
                    </div>
                    <p className="section-sub">
                      Attach your Telebirr SMS / app confirmation screenshot or CBE receipt slip so your tutor can verify and approve the session:
                    </p>

                    {/* Receipt Upload Dropzone */}
                    <div className="receipt-upload-dropzone">
                      {receiptImage ? (
                        <div className="uploaded-preview-container">
                          <img
                            src={receiptImage}
                            alt="Receipt Preview"
                            className="receipt-full-preview"
                          />
                          <div className="receipt-preview-controls">
                            <span className="receipt-filename-text">
                              ✓ {receiptFileName || "Receipt attached successfully"}
                            </span>
                            <label className="btn-change-receipt" htmlFor="receipt-file-input">
                              Replace File
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="dropzone-label" htmlFor="receipt-file-input">
                          <div className="dropzone-icon">📸</div>
                          <span className="dropzone-title">
                            Click to Upload Payment Receipt / Screenshot
                          </span>
                          <span className="dropzone-sub">
                            Supports PNG, JPG, JPEG or WebP (Max 10MB)
                          </span>
                        </label>
                      )}
                      <input
                        id="receipt-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handleReceiptUpload}
                        className="hidden-file-input"
                      />
                    </div>

                    {/* Transaction Reference & Sender Details */}
                    <div className="form-fields-grid mt-4">
                      <label className="field-label">
                        <span>
                          Transaction Reference / ID Number <span className="req">*</span>
                        </span>
                        <input
                          type="text"
                          className="text-input"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="e.g. TLB98342189 or FT26083749"
                          required
                        />
                        <span className="input-hint">
                          Found on your Telebirr or Bank transfer confirmation message.
                        </span>
                      </label>

                      <div className="form-row-2">
                        <label className="field-label">
                          <span>
                            Sender Full Name <span className="req">*</span>
                          </span>
                          <input
                            type="text"
                            className="text-input"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            placeholder="Name as registered on bank / Telebirr"
                            required
                          />
                        </label>

                        <label className="field-label">
                          <span>
                            Sender Phone Number <span className="req">*</span>
                          </span>
                          <input
                            type="tel"
                            className="text-input"
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value)}
                            placeholder="+251 91 123 4567"
                            required
                          />
                        </label>
                      </div>

                      <label className="field-label">
                        <span>Message or Remarks for Tutor (Optional)</span>
                        <textarea
                          className="textarea-input"
                          rows="2"
                          value={studentRemarks}
                          onChange={(e) => setStudentRemarks(e.target.value)}
                          placeholder="e.g. Transferred 3,375 ETB via Telebirr at 3:15 PM..."
                        />
                      </label>
                    </div>
                  </div>

                  <div className="secure-note">
                    <span className="shield">🛡️</span>
                    <span>
                      Abugida Escrow Protection: Your session is protected until the class is successfully delivered.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="primary-button submit-receipt-btn"
                    disabled={processing}
                  >
                    {processing ? (
                      "Uploading & Notifying Tutor..."
                    ) : (
                      <>
                        <span>Submit Receipt for Tutor Approval →</span>
                        <span className="btn-micro-sub">
                          {booking.tutorName.split(" ")[0]} will verify and confirm your session
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>

            {/* ────── RIGHT COLUMN: BOOKING & PRICE SUMMARY ────── */}
            <aside className="confirmation-panel summary-panel">
              <div
                className={`status-banner ${
                  receiptSubmitted ? "pending-approval" : "neutral"
                }`}
              >
                <span>{receiptSubmitted ? "⏳" : "●"}</span>
                {receiptSubmitted
                  ? "Status: Pending Tutor Verification"
                  : "Status: Awaiting Receipt Upload"}
              </div>

              <div className="summary-header">
                <div className="summary-avatar-wrap">
                  {booking.tutorAvatar ? (
                    <img
                      src={booking.tutorAvatar}
                      alt={booking.tutorName}
                      className="summary-avatar"
                    />
                  ) : (
                    <div className="summary-avatar fallback">{initials}</div>
                  )}
                </div>

                <div>
                  <p className="summary-label">Instructor</p>
                  <h3>{booking.tutorName}</h3>
                  <span className="summary-subtitle">{booking.subject}</span>
                </div>
              </div>

              <div className="summary-section">
                <div className="summary-row">
                  <span>Topic</span>
                  <strong className="topic-text">{booking.topic}</strong>
                </div>
                <div className="summary-row">
                  <span>Format</span>
                  <strong>{booking.sessionType}</strong>
                </div>
                <div className="summary-row">
                  <span>Scheduled Date</span>
                  <strong>{booking.date}</strong>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <strong>{booking.time}</strong>
                </div>
                <div className="summary-row">
                  <span>Duration</span>
                  <strong>{booking.duration}</strong>
                </div>
                <div className="summary-row">
                  <span>Student</span>
                  <strong>{booking.studentName}</strong>
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row">
                  <span>Tuition Fee</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="price-row">
                  <span>Platform & Whiteboard Fee</span>
                  <strong>{formatCurrency(fee)}</strong>
                </div>
                <div className="price-row total-row">
                  <div>
                    <span className="total-title">Total Amount</span>
                    <span className="total-rate-sub">Rate: 1 USD ≈ 125 ETB</span>
                  </div>
                  <div className="total-amount-box">
                    <strong>{formatCurrency(totalUSD)}</strong>
                    <span className="total-etb-val">~{totalETB.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              <div className="confirmation-message-box">
                <p className="confirmation-message-title">Approval Workflow Notice</p>
                <p>
                  {receiptSubmitted
                    ? `Your receipt has been forwarded to ${booking.tutorName}. Once reviewed, you will receive full classroom access.`
                    : `After uploading your transfer receipt, ${booking.tutorName} will inspect and approve the payment to confirm your booking.`}
                </p>
              </div>

              <div className="booking-reference">
                <span>Booking ID Reference</span>
                <strong>{booking.bookingId}</strong>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PaymentConfirmation;
