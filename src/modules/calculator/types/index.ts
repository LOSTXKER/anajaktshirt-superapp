// DTG Calculator Types

export interface DTGSettings {
  INK_COST_PER_CC: number;
  PRETREAT_1_SIDE: number;
  PRETREAT_2_SIDES: number;
  NECK_LOGO_COST: number;
  SLEEVE_PRINT_COST: number;
  WHITE_TSHIRT_DISCOUNT: number;
  PROFIT_MARGIN: number;
  MIN_SELL_PRICE: number;
  WHITE_TSHIRT_PRICE_CAP: number;
  DISCOUNT_TIER_30: number;
  DISCOUNT_TIER_50: number;
  DISCOUNT_TIER_100: number;
  WHITE_MIN_A7_A5: number;
  WHITE_MIN_A4_A3: number;
  WHITE_MIN_A2: number;
  WHITE_ADD_A7_A5: number;
  WHITE_ADD_A4_A3: number;
  WHITE_ADD_A2: number;
}

export const DEFAULT_SETTINGS: DTGSettings = {
  INK_COST_PER_CC: 16,
  PRETREAT_1_SIDE: 40,
  PRETREAT_2_SIDES: 70,
  NECK_LOGO_COST: 30,
  SLEEVE_PRINT_COST: 70,
  WHITE_TSHIRT_DISCOUNT: 40,
  PROFIT_MARGIN: 1.30,
  MIN_SELL_PRICE: 100,
  WHITE_TSHIRT_PRICE_CAP: 300,
  DISCOUNT_TIER_30: 5,
  DISCOUNT_TIER_50: 10,
  DISCOUNT_TIER_100: 15,
  WHITE_MIN_A7_A5: 100,
  WHITE_MIN_A4_A3: 150,
  WHITE_MIN_A2: 180,
  WHITE_ADD_A7_A5: 50,
  WHITE_ADD_A4_A3: 80,
  WHITE_ADD_A2: 100,
};

export type ShirtColor = 'white' | 'dark';
export type PrintSides = '1' | '2';
export type SideChoice = 'front' | 'back';
export type PrintSize = 'A7' | 'A6' | 'A5' | 'A4' | 'A3' | 'A2';

export interface ScreenInputs {
  quantity: number;
  inkCC: number;
  color: ShirtColor;
  sides: PrintSides;
  sideChoice: SideChoice;
  sizeFront: PrintSize;
  sizeBack: PrintSize;
  hasNeckLogo: boolean;
  sleevePrintCount: number;
}

export interface CalculationResult {
  screenPricePerItem: number;
  details: string[];
  discountText: string;
  discountRate: number;
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    main_sku: string;
    model?: string;
    color?: string;
    size?: string;
    sell_price: number;
    cost_price: number;
  };
  quantity: number;
}

export interface CalculationGroup {
  id: string;
  name: string;
  items: CartItem[];
  screenInputs: ScreenInputs;
}

export interface GroupResult {
  group: CalculationGroup;
  totalQuantity: number;
  totalShirtPrice: number;
  totalScreenPrice: number;
  subTotal: number;
  averagePricePerItem: number;
  screenPriceResult: CalculationResult;
}

export const PRINT_SIZES: PrintSize[] = ['A7', 'A6', 'A5', 'A4', 'A3', 'A2'];

export const SIZE_ORDER: Record<PrintSize, number> = {
  'A7': 1,
  'A6': 2,
  'A5': 3,
  'A4': 4,
  'A3': 5,
  'A2': 6,
};

