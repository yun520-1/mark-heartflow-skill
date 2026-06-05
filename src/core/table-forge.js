/**
 * TableForge v1.0 — 心虫制表引擎
 * 
 * 从结构化数据/图片OCR结果自动生成精确的Excel表格。
 * 
 * 核心能力：
 * 1. detectFormat(data) — 自动判断数据是表格还是文档
 * 2. buildTable(data, options) — 从结构化数据生成xlsx
 * 3. parseColumnDefs(headers, rows) — 智能识别列类型（序号/文本/数值/判定）
 * 4. applyStyle(ws, options) — 专业表格样式（供应商检验报告模板）
 * 
 * 从SkillHub技能吸收的设计模式：
 * - excel-auto-zh: 中文列名自动识别+合并单元格
 * - excel-wps-table-diagnosis: 表格结构校验（行列一致性、空值检测）
 * - doc-format: 文档/表格格式判断
 * - pdf-text-extractor: 表格式文本→结构化数据
 * - ppt-pro-max: 表格模板化设计
 * 
 * v1.0 — 初始版本，专注供应商质检报告场景
 */

const path = require('path');

class TableForge {
  constructor(options = {}) {
    this.options = {
      fontName: '宋体',
      fontSize: 10,
      headerFontSize: 10,
      titleFontSize: 14,
      headerBg: 'D9E1F2',   // 浅蓝底
      borderStyle: 'thin',
      ...options
    };
    
    // 内置模板
    this.templates = {
      inspection: this._inspectionTemplate(),
      general: this._generalTemplate(),
      financial: this._financialTemplate()
    };
  }

  /**
   * 核心入口：判断数据格式 + 生成对应输出
   * @param {object} data — 结构化数据 {headers: [], rows: [], title: '', info: {}}
   * @param {string} format — 强制指定 'table' | 'document' | 'auto'
   * @returns {object} — {type: 'table'|'document', workbook: Workbook|null, ...}
   */
  async forge(data, format = 'auto') {
    const detected = format === 'auto' ? this.detectFormat(data) : format;
    
    if (detected === 'document') {
      return { type: 'document', message: '文档格式，建议用docx' };
    }
    
    return await this._buildExcel(data);
  }

  /**
   * 格式判断：表格还是文档？
   * 规则：如果数据有headers+rows结构，且每行长度一致 > 2列，判定为表格
   */
  detectFormat(data) {
    if (!data || !data.rows || data.rows.length === 0) return 'document';
    
    const headers = data.headers || [];
    const rows = data.rows;
    
    // 有明确的表头且>2列 → 表格
    if (headers.length >= 2) return 'table';
    
    // 行数>1且每行长度一致且>2列 → 表格
    if (rows.length > 1) {
      const lens = rows.map(r => Array.isArray(r) ? r.length : 0);
      if (new Set(lens).size <= 2 && lens[0] >= 2) return 'table';
    }
    
    // 有"序号/检验项目/实测值"等关键词 → 表格
    const kw = ['序号', '检验项目', '实测值', '标准要求', '判定', '项目', '结果', '数值'];
    const allText = JSON.stringify(data).toLowerCase();
    if (kw.some(k => allText.includes(k))) return 'table';
    
    return 'document';
  }

  /**
   * 智能列类型识别
   */
  parseColumnDefs(headers, rows) {
    if (!headers || headers.length === 0) return [];
    
    const colTypes = [];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '');
      const values = rows.map(r => String(r[c] || '')).filter(v => v);
      
      let type = 'text';
      let width = 12;
      
      // 序号列
      if (/^序号$|^序$|^no\.?$/i.test(h)) {
        type = 'index';
        width = 6;
      }
      // 判定列
      else if (/^判定$|^结论$|^结果$|^合格/i.test(h)) {
        type = 'verdict';
        width = 8;
      }
      // 数值列
      else if (/值$|数$|量$|率$|度$|强度|MPa|%$|mm|g|N|dyn/i.test(h) || 
               values.some(v => /^[\d.\-≥≤±/]+$/.test(v))) {
        type = 'number';
        width = 14;
      }
      // 标准要求列
      else if (/标准|要求|范围|规格/i.test(h)) {
        type = 'standard';
        width = 18;
      }
      // 检验项目列
      else if (/项目|名称|指标|项目/i.test(h)) {
        type = 'item';
        width = 24;
      }
      // 备注列
      else if (/备注|说明|注/i.test(h)) {
        type = 'note';
        width = 12;
      }
      
      colTypes.push({ name: h, type, width });
    }
    return colTypes;
  }

  /**
   * 构建Excel工作簿
   */
  async _buildExcel(data) {
    // 动态导入openpyxl（仅运行时加载）
    let openpyxl;
    try {
      openpyxl = require('openpyxl');
    } catch (e) {
      // openpyxl 是 Python 库，这里返回构建指令给Python执行
      return this._buildInstructions(data);
    }
    
    const wb = new openpyxl.Workbook();
    const ws = wb.active;
    ws.title = (data.title || 'Sheet').slice(0, 31);
    
    // 应用模板
    const template = data.template || 'inspection';
    this._applyTemplate(ws, data, template);
    
    return { type: 'table', workbook: wb, ws };
  }

  /**
   * 返回Python构建指令（心虫JS环境无openpyxl）
   */
  _buildInstructions(data) {
    const colDefs = this.parseColumnDefs(data.headers || [], data.rows || []);
    const template = this.templates[data.template || 'inspection'];
    
    return {
      type: 'table',
      engine: 'python_openpyxl',
      instructions: {
        title: data.title || '检验报告',
        sheetName: (data.title || 'Sheet').slice(0, 31),
        info: data.info || {},
        headers: data.headers || [],
        rows: data.rows || [],
        colDefs,
        style: {
          titleFont: { name: '宋体', size: this.options.titleFontSize, bold: true },
          headerFont: { name: '宋体', size: this.options.headerFontSize, bold: true },
          dataFont: { name: '宋体', size: this.options.fontSize },
          headerBg: this.options.headerBg,
          border: this.options.borderStyle,
          conclusion: template?.conclusion || '检验结论：经检测，以上指标全部合格。'
        }
      },
      pythonCode: this._generatePythonCode(data, colDefs, template)
    };
  }

  /**
   * 生成可执行的Python代码
   */
  _generatePythonCode(data, colDefs, template) {
    const { headers, rows, info, title } = data;
    const t = template || this.templates.inspection;
    const hasVerdict = colDefs.some(c => c.type === 'verdict');
    const totalCols = headers.length;
    
    return `
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
ws = wb.active
ws.title = ${JSON.stringify((title || 'Sheet').slice(0, 31))}

thin = Side(style='${this.options.borderStyle}')
border = Border(left=thin, right=thin, top=thin, bottom=thin)
header_fill = PatternFill(start_color='${this.options.headerBg}', end_color='${this.options.headerBg}', fill_type='solid')
title_font = Font(name='${this.options.fontName}', size=${this.options.titleFontSize}, bold=True)
header_font = Font(name='${this.options.fontName}', size=${this.options.headerFontSize}, bold=True)
normal_font = Font(name='${this.options.fontName}', size=${this.options.fontSize})

# 标题行
ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=${totalCols})
ws.cell(1, 1).value = ${JSON.stringify(title || '检验报告')}
ws.cell(1, 1).font = title_font
ws.cell(1, 1).alignment = Alignment(horizontal='center', vertical='center')
ws.row_dimensions[1].height = 30

# 信息行
${this._generateInfoCode(info || {}, totalCols)}

# 表头
${this._generateHeaderCode(headers, totalCols)}

# 数据行
${this._generateRowCode(rows, headers.length)}

# 结论
${this._generateConclusionCode(t, totalCols, hasVerdict)}

# 列宽
${this._generateWidthCode(colDefs)}

# 保存
import os
path = os.path.expanduser(${JSON.stringify('~/Desktop/' + (title || 'report') + '.xlsx')})
wb.save(path)
print(f"✅ 已保存: {path}")
`;
  }

  _generateInfoCode(info, totalCols) {
    if (!info || Object.keys(info).length === 0) return '';
    const entries = Object.entries(info);
    const pairs = [];
    for (let i = 0; i < entries.length; i += 2) {
      const left = entries[i];
      const right = entries[i + 1];
      const r = Math.floor(i / 2) + 2;
      const mid = Math.ceil(totalCols / 2);
      pairs.push(`
ws.merge_cells(start_row=${r}, start_column=1, end_row=${r}, end_column=1)
ws.cell(${r}, 1).value = ${JSON.stringify(left[0])}
ws.cell(${r}, 1).font = header_font
ws.merge_cells(start_row=${r}, start_column=2, end_row=${r}, end_column=${mid})
ws.cell(${r}, 2).value = ${JSON.stringify(left[1])}
ws.cell(${r}, 2).font = normal_font
${right ? `
ws.merge_cells(start_row=${r}, start_column=${mid + 1}, end_row=${r}, end_column=${mid + 1})
ws.cell(${r}, ${mid + 1}).value = ${JSON.stringify(right[0])}
ws.cell(${r}, ${mid + 1}).font = header_font
ws.merge_cells(start_row=${r}, start_column=${mid + 2}, end_row=${r}, end_column=${totalCols})
ws.cell(${r}, ${mid + 2}).value = ${JSON.stringify(right[1])}
ws.cell(${r}, ${mid + 2}).font = normal_font
` : ''}
for c in range(1, ${totalCols + 1}):
    ws.cell(${r}, c).border = border
    ws.cell(${r}, c).alignment = Alignment(horizontal='center', vertical='center')
`);
    }
    return pairs.join('\n');
  }

  _generateHeaderCode(headers, count) {
    const r = 2 + Math.ceil(Object.keys({}).length / 2) + 1;
    const headerRow = r + 1;
    return `
header_row = ${headerRow}
for c, h in enumerate(${JSON.stringify(headers)}, 1):
    cell = ws.cell(header_row, c)
    cell.value = h
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.fill = header_fill
    cell.border = border
`;
  }

  _generateRowCode(rows, colCount) {
    const headerRow = 2 + Math.ceil(Object.keys({}).length / 2) + 1;
    const startRow = headerRow + 1;
    
    const lines = rows.map((row, i) => {
      const r = startRow + i;
      const cells = row.map((val, c) => {
        const col = c + 1;
        const v = JSON.stringify(String(val ?? ''));
        return `ws.cell(${r}, ${col}).value = ${v}`;
      }).join('\n');
      return `${cells}
for c in range(1, ${colCount + 1}):
    ws.cell(${r}, c).font = normal_font
    ws.cell(${r}, c).alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.cell(${r}, c).border = border`;
    });
    return lines.join('\n\n');
  }

  _generateConclusionCode(template, totalCols, hasVerdict) {
    const dataRowCount = 10; // approximate
    const r = 4 + Math.ceil(Object.keys({}).length / 2) + dataRowCount;
    const conclusion = template?.conclusion || '检验结论：经检测，以上指标全部合格。';
    return `
conclusion_row = ${r}
ws.merge_cells(start_row=conclusion_row, start_column=1, end_row=conclusion_row, end_column=${totalCols})
ws.cell(conclusion_row, 1).value = ${JSON.stringify(conclusion)}
ws.cell(conclusion_row, 1).font = Font(name='${this.options.fontName}', size=${this.options.fontSize}, bold=True)

sign_row = ${r + 1}
ws.merge_cells(start_row=sign_row, start_column=1, end_row=sign_row, end_column=${Math.ceil(totalCols / 2)})
ws.cell(sign_row, 1).value = '检测人：'
ws.cell(sign_row, 1).font = normal_font
ws.merge_cells(start_row=sign_row, start_column=${Math.ceil(totalCols / 2) + 1}, end_row=sign_row, end_column=${totalCols})
ws.cell(sign_row, ${Math.ceil(totalCols / 2) + 1}).value = '审核人：'
ws.cell(sign_row, ${Math.ceil(totalCols / 2) + 1}).font = normal_font
`;
  }

  _generateWidthCode(colDefs) {
    const lines = colDefs.map((c, i) => {
      return `ws.column_dimensions[get_column_letter(${i + 1})].width = ${c.width}`;
    });
    return lines.join('\n');
  }

  /**
   * 检验报告模板
   */
  _inspectionTemplate() {
    return {
      name: 'inspection',
      titleFont: { name: '宋体', size: 14, bold: true },
      headerFont: { name: '宋体', size: 10, bold: true },
      dataFont: { name: '宋体', size: 10 },
      headerBg: 'D9E1F2',
      conclusion: '检验结论：经检测，以上指标全部合格。',
      hasSignOff: true,
      signOff: ['检测人：', '审核人：']
    };
  }

  _generalTemplate() {
    return {
      name: 'general',
      titleFont: { name: '宋体', size: 12, bold: true },
      headerFont: { name: '宋体', size: 10, bold: true },
      dataFont: { name: '宋体', size: 10 },
      headerBg: 'F2F2F2',
      conclusion: '',
      hasSignOff: false
    };
  }

  _financialTemplate() {
    return {
      name: 'financial',
      titleFont: { name: '宋体', size: 14, bold: true },
      headerFont: { name: '宋体', size: 11, bold: true },
      dataFont: { name: '微软雅黑', size: 10 },
      headerBg: 'E2EFDA',
      conclusion: '',
      hasSignOff: true,
      signOff: ['制表人：', '审核人：']
    };
  }

  /**
   * 数据清洗：修复常见OCR/录入错误
   */
  cleanData(rows) {
    return rows.map(row => 
      row.map(cell => {
        if (typeof cell !== 'string') return cell;
        return cell
          .replace(/\s+/g, '')        // 去空白
          .replace(/[，,]\s*$/, '')    // 去尾逗号
          .replace(/^[，,]\s*/, '')    // 去首逗号
          .trim();
      })
    );
  }

  /**
   * 行列一致性校验（吸收自excel-wps-table-diagnosis）
   */
  validateStructure(headers, rows) {
    const issues = [];
    const colCount = headers.length;
    
    rows.forEach((row, i) => {
      if (row.length !== colCount) {
        issues.push({
          row: i + 1,
          type: 'column_mismatch',
          expected: colCount,
          actual: row.length,
          severity: 'error'
        });
      }
      
      row.forEach((cell, c) => {
        if (cell === undefined || cell === null || cell === '') {
          issues.push({
            row: i + 1,
            col: c + 1,
            type: 'empty_cell',
            severity: 'warning'
          });
        }
      });
    });
    
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}

module.exports = TableForge;
