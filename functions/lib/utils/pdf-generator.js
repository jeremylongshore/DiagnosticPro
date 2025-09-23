"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFReport = generatePDFReport;
const pdfkit_1 = __importDefault(require("pdfkit"));
async function generatePDFReport({ submissionData, analysis, submissionId }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                margin: 50,
                size: 'A4'
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Header
            doc.fontSize(24)
                .fillColor('#1a365d')
                .text('DiagnosticPro AI Analysis Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12)
                .fillColor('#666')
                .text(`Report ID: ${submissionId}`, { align: 'center' });
            doc.moveDown(2);
            // Equipment Information
            doc.fontSize(16)
                .fillColor('#000')
                .text('Equipment Information', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            const equipmentInfo = [
                `Type: ${submissionData?.equipmentType || 'Not specified'}`,
                `Make: ${submissionData?.make || 'Not specified'}`,
                `Model: ${submissionData?.model || 'Not specified'}`,
                `Year: ${submissionData?.year || 'Not specified'}`,
                `Problem: ${submissionData?.problemDescription || 'Not specified'}`,
                `Error Codes: ${submissionData?.errorCodes || 'None provided'}`
            ];
            equipmentInfo.forEach(info => {
                doc.text(info);
                doc.moveDown(0.3);
            });
            doc.moveDown(1);
            // Analysis Section
            doc.fontSize(16)
                .fillColor('#000')
                .text('AI Diagnostic Analysis', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11)
                .fillColor('#333');
            // Split analysis into paragraphs and format
            const analysisLines = analysis.split('\n');
            let currentY = doc.y;
            analysisLines.forEach((line) => {
                // Check if we need a new page
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                    doc.y = currentY;
                }
                if (line.trim()) {
                    // Handle headers (lines starting with emoji or numbers)
                    if (line.match(/^[🎯🔍✅❓💸🚩⚖️🔧📦💬🕵️]/)) {
                        doc.fontSize(13)
                            .fillColor('#1a365d')
                            .text(line.trim(), { indent: 0 });
                        doc.moveDown(0.3);
                    }
                    else {
                        doc.fontSize(11)
                            .fillColor('#333')
                            .text(line.trim(), { indent: 20 });
                        doc.moveDown(0.2);
                    }
                }
                else {
                    doc.moveDown(0.3);
                }
                currentY = doc.y;
            });
            // Footer
            doc.fontSize(10)
                .fillColor('#666')
                .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 750);
            doc.text('DiagnosticPro.io - Professional Equipment Diagnostics', 50, 765);
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
