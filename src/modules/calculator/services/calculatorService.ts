import {
  DTGSettings,
  ScreenInputs,
  CalculationResult,
  PrintSize,
  SIZE_ORDER,
} from '../types';

/**
 * คำนวณราคาค่าสกรีน DTG
 * สูตรเดียวกับ calculate dtg.html v11.1
 */
export function calculateScreenPrice(
  inputs: ScreenInputs,
  settings: DTGSettings
): CalculationResult {
  const {
    color,
    sides,
    inkCC,
    quantity,
    hasNeckLogo,
    sleevePrintCount,
    sizeFront,
    sizeBack,
    sideChoice,
  } = inputs;

  const details: string[] = [];

  // 1. คำนวณต้นทุนสกรีน
  const pretreatCost = sides === '1' ? settings.PRETREAT_1_SIDE : settings.PRETREAT_2_SIDES;
  const neckLogoCost = hasNeckLogo ? settings.NECK_LOGO_COST : 0;
  const sleeveCost = sleevePrintCount * settings.SLEEVE_PRINT_COST;
  const rawScreenCost = (inkCC * settings.INK_COST_PER_CC) + pretreatCost + neckLogoCost + sleeveCost;

  let addonsDetail: string[] = [];
  if (hasNeckLogo) addonsDetail.push(`โลโก้คอ ${neckLogoCost}`);
  if (sleevePrintCount > 0) addonsDetail.push(`สกรีนแขน ${sleeveCost}`);
  const addonsString = addonsDetail.length > 0 ? ` + ${addonsDetail.join(' + ')}` : '';

  details.push(`ต้นทุนสกรีน: (หมึก ${inkCC}cc × ${settings.INK_COST_PER_CC}) + รองพื้น ${pretreatCost}${addonsString} = ${rawScreenCost.toFixed(2)} บ.`);

  // 2. หัก 15%
  const costAfter15 = rawScreenCost * 0.85;
  details.push(`หัก 15%: ${costAfter15.toFixed(2)} บ.`);

  // 3. ปัดขึ้นหลักสิบ
  const finalScreenCost = Math.ceil(costAfter15 / 10) * 10;
  details.push(`ปัดขึ้นหลักสิบ ⇒ ${finalScreenCost} บ.`);

  // 4. คำนวณราคาขายดิบ
  let sellRaw = finalScreenCost * settings.PROFIT_MARGIN;
  details.push(`ราคาขายสกรีนดิบ: ${finalScreenCost} × ${settings.PROFIT_MARGIN} = ${sellRaw.toFixed(2)} บ.`);

  // 5. ลดราคาถ้าเป็นเสื้อขาว
  if (color === 'white') {
    sellRaw -= settings.WHITE_TSHIRT_DISCOUNT;
    details.push(`เสื้อขาว ลด ${settings.WHITE_TSHIRT_DISCOUNT} บ. ⇒ ${sellRaw.toFixed(2)} บ.`);
  }

  // 6. ปัดขึ้นหลักสิบ
  let priceBeforeDiscount = Math.ceil(sellRaw / 10) * 10;
  details.push(`ปัดขึ้นหลักสิบ ⇒ ${priceBeforeDiscount} บ.`);

  // 7. ตรวจสอบราคาขั้นต่ำ/สูงสุด
  if (color === 'white') {
    // จำกัดราคาสูงสุดเสื้อขาว
    if (priceBeforeDiscount > settings.WHITE_TSHIRT_PRICE_CAP) {
      priceBeforeDiscount = settings.WHITE_TSHIRT_PRICE_CAP;
      details.push(`⚠️ จำกัดราคาเสื้อขาวไม่เกิน ${settings.WHITE_TSHIRT_PRICE_CAP} บ.`);
    }

    // คำนวณราคาขั้นต่ำตามขนาดสกรีน
    const getWhiteShirtPriceBySize = (size: PrintSize, type: 'min' | 'add'): number => {
      const smallSizes: PrintSize[] = ['A7', 'A6', 'A5'];
      const mediumSizes: PrintSize[] = ['A4', 'A3'];

      if (type === 'min') {
        if (smallSizes.includes(size)) return settings.WHITE_MIN_A7_A5;
        if (mediumSizes.includes(size)) return settings.WHITE_MIN_A4_A3;
        if (size === 'A2') return settings.WHITE_MIN_A2;
      } else {
        if (smallSizes.includes(size)) return settings.WHITE_ADD_A7_A5;
        if (mediumSizes.includes(size)) return settings.WHITE_ADD_A4_A3;
        if (size === 'A2') return settings.WHITE_ADD_A2;
      }
      return 0;
    };

    let newMinPrice = 0;
    let minPriceDetail = '';

    if (sides === '1') {
      const printSize = sideChoice === 'front' ? sizeFront : sizeBack;
      newMinPrice = getWhiteShirtPriceBySize(printSize, 'min');
      minPriceDetail = `(ขนาด ${printSize})`;
    } else {
      // 2 ด้าน - ใช้ด้านใหญ่เป็นราคาหลัก + ด้านเล็กบวกเพิ่ม
      let largerSize: PrintSize, smallerSize: PrintSize;
      if (SIZE_ORDER[sizeFront] >= SIZE_ORDER[sizeBack]) {
        largerSize = sizeFront;
        smallerSize = sizeBack;
      } else {
        largerSize = sizeBack;
        smallerSize = sizeFront;
      }
      const priceSide1 = getWhiteShirtPriceBySize(largerSize, 'min');
      const priceSide2 = getWhiteShirtPriceBySize(smallerSize, 'add');
      newMinPrice = priceSide1 + priceSide2;
      minPriceDetail = `(ด้านใหญ่ ${largerSize} + ด้านเล็ก ${smallerSize})`;
    }

    details.push(`ตรวจสอบราคาขั้นต่ำเสื้อขาว ${minPriceDetail}: ${newMinPrice} บ.`);

    if (priceBeforeDiscount < newMinPrice) {
      priceBeforeDiscount = newMinPrice;
      details.push(`⚠️ บังคับใช้ราคาขั้นต่ำตามขนาดสกรีน ⇒ ${priceBeforeDiscount} บ.`);
    }
  } else {
    // เสื้อสีเข้ม - ใช้ราคาขั้นต่ำทั่วไป
    if (priceBeforeDiscount < settings.MIN_SELL_PRICE) {
      priceBeforeDiscount = settings.MIN_SELL_PRICE;
      details.push(`⚠️ บังคับราคาขั้นต่ำ ${settings.MIN_SELL_PRICE} บ.`);
    }
  }

  // 8. คำนวณส่วนลดตามจำนวน
  let discountRate = 0;
  if (quantity >= 100) {
    discountRate = settings.DISCOUNT_TIER_100 / 100;
  } else if (quantity >= 50) {
    discountRate = settings.DISCOUNT_TIER_50 / 100;
  } else if (quantity >= 30) {
    discountRate = settings.DISCOUNT_TIER_30 / 100;
  }

  const screenPriceAfterDiscount = priceBeforeDiscount * (1 - discountRate);

  let discountText = 'ไม่มีส่วนลดตามจำนวน';
  if (discountRate > 0) {
    discountText = `ส่วนลด ${discountRate * 100}% (สั่ง ${quantity} ตัว)`;
    details.push(`✅ ${discountText}: ${priceBeforeDiscount} × ${(1 - discountRate).toFixed(2)} = ${screenPriceAfterDiscount.toFixed(2)} บ.`);
  }

  return {
    screenPricePerItem: screenPriceAfterDiscount,
    details,
    discountText,
    discountRate,
  };
}

/**
 * สร้างข้อความสรุปราคาสำหรับส่งลูกค้า
 */
export function generateSummaryText(
  mode: 'screen-only' | 'shirt-screen',
  inputs: ScreenInputs,
  result: CalculationResult,
  items?: { name: string; size: string; color: string; quantity: number; sellPrice: number }[]
): string {
  const lines: string[] = [];
  const colorText = inputs.color === 'white' ? 'เสื้อสีขาว' : 'เสื้อสีเข้ม/ดำ';

  if (mode === 'screen-only') {
    lines.push('📋 สรุปราคา (เฉพาะค่าสกรีน)');
    lines.push('═══════════════════════');
    lines.push(`สีเสื้อ: ${colorText}`);
    lines.push(`จำนวน: ${inputs.quantity} ตัว`);

    // ขนาดสกรีน
    let sizeText = '';
    if (inputs.sides === '1') {
      const printSize = inputs.sideChoice === 'front' ? inputs.sizeFront : inputs.sizeBack;
      sizeText = `${inputs.sideChoice === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'} ${printSize}`;
    } else {
      sizeText = `หน้า ${inputs.sizeFront}, หลัง ${inputs.sizeBack}`;
    }
    lines.push(`ขนาดสกรีน: ${sizeText}`);

    // ส่วนเสริม
    const addons: string[] = [];
    if (inputs.hasNeckLogo) addons.push('สกรีนโลโก้คอ');
    if (inputs.sleevePrintCount > 0) addons.push(`สกรีนแขน (${inputs.sleevePrintCount} ตำแหน่ง)`);
    if (addons.length > 0) lines.push(`เพิ่มเติม: ${addons.join(', ')}`);

    lines.push('───────────────────────');
    lines.push(`💰 ราคาค่าสกรีนต่อตัว: ${result.screenPricePerItem.toFixed(2)} บาท`);
    if (result.discountRate > 0) {
      lines.push(`(มี${result.discountText}แล้ว)`);
    }

    const totalScreenPrice = result.screenPricePerItem * inputs.quantity;
    lines.push(`💵 ยอดรวมค่าสกรีน: ${totalScreenPrice.toFixed(2)} บาท`);
  } else if (mode === 'shirt-screen' && items) {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalShirtPrice = items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const totalScreenPrice = result.screenPricePerItem * totalQuantity;
    const grandTotal = totalShirtPrice + totalScreenPrice;
    const avgPrice = grandTotal / totalQuantity;

    lines.push('📋 สรุปราคา (เสื้อพร้อมสกรีน)');
    lines.push('═══════════════════════');
    lines.push(`จำนวนรวม: ${totalQuantity} ตัว`);
    lines.push('');
    lines.push('รายการเสื้อ:');
    items.forEach(item => {
      lines.push(`  • ${item.name} (${item.size} - ${item.color}) × ${item.quantity}`);
    });
    lines.push('');

    // ขนาดสกรีน
    let sizeText = '';
    if (inputs.sides === '1') {
      const printSize = inputs.sideChoice === 'front' ? inputs.sizeFront : inputs.sizeBack;
      sizeText = `${inputs.sideChoice === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'} ${printSize}`;
    } else {
      sizeText = `หน้า ${inputs.sizeFront}, หลัง ${inputs.sizeBack}`;
    }
    lines.push(`ขนาดสกรีน: ${sizeText}`);

    // ส่วนเสริม
    const addons: string[] = [];
    if (inputs.hasNeckLogo) addons.push('สกรีนโลโก้คอ');
    if (inputs.sleevePrintCount > 0) addons.push(`สกรีนแขน (${inputs.sleevePrintCount} ตำแหน่ง)`);
    if (addons.length > 0) lines.push(`เพิ่มเติม: ${addons.join(', ')}`);

    lines.push('───────────────────────');
    lines.push(`👕 ราคารวมเสื้อ: ${totalShirtPrice.toFixed(2)} บาท`);
    lines.push(`🎨 ราคาค่าสกรีน: ${result.screenPricePerItem.toFixed(2)} บาท/ตัว`);
    if (result.discountRate > 0) {
      lines.push(`   (มี${result.discountText}แล้ว)`);
    }
    lines.push(`🎨 รวมค่าสกรีน: ${totalScreenPrice.toFixed(2)} บาท`);
    lines.push('═══════════════════════');
    lines.push(`💵 ยอดรวมทั้งหมด: ${grandTotal.toFixed(2)} บาท`);
    lines.push(`📊 เฉลี่ยตัวละ: ${avgPrice.toFixed(2)} บาท`);
  }

  lines.push('');
  lines.push('─ Anajak T-Shirt ─');

  return lines.join('\n');
}

