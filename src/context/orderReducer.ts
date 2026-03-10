import type { ModelData, PageState } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";

export interface OrderState {
  page: PageState;
  model: ModelData | null;
  status: string | null;
  sizePreset: string | null;
  scale: number;
  color: ColorOption | null;
  qty: number;
  orderNum: string;
}

export const initialOrderState: OrderState = {
  page: "configure",
  model: null,
  status: null,
  sizePreset: "L",
  scale: 1,
  color: null,
  qty: 1,
  orderNum: "",
};

export type OrderAction =
  | { type: "SET_PAGE"; page: PageState }
  | { type: "FILE_LOADED"; model: ModelData }
  | { type: "FILE_ERROR"; status: string }
  | { type: "SET_SIZE"; preset: string; scale: number }
  | { type: "SET_SCALE"; scale: number; preset: string | null }
  | { type: "SET_COLOR"; color: ColorOption | null }
  | { type: "SET_QTY"; qty: number }
  | { type: "CONFIRM_ORDER"; orderNum: string }
  | { type: "CLEAR" };

export function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "FILE_LOADED":
      return { ...state, model: action.model, status: "ready", sizePreset: "L", scale: 1, color: null, qty: 1 };
    case "FILE_ERROR":
      return { ...state, model: null, status: action.status };
    case "SET_SIZE":
      return { ...state, sizePreset: action.preset, scale: action.scale };
    case "SET_SCALE":
      return { ...state, scale: action.scale, sizePreset: action.preset };
    case "SET_COLOR":
      return { ...state, color: action.color };
    case "SET_QTY":
      return { ...state, qty: action.qty };
    case "CONFIRM_ORDER":
      return { ...state, orderNum: action.orderNum, page: "confirmed" };
    case "CLEAR":
      return { ...initialOrderState };
    default:
      return state;
  }
}
