const InvoiceSnapshot = require('../models/InvoiceSnapshot');
const fs = require('fs');
const path = require('path');

// GET /api/invoices/:id/download
exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const snapshot = await InvoiceSnapshot.findById(id);
    if (!snapshot) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Basic RBAC: allow patient, provider, admin
    const userId = req.user && req.user._id && req.user._id.toString();
    const allowed = req.user?.role === 'admin' || snapshot.patient?.toString() === userId || snapshot.provider?.toString() === userId;
    if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized to download invoice' });

    if (snapshot.invoicePdfUrl) {
      // map url to file path
      const filename = snapshot.invoicePdfUrl.split('/').pop();
      const filePath = path.join(process.cwd(), 'storage', 'invoices', filename);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, `${snapshot.invoiceNumber}.pdf`);
      }
    }

    // Fallback: serve HTML snapshot
    if (snapshot.invoiceHtml) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(snapshot.invoiceHtml);
    }

    return res.status(404).json({ success: false, message: 'No invoice file available' });
  } catch (err) {
    next(err);
  }
};
