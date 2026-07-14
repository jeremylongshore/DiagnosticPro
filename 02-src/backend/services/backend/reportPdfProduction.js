// Production-Grade PDF Generation System
// Fixes: 2:1 page ratio bug, missing sections, typography issues, validation

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================
// PART 1: DIAGNOSTIC REPORT CONTRACT
// ============================================

const DIAGNOSTIC_REPORT_CONTRACT = {
  version: "2.0",
  validation: "strict",
  sections: [
    {
      id: "primary_diagnosis",
      title: "1. PRIMARY DIAGNOSIS",
      required: true,
      critical: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "narrative" }
    },
    {
      id: "differential_diagnosis",
      title: "2. DIFFERENTIAL DIAGNOSIS",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list", minBullets: 2, maxBullets: 8 }
    },
    {
      id: "diagnostic_verification",
      title: "3. DIAGNOSTIC VERIFICATION",
      required: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "structured" }
    },
    {
      id: "shop_interrogation",
      title: "4. SHOP INTERROGATION",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list", minBullets: 5, maxBullets: 10 }
    },
    {
      id: "conversation_scripting",
      title: "5. CONVERSATION SCRIPTING",
      required: true,
      minWords: 200,
      maxWords: 600,
      format: { type: "narrative" }
    },
    {
      id: "cost_breakdown",
      title: "6. COST BREAKDOWN",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list" }
    },
    {
      id: "ripoff_detection",
      title: "7. RIPOFF DETECTION",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list" }
    },
    {
      id: "authorization_guide",
      title: "8. AUTHORIZATION GUIDE",
      required: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "structured" }
    },
    {
      id: "technical_education",
      title: "9. TECHNICAL EDUCATION",
      required: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "narrative" }
    },
    {
      id: "oem_parts_strategy",
      title: "10. OEM PARTS STRATEGY",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list" }
    },
    {
      id: "negotiation_tactics",
      title: "11. NEGOTIATION TACTICS",
      required: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "bullet_list" }
    },
    {
      id: "likely_causes",
      title: "12. LIKELY CAUSES (RANKED)",
      required: true,
      minWords: 100,
      maxWords: 400,
      format: { type: "bullet_list" }
    },
    {
      id: "recommendations",
      title: "13. RECOMMENDATIONS",
      required: true,
      minWords: 150,
      maxWords: 500,
      format: { type: "bullet_list" }
    },
    {
      id: "source_verification",
      title: "14. SOURCE VERIFICATION",
      required: true,
      minWords: 100,
      maxWords: 300,
      format: { type: "bullet_list" }
    },
    {
      id: "next_steps_summary",
      title: "15. NEXT STEPS SUMMARY",
      required: true,
      critical: true,
      minWords: 200,
      maxWords: 800,
      format: { type: "bullet_list" }
    }
  ],
  formatting: {
    maxConsecutiveNewlines: 2,
    prohibitedPatterns: [
      /\n{3,}/g,  // No triple+ newlines
      /\s{50,}/g, // No massive whitespace blocks
      /^[\s\n]*$/ // No empty sections
    ]
  }
};

// ============================================
// PART 2: TYPOGRAPHY CONFIGURATION
// ============================================

const TYPOGRAPHY_CONFIG = {
  fonts: {
    heading1: {
      font: 'IBMMonoBold',
      size: 18,
      spacing: { before: 20, after: 12 }
    },
    heading2: {
      font: 'IBMMonoBold',
      size: 14,
      spacing: { before: 16, after: 10 }
    },
    body: {
      font: 'IBMMono',
      size: 11,
      lineHeight: 1.4,
      spacing: { after: 8 }
    },
    bullet: {
      font: 'IBMMono',
      size: 11,
      lineHeight: 1.4
    }
  },

  margins: {
    page: { top: 72, bottom: 72, left: 72, right: 72 },
    paragraph: { bottom: 12 },
    bullet: { left: 20, hanging: 15, between: 6 }
  },

  bullets: {
    level1: { symbol: '•', indent: 0 },
    level2: { symbol: '◦', indent: 20 },
    level3: { symbol: '▪', indent: 40 }
  },

  layout: {
    maxLinesPerPage: 50,
    orphanControl: 3, // Minimum lines at page bottom
    widowControl: 2,  // Minimum lines at page top
    keepWithNext: ['heading1', 'heading2'] // Don't separate from content
  }
};

// ============================================
// PART 3: TYPOGRAPHY MANAGER CLASS
// ============================================

class TypographyManager {
  constructor(doc) {
    this.doc = doc;
    this.currentY = TYPOGRAPHY_CONFIG.margins.page.top;
    this.pageHeight = doc.page.height - TYPOGRAPHY_CONFIG.margins.page.bottom;
    this.pageWidth = doc.page.width;
    this.contentWidth = this.pageWidth - TYPOGRAPHY_CONFIG.margins.page.left - TYPOGRAPHY_CONFIG.margins.page.right;
    this.currentPage = 1;
    this.autoPageCount = 0;

    // Sync our Y tracking when pdfkit auto-paginates
    doc.on('pageAdded', () => {
      this.autoPageCount++;
      this.currentPage++;
      this.currentY = TYPOGRAPHY_CONFIG.margins.page.top;
    });
  }

  checkPageBreak(requiredHeight = 50) {
    if (this.currentY + requiredHeight > this.pageHeight) {
      this.doc.addPage();
      // Note: currentPage and currentY are updated by the pageAdded listener
      return true;
    }
    return false;
  }

  renderHeading1(text) {
    const config = TYPOGRAPHY_CONFIG.fonts.heading1;

    this.currentY += config.spacing.before;

    this.doc
      .font(config.font)
      .fontSize(config.size)
      .fillColor('black')
      .text(text, TYPOGRAPHY_CONFIG.margins.page.left, this.currentY, {
        width: this.contentWidth,
        align: 'center'
      });

    this.currentY = this.doc.y + config.spacing.after;
  }

  renderHeading2(text) {
    const config = TYPOGRAPHY_CONFIG.fonts.heading2;

    this.currentY += config.spacing.before;

    this.doc
      .font(config.font)
      .fontSize(config.size)
      .fillColor('black')
      .text(text, TYPOGRAPHY_CONFIG.margins.page.left, this.currentY, {
        width: this.contentWidth,
        underline: true
      });

    this.currentY = this.doc.y + config.spacing.after;
  }

  renderParagraph(text, options = {}) {
    if (!text || !text.trim()) return;

    const config = TYPOGRAPHY_CONFIG.fonts.body;
    const lineGap = config.lineHeight * config.size - config.size;

    // Clean excessive whitespace
    const cleaned = text.replace(/\n{3,}/g, '\n\n').trim();

    // Let pdfkit handle pagination natively — don't fight it with checkPageBreak
    // The pageAdded listener syncs our currentY when pdfkit creates new pages
    this.doc
      .font(config.font)
      .fontSize(config.size)
      .fillColor('black')
      .text(cleaned, TYPOGRAPHY_CONFIG.margins.page.left, this.currentY, {
        width: this.contentWidth,
        align: options.align || 'left',
        lineGap
      });

    // Sync Y position after render (pdfkit may have auto-paginated)
    this.currentY = this.doc.y + config.spacing.after;
  }

  renderBulletList(items, level = 1) {
    if (!items || items.length === 0) return;

    const bulletConfig = TYPOGRAPHY_CONFIG.bullets[`level${level}`];
    const fontConfig = TYPOGRAPHY_CONFIG.fonts.bullet;
    const margins = TYPOGRAPHY_CONFIG.margins.bullet;

    items.forEach((item, index) => {
      // Clean the text
      const text = String(item).replace(/^[•\-*]\s*/, '').trim();
      if (!text) return;

      // Render bullet as single combined string to avoid split across pages
      const bulletText = `${bulletConfig.symbol}  ${text}`;
      const textX = TYPOGRAPHY_CONFIG.margins.page.left + bulletConfig.indent;
      const textWidth = this.contentWidth - bulletConfig.indent;

      this.doc
        .font(fontConfig.font)
        .fontSize(fontConfig.size)
        .fillColor('black')
        .text(bulletText, textX, this.currentY, {
          width: textWidth,
          lineGap: fontConfig.lineHeight * fontConfig.size - fontConfig.size,
          align: 'left'
        });

      this.currentY = this.doc.y + margins.between;
    });

    // Add paragraph spacing after list
    this.currentY += TYPOGRAPHY_CONFIG.margins.paragraph.bottom;
  }

  renderSection(section) {
    // Validate section has content
    if (!section || !section.content) {
      console.warn(`⚠️ Skipping empty section: ${section?.title}`);
      return;
    }

    console.log(`📝 Rendering section: ${section.title}`);

    // Render heading
    this.renderHeading2(section.title);

    // Render content based on format
    if (section.format === 'bullet_list' || Array.isArray(section.content)) {
      const items = Array.isArray(section.content) ? section.content : this.parseBullets(section.content);
      this.renderBulletList(items);
    } else {
      this.renderParagraph(section.content);
    }
  }

  parseBullets(content) {
    if (!content) return [];

    const text = String(content);

    // Split on lines that start with bullet markers or numbered lists
    // This preserves multi-line content within a single bullet
    const bulletPattern = /^(?:[•\-*◦▪]|\d+\.)\s/m;
    const lines = text.split('\n');
    const bullets = [];
    let current = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        // Empty line — if we have accumulated content, keep it in current bullet
        if (current) current += ' ';
        continue;
      }
      if (bulletPattern.test(trimmed)) {
        // New bullet starts — flush previous
        if (current) bullets.push(current);
        current = trimmed.replace(/^[•\-*◦▪]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      } else if (trimmed.startsWith('**') && current) {
        // Bold sub-heading within content — append to current bullet
        current += ' ' + trimmed.replace(/\*\*/g, '').trim();
      } else {
        // Continuation line — append to current bullet
        current += (current ? ' ' : '') + trimmed;
      }
    }
    if (current) bullets.push(current);

    return bullets.filter(b => b.length > 0);
  }
}

// ============================================
// PART 4: PDF VALIDATION SYSTEM
// ============================================

class PDFValidationSystem {
  constructor(schema) {
    this.schema = schema;
    this.errors = [];
    this.warnings = [];
  }

  validateAnalysisObject(analysis) {
    console.log('=== VALIDATING ANALYSIS OBJECT ===');

    this.errors = [];
    this.warnings = [];

    // Check for required sections
    const requiredSections = this.schema.sections.filter(s => s.required);
    const criticalSections = this.schema.sections.filter(s => s.critical);

    // Map old field names to new section structure
    const sectionMapping = {
      'primaryDiagnosis': 'primary_diagnosis',
      'differentialDiagnosis': 'differential_diagnosis',
      'diagnosticVerification': 'diagnostic_verification',
      'shopInterrogation': 'shop_interrogation',
      'conversationScripting': 'conversation_scripting',
      'costBreakdown': 'cost_breakdown',
      'ripoffDetection': 'ripoff_detection',
      'authorizationGuide': 'authorization_guide',
      'technicalEducation': 'technical_education',
      'oemPartsStrategy': 'oem_parts_strategy',
      'negotiationTactics': 'negotiation_tactics',
      'likelyCausesRanked': 'likely_causes',
      'recommendations': 'recommendations',
      'sourceVerification': 'source_verification',
      'nextStepsSummary': 'next_steps_summary'
    };

    // Check for critical sections
    let hasCriticalSections = true;
    criticalSections.forEach(section => {
      const oldName = Object.keys(sectionMapping).find(k => sectionMapping[k] === section.id);
      if (!analysis[oldName] && !analysis[section.id]) {
        this.errors.push(`CRITICAL: Missing ${section.title}`);
        hasCriticalSections = false;
      }
    });

    // Count actual sections found
    let sectionsFound = 0;
    Object.keys(analysis).forEach(key => {
      if (analysis[key] && key !== 'fullAnalysis' && key !== 'detectedCodes') {
        sectionsFound++;
      }
    });

    console.log(`   Sections found: ${sectionsFound}`);
    console.log(`   Has critical sections: ${hasCriticalSections}`);

    // Check for blank page patterns in content
    Object.keys(analysis).forEach(key => {
      const content = analysis[key];
      if (typeof content === 'string') {
        // Check for excessive newlines
        const newlineMatches = content.match(/\n{5,}/g);
        if (newlineMatches) {
          this.warnings.push(`Section ${key} has ${newlineMatches.length} instances of 5+ consecutive newlines`);
        }

        // Check for massive whitespace
        if (content.match(/\s{100,}/)) {
          this.warnings.push(`Section ${key} has massive whitespace blocks`);
        }
      }
    });

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      sectionsFound: sectionsFound,
      hasCriticalSections: hasCriticalSections
    };
  }

  cleanSectionContent(content) {
    if (!content) return '';

    // Preserve arrays — clean each item individually, return as array
    if (Array.isArray(content)) {
      return content
        .map(item => String(item).replace(/\n{3,}/g, '\n\n').replace(/\s{50,}/g, ' ').trim())
        .filter(item => item.length > 0);
    }

    let cleaned = String(content);

    // Remove excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Remove massive whitespace blocks
    cleaned = cleaned.replace(/\s{50,}/g, ' ');

    // Trim each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

    // Remove empty lines at start and end
    cleaned = cleaned.trim();

    return cleaned;
  }
}

// ============================================
// PART 5: MAIN PDF GENERATOR CLASS
// ============================================

class DiagnosticPDFGenerator {
  constructor() {
    this.validator = new PDFValidationSystem(DIAGNOSTIC_REPORT_CONTRACT);
    this.typographer = null;
    this.doc = null;
    this.pageCount = 0;
  }

  registerFonts(doc) {
    const fontDir = path.join(__dirname, 'fonts');
    doc.registerFont('IBMMono', path.join(fontDir, 'IBMPlexMono-Regular.ttf'));
    doc.registerFont('IBMMonoBold', path.join(fontDir, 'IBMPlexMono-Bold.ttf'));
    doc.font('IBMMono');
  }

  createCoverPage(submission) {
    const pageHeight = this.doc.page.height;
    const pageWidth = this.doc.page.width;
    const margin = 72;
    const contentWidth = pageWidth - (margin * 2);
    const startY = (pageHeight / 2) - 120;

    this.doc.y = startY;

    // Title
    this.doc
      .font('IBMMonoBold')
      .fontSize(26)
      .text('DiagnosticPro AI Analysis Report', margin, this.doc.y, {
        width: contentWidth,
        align: 'center'
      });

    this.doc.moveDown(2.5);

    // Date
    const today = new Date().toLocaleDateString();
    this.doc
      .font('IBMMono')
      .fontSize(14)
      .text(`Date: ${today}`, margin, this.doc.y, {
        width: contentWidth,
        align: 'center'
      });

    this.doc.moveDown(0.8);

    // Report ID
    this.doc
      .fontSize(12)
      .text(`Report ID: ${submission?.id || 'N/A'}`, margin, this.doc.y, {
        width: contentWidth,
        align: 'center'
      });

    this.doc.moveDown(3);

    // Description
    this.doc
      .fontSize(11)
      .text('Proprietary 15-Section Analysis Framework v2.0', margin, this.doc.y, {
        width: contentWidth,
        align: 'center'
      });

    this.doc.moveDown(1.5);

    this.doc
      .fontSize(10)
      .text('This report is generated using DiagnosticPro\'s AI system.', margin, this.doc.y, {
        width: contentWidth,
        align: 'center'
      });

    this.doc.moveDown(0.5);

    this.doc.text('It equips customers with professional-grade insights,', margin, this.doc.y, {
      width: contentWidth,
      align: 'center'
    });

    this.doc.moveDown(0.5);

    this.doc.text('shop interrogation tactics, and fraud-protection strategies.', margin, this.doc.y, {
      width: contentWidth,
      align: 'center'
    });
  }

  createSubmissionSummary(submission, typographer) {
    typographer.renderHeading1('Submission Summary');

    typographer.renderHeading2('Vehicle Information');
    typographer.renderBulletList([
      `Make: ${submission?.make || 'N/A'}`,
      `Model: ${submission?.model || 'N/A'}`,
      `Year: ${submission?.year || 'N/A'}`,
      `Equipment Type: ${submission?.equipment_type || 'N/A'}`,
      `Serial Number: ${submission?.serial_number || 'N/A'}`,
      `Mileage/Hours: ${submission?.mileage_hours || 'N/A'}`
    ]);

    typographer.renderHeading2('Problem Description');
    typographer.renderParagraph(submission?.problem_description || 'No description provided.');

    if (submission?.symptoms?.length) {
      typographer.renderHeading2('Reported Symptoms');
      typographer.renderBulletList(submission.symptoms);
    }

    if (submission?.error_codes?.length) {
      typographer.renderHeading2('Error Messages / Codes');
      typographer.renderBulletList(submission.error_codes);
    }
  }

  async generatePDF(submission, analysis, filePath = '/tmp/report.pdf') {
    console.log('\n=== GENERATING PRODUCTION PDF ===');
    console.log(`Submission ID: ${submission?.id}`);

    try {
      // Step 1: Validate analysis object
      const validation = this.validator.validateAnalysisObject(analysis);

      if (!validation.valid) {
        console.error('❌ Analysis validation failed:', validation.errors);
        // Continue anyway but log the issues
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Analysis warnings:', validation.warnings);
      }

      // Step 2: Create PDF document with CONTROLLED pagination
      this.doc = new PDFDocument({
        autoFirstPage: false, // CRITICAL: We control page creation
        bufferPages: true,
        margin: 72,
        size: 'LETTER'
      });

      // Register fonts
      this.registerFonts(this.doc);

      // Create stream
      const stream = fs.createWriteStream(filePath);
      this.doc.pipe(stream);

      // Step 3: Add cover page
      this.doc.addPage();
      this.pageCount = 1;
      console.log(`📄 Page 1: Cover page`);
      this.createCoverPage(submission);

      // Step 4: Initialize typography manager
      this.doc.addPage();
      this.pageCount = 2;
      console.log(`📄 Page 2: Submission summary`);
      this.typographer = new TypographyManager(this.doc);

      // Step 5: Render submission summary
      this.createSubmissionSummary(submission, this.typographer);

      // Step 6: Render diagnostic analysis sections
      this.typographer.renderHeading1('Comprehensive AI Diagnostic Analysis');

      const sectionOrder = [
        'primaryDiagnosis',
        'differentialDiagnosis',
        'diagnosticVerification',
        'shopInterrogation',
        'conversationScripting',
        'costBreakdown',
        'ripoffDetection',
        'authorizationGuide',
        'technicalEducation',
        'oemPartsStrategy',
        'negotiationTactics',
        'likelyCausesRanked',
        'recommendations',
        'sourceVerification',
        'nextStepsSummary'
      ];

      const sectionTitles = {
        'primaryDiagnosis': '1. PRIMARY DIAGNOSIS',
        'differentialDiagnosis': '2. DIFFERENTIAL DIAGNOSIS',
        'diagnosticVerification': '3. DIAGNOSTIC VERIFICATION',
        'shopInterrogation': '4. SHOP INTERROGATION',
        'conversationScripting': '5. CONVERSATION SCRIPTING',
        'costBreakdown': '6. COST BREAKDOWN',
        'ripoffDetection': '7. RIPOFF DETECTION',
        'authorizationGuide': '8. AUTHORIZATION GUIDE',
        'technicalEducation': '9. TECHNICAL EDUCATION',
        'oemPartsStrategy': '10. OEM PARTS STRATEGY',
        'negotiationTactics': '11. NEGOTIATION TACTICS',
        'likelyCausesRanked': '12. LIKELY CAUSES (RANKED)',
        'recommendations': '13. RECOMMENDATIONS',
        'sourceVerification': '14. SOURCE VERIFICATION',
        'nextStepsSummary': '15. NEXT STEPS SUMMARY'
      };

      let renderedSections = 0;

      sectionOrder.forEach(key => {
        const content = analysis[key];
        const title = sectionTitles[key];

        if (content || key === 'nextStepsSummary') {
          // Clean the content
          const cleanedContent = this.validator.cleanSectionContent(content);

          // Render section
          this.typographer.renderSection({
            title: title,
            content: cleanedContent || this.getDefaultContent(key),
            format: this.getFormatType(key)
          });

          renderedSections++;
        }
      });

      console.log(`📊 Rendered ${renderedSections} sections`);

      // Step 7: Add disclaimer (on new page)
      this.doc.addPage();
      this.pageCount = this.doc.bufferedPageRange().count;
      console.log(`📄 Page ${this.pageCount}: Disclaimer`);

      this.typographer = new TypographyManager(this.doc);
      this.typographer.renderHeading1('Disclaimer & Legal Notice');
      this.typographer.renderParagraph(
        'This report is generated by the DiagnosticPro AI platform, built by Intent Solutions.\n\n' +
        'It is intended strictly for informational purposes and consumer protection guidance. ' +
        'It does not replace diagnosis or repair advice from a licensed automotive professional.\n\n' +
        'DiagnosticPro and Intent Solutions assume no liability for decisions made based on this report. ' +
        'Customers are advised to verify all findings with certified repair shops and follow manufacturer service bulletins.\n\n' +
        `© ${new Date().getFullYear()} DiagnosticPro. All rights reserved.`
      );

      // Step 8: Add headers and footers
      this.addHeadersAndFooters();

      // Step 9: Finalize PDF
      const finalPageCount = this.doc.bufferedPageRange().count;

      console.log('\n🎯 PDF GENERATION COMPLETE');
      console.log(`   Total pages: ${finalPageCount}`);
      console.log(`   Sections rendered: ${renderedSections}`);
      console.log(`   Critical sections present: ${validation.hasCriticalSections}`);

      // Check for page count issues
      if (finalPageCount > 25) {
        console.error(`⚠️ WARNING: Excessive pages (${finalPageCount})! Investigating...`);
      }

      this.doc.end();

      return stream;

    } catch (error) {
      console.error('PDF Generation Failed:', error);
      throw error;
    }
  }

  addHeadersAndFooters() {
    const range = this.doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = range.start; i < range.start + totalPages; i++) {
      this.doc.switchToPage(i);

      this.doc.save();

      // Header — lineBreak:false prevents pdfkit from auto-paginating
      this.doc
        .font('IBMMono')
        .fontSize(9)
        .fillColor('gray')
        .text('DiagnosticPro — Proprietary AI Diagnostic Report', 54, 30, {
          align: 'center',
          lineBreak: false
        });

      // Footer disclaimer
      this.doc
        .fontSize(7)
        .text(
          'Disclaimer: AI-generated for informational purposes only.',
          54,
          this.doc.page.height - 50,
          {
            lineBreak: false
          }
        );

      // Page number
      this.doc
        .fontSize(9)
        .text(`Page ${i + 1}`, this.doc.page.width - 126, this.doc.page.height - 30, {
          lineBreak: false
        });

      this.doc.restore();
    }
  }

  getFormatType(key) {
    const bulletListSections = [
      'differentialDiagnosis',
      'shopInterrogation',
      'costBreakdown',
      'ripoffDetection',
      'technicalEducation',
      'oemPartsStrategy',
      'negotiationTactics',
      'likelyCausesRanked',
      'recommendations',
      'sourceVerification',
      'nextStepsSummary'
    ];

    return bulletListSections.includes(key) ? 'bullet_list' : 'narrative';
  }

  getDefaultContent(key) {
    const defaults = {
      'nextStepsSummary': [
        'Review the primary diagnosis and schedule the recommended diagnostic verification tests',
        'Get a second quote using the cost breakdown and negotiation tactics provided in this report',
        'Contact support@diagnosticpro.io if you need further assistance with your diagnosis'
      ],
      'primaryDiagnosis':
        'Primary diagnosis pending detailed analysis of symptoms and error codes.',
      'differentialDiagnosis': [
        'Alternative cause 1: Component wear',
        'Alternative cause 2: System malfunction',
        'Alternative cause 3: Sensor failure'
      ]
    };

    return defaults[key] || 'Analysis pending. Please consult with a certified technician.';
  }
}

// ============================================
// EXPORT FUNCTION
// ============================================

const {
  canRenderWhiteglove,
  generateWhiteglovePDF,
} = require('./reportWhiteglove.js');

/**
 * Generate a diagnostic PDF.
 *
 * Preferred path: /whiteglove-pdf standards (markdown → pandoc + xelatex,
 * booktabs/titlesec/widow-orphan). Fallback: legacy pdfkit generator when
 * pandoc/xelatex are unavailable (local unit tests without TeX).
 *
 * Always writes `filePath` and resolves when the file is complete.
 * Returns { path, engine, bytes } for callers (no longer a Node stream).
 */
async function generateDiagnosticProPDF(submission, analysis, filePath) {
  const forcePdfkit = process.env.PDF_ENGINE === 'pdfkit';

  if (!forcePdfkit && canRenderWhiteglove()) {
    console.log('[pdf] engine=whiteglove (pandoc + LaTeX)');
    const result = generateWhiteglovePDF(submission, analysis, filePath);
    console.log(`[pdf] whiteglove wrote ${result.bytes} bytes via ${result.engine}`);
    return { path: filePath, engine: result.engine, bytes: result.bytes };
  }

  console.log('[pdf] engine=pdfkit (legacy fallback — install pandoc+xelatex for whiteglove)');
  const generator = new DiagnosticPDFGenerator();
  const stream = await generator.generatePDF(submission, analysis, filePath);
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  const bytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  return { path: filePath, engine: 'pdfkit', bytes };
}

module.exports = {
  generateDiagnosticProPDF,
  canRenderWhiteglove,
};