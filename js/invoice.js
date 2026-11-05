/**
 * Professional Remote Contractor Invoice & Rate Sheet Engine
 * Generates international contractor invoices (USD/EUR/SGD/IDR) with tax/SWIFT details and print layout.
 */

import { formatIDR } from "./salary-calculator.js?v=20261106a";

const INVOICE_STORAGE_KEY = "jsa_invoice_data_v1";

export const DEFAULT_INVOICE = {
  invoiceNumber: "INV-2026-001",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  currency: "USD",

  // Contractor info
  contractorName: "Budi Santoso",
  contractorEmail: "budi.santoso@email.com",
  contractorAddress: "Jl. Sudirman No. 45, Jakarta Selatan 12190, Indonesia",
  contractorTaxId: "NPWP/NIK: 3171012345670001",

  // Client info
  clientCompany: "Acme Global Technologies Inc.",
  clientEmail: "billing@acmeglobal.com",
  clientAddress: "548 Market St, Suite 1234, San Francisco, CA 94104, USA",

  // Payment method
  paymentMethod: "Wise / Bank Wire (SWIFT)",
  bankName: "Bank Central Asia (BCA) / Wise",
  accountNumber: "123-456-7890",
  swiftCode: "CENAIDJA",
  paymentNotes: "Transfer fees shared or covered by sender. Please include invoice number in payment reference.",

  // Line items
  items: [
    {
      description: "Fullstack Engineering Services (Sprint 24 - 25)",
      quantity: 160,
      unit: "Hours",
      unitPrice: 25.00
    }
  ]
};

export function readInvoiceData() {
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    return raw ? { ...DEFAULT_INVOICE, ...JSON.parse(raw) } : { ...DEFAULT_INVOICE };
  } catch (err) {
    return { ...DEFAULT_INVOICE };
  }
}

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
}

export function validateInvoiceData(data) {
  const errors = [];
  if (!data.invoiceNumber || !data.invoiceNumber.trim()) errors.push("Nomor invoice wajib diisi.");
  if (!data.contractorName || !data.contractorName.trim()) errors.push("Nama kontraktor wajib diisi.");
  if (!data.clientCompany || !data.clientCompany.trim()) errors.push("Nama klien/perusahaan wajib diisi.");
  if (!Array.isArray(data.items) || data.items.length === 0) errors.push("Minimal harus ada 1 baris rincian pekerjaan.");
  
  for (const item of (data.items || [])) {
    if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      errors.push("Jumlah kuantitas (jam/unit) harus berupa angka positif.");
      break;
    }
    if (isNaN(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
      errors.push("Tarif satuan tidak boleh negatif.");
      break;
    }
  }
  return { valid: errors.length === 0, errors };
}

export function writeInvoiceData(data) {
  try {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}

export function formatCurrencyAmount(amount, currency = "USD") {
  if (currency === "IDR") return formatIDR(amount);
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)}`;
}
