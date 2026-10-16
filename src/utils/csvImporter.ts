import { Product, Customer, ProductCategory } from '../types';
import { downloadCSV } from './csvExporter';

/**
 * Robust CSV parser that handles quotes, line breaks, commas or semicolons.
 */
export const parseCSVLines = (csvText: string): string[][] => {
  // Strip UTF-8 BOM if present
  const text = csvText.replace(/^\uFEFF/, '');
  const lines: string[][] = [];
  let curRow: string[] = [];
  let curVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
      curRow.push(curVal.trim());
      curVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      curRow.push(curVal.trim());
      if (curRow.some((cell) => cell.length > 0)) {
        lines.push(curRow);
      }
      curRow = [];
      curVal = '';
    } else {
      curVal += char;
    }
  }

  if (curVal.length > 0 || curRow.length > 0) {
    curRow.push(curVal.trim());
    if (curRow.some((cell) => cell.length > 0)) {
      lines.push(curRow);
    }
  }

  return lines;
};

// Map category Arabic names to system ProductCategory
const mapCategory = (rawCat: string): ProductCategory => {
  const catStr = rawCat.toLowerCase().trim();
  if (catStr.includes('رسمي') || catStr.includes('بدل') || catStr.includes('formal')) return 'formal';
  if (catStr.includes('شباب') || catStr.includes('عصري') || catStr.includes('youth')) return 'youth';
  if (catStr.includes('رجالي') || catStr.includes('كاجوال') || catStr.includes('men')) return 'mens';
  return rawCat.trim() || 'mens';
};

/**
 * Parse CSV text into Product objects
 */
export const parseProductsFromCSV = (csvText: string): { items: Omit<Product, 'id'>[]; errors: string[] } => {
  const rows = parseCSVLines(csvText);
  if (rows.length < 2) {
    return { items: [], errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات بعد رأس الجدول.'] };
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  // Column index detection
  const barcodeIdx = header.findIndex((h) => h.includes('باركود') || h.includes('barcode') || h.includes('كود'));
  const nameIdx = header.findIndex((h) => h.includes('اسم') || h.includes('صنف') || h.includes('title') || h.includes('name'));
  const categoryIdx = header.findIndex((h) => h.includes('قسم') || h.includes('تصنيف') || h.includes('category'));
  const brandIdx = header.findIndex((h) => h.includes('ماركة') || h.includes('علامة') || h.includes('brand'));
  const sizeIdx = header.findIndex((h) => h.includes('مقاس') || h.includes('size'));
  const colorIdx = header.findIndex((h) => h.includes('لون') || h.includes('color'));
  const costIdx = header.findIndex((h) => h.includes('تكلفة') || h.includes('cost'));
  const priceIdx = header.findIndex((h) => h.includes('بيع') || h.includes('سعر') || h.includes('price'));
  const stockIdx = header.findIndex((h) => h.includes('رصيد') || h.includes('كمية') || h.includes('مخزون') || h.includes('stock') || h.includes('qty'));

  const items: Omit<Product, 'id'>[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : `صنف مستورد #${idx + 1}`;
    const barcode = barcodeIdx >= 0 && row[barcodeIdx] ? row[barcodeIdx] : `AK-${Math.floor(100000 + Math.random() * 900000)}`;
    const category = categoryIdx >= 0 && row[categoryIdx] ? mapCategory(row[categoryIdx]) : 'mens';
    const brand = brandIdx >= 0 && row[brandIdx] ? row[brandIdx] : 'اخين AKHEN';
    const size = sizeIdx >= 0 && row[sizeIdx] ? row[sizeIdx] : 'L';
    const color = colorIdx >= 0 && row[colorIdx] ? row[colorIdx] : 'أسود';
    
    const costPriceStr = costIdx >= 0 ? row[costIdx].replace(/[^0-9.]/g, '') : '200';
    const costPrice = parseFloat(costPriceStr) || 200;

    const sellingPriceStr = priceIdx >= 0 ? row[priceIdx].replace(/[^0-9.]/g, '') : '400';
    const sellingPrice = parseFloat(sellingPriceStr) || 400;

    const stockStr = stockIdx >= 0 ? row[stockIdx].replace(/[^0-9.]/g, '') : '10';
    const stock = parseInt(stockStr, 10) || 10;

    if (!name || name.trim() === '') {
      errors.push(`الصف #${idx + 2}: اسم الصنف مفقود.`);
      return;
    }

    items.push({
      name,
      barcode,
      category,
      brand,
      size,
      color,
      costPrice,
      sellingPrice,
      stock,
      description: 'مستورد عبر ملف CSV',
    });
  });

  return { items, errors };
};

/**
 * Parse CSV text into Customer objects
 */
export const parseCustomersFromCSV = (
  csvText: string
): { items: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>[]; errors: string[] } => {
  const rows = parseCSVLines(csvText);
  if (rows.length < 2) {
    return { items: [], errors: ['الملف فارغ أو لا يحتوي على بيانات.'] };
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  const nameIdx = header.findIndex((h) => h.includes('اسم') || h.includes('عميل') || h.includes('name'));
  const phoneIdx = header.findIndex((h) => h.includes('هاتف') || h.includes('موبايل') || h.includes('واتساب') || h.includes('phone'));
  const nationalIdx = header.findIndex((h) => h.includes('قومي') || h.includes('رقم قومي') || h.includes('national'));
  const addressIdx = header.findIndex((h) => h.includes('عنوان') || h.includes('منطقة') || h.includes('address'));
  const notesIdx = header.findIndex((h) => h.includes('ملاحظات') || h.includes('notes'));

  const items: Omit<Customer, 'id' | 'totalPurchases' | 'invoicesCount' | 'createdAt'>[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx] : '';
    const phone = phoneIdx >= 0 && row[phoneIdx] ? row[phoneIdx] : '';
    const nationalId = nationalIdx >= 0 && row[nationalIdx] ? row[nationalIdx] : '';
    const address = addressIdx >= 0 && row[addressIdx] ? row[addressIdx] : '';
    const notes = notesIdx >= 0 && row[notesIdx] ? row[notesIdx] : 'مستورد من ملف CSV';

    if (!name.trim()) {
      errors.push(`الصف #${idx + 2}: اسم العميل فارغ.`);
      return;
    }

    items.push({
      name: name.trim(),
      phone: phone.trim() || '01000000000',
      nationalId: nationalId.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });
  });

  return { items, errors };
};

/**
 * Generate sample CSV template for Products import
 */
export const downloadProductsCSVTemplate = () => {
  const rows = [
    {
      'كود الباركود': 'AK-982103',
      'اسم صنف الملابس': 'بدلة رجالي تركي رسمية كاملة كحلي',
      'القسم': 'رسمي وبدل',
      'الماركة / العلامة': 'اخين AKHEN',
      'المقاس': '52',
      'اللون': 'كحلي غامق',
      'سعر التكلفة (ج.م)': 1800,
      'سعر البيع (ج.م)': 3400,
      'الرصيد المتاح (قطع)': 15,
    },
    {
      'كود الباركود': 'AK-481920',
      'اسم صنف الملابس': 'قميص أكسفورد قطن أبيض رجالي',
      'القسم': 'رجالي كاجوال',
      'الماركة / العلامة': 'اخين AKHEN',
      'المقاس': 'XL',
      'اللون': 'أبيض',
      'سعر التكلفة (ج.م)': 320,
      'سعر البيع (ج.م)': 650,
      'الرصيد المتاح (قطع)': 40,
    },
  ];

  downloadCSV('نموذج_استيراد_أصناف_المخزون_AKHEN', rows);
};

/**
 * Generate sample CSV template for Customers import
 */
export const downloadCustomersCSVTemplate = () => {
  const rows = [
    {
      'اسم العميل بالكامل': 'المهندس أحمد متولي',
      'رقم الهاتف (واتساب)': '01012345678',
      'الرقم القومي (للتقسيط)': '29801011200345',
      'العنوان / المنطقة': 'القاهرة - المعادي - شارع 9',
      'ملاحظات': 'عميل مميز V.I.P',
    },
    {
      'اسم العميل بالكامل': 'الأستاذ محمود إبراهيم',
      'رقم الهاتف (واتساب)': '01287654321',
      'الرقم القومي (للتقسيط)': '29505051400987',
      'العنوان / المنطقة': 'الجيزة - الدقي',
      'ملاحظات': 'يفضل التواصل واتساب',
    },
  ];

  downloadCSV('نموذج_استيراد_قاعدة_العملاء_AKHEN', rows);
};
