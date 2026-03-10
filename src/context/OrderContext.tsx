"use client";

import { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import { orderReducer, initialOrderState } from "./orderReducer";
import type { OrderState, OrderAction } from "./orderReducer";
import { SIZES, MIN_IN } from "@/lib/constants";
import { calcPrice } from "@/lib/pricing";
import type { PricingResult } from "@/lib/pricing";
import type { ModelData } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";

interface OrderContextValue {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  // Convenience methods
  onFile: (data: ModelData | null, err: string | null) => void;
  onClear: () => void;
  doSize: (preset: string) => void;
  doSlider: (value: string) => void;
  doColor: (color: ColorOption) => void;
  handleLogoClick: () => void;
  confirmOrder: () => void;
  // Derived state
  pricing: PricingResult | null;
  dimIn: string;
  canOrder: boolean;
  minScale: number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialOrderState);

  const minScale = state.model ? (MIN_IN * 25.4) / state.model.maxDimMm : 0.05;

  const onFile = useCallback((data: ModelData | null, err: string | null) => {
    if (err) { dispatch({ type: "FILE_ERROR", status: err }); return; }
    if (data) dispatch({ type: "FILE_LOADED", model: data });
  }, []);

  const onClear = useCallback(() => { dispatch({ type: "CLEAR" }); }, []);

  const doSize = useCallback((preset: string) => {
    dispatch({ type: "SET_SIZE", preset, scale: Math.max(SIZES[preset], minScale) });
  }, [minScale]);

  const doSlider = useCallback((value: string) => {
    const s = Math.max(parseFloat(value), minScale);
    let preset: string | null = null;
    if (Math.abs(s - 0.5) < 0.015) preset = "S";
    else if (Math.abs(s - 0.75) < 0.015) preset = "M";
    else if (Math.abs(s - 1) < 0.015) preset = "L";
    dispatch({ type: "SET_SCALE", scale: s, preset });
  }, [minScale]);

  const doColor = useCallback((c: ColorOption) => {
    dispatch({ type: "SET_COLOR", color: state.color?.id === c.id ? null : c });
  }, [state.color]);

  const handleLogoClick = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const confirmOrder = useCallback(() => {
    const orderNum = "YW-" + Math.random().toString(16).slice(2, 7).toUpperCase();
    dispatch({ type: "CONFIRM_ORDER", orderNum });
  }, []);

  const pricing = state.model
    ? calcPrice(state.model.volCm3, state.model.scaleFactor, state.scale, state.qty)
    : null;

  const dimIn = state.model
    ? (state.model.maxDimMm * state.model.scaleFactor * state.scale / 25.4).toFixed(1)
    : "0";

  const canOrder = !!(state.model && state.status === "ready" && state.color);

  const value = useMemo(() => ({
    state, dispatch,
    onFile, onClear, doSize, doSlider, doColor, handleLogoClick, confirmOrder,
    pricing, dimIn, canOrder, minScale,
  }), [state, onFile, onClear, doSize, doSlider, doColor, handleLogoClick, confirmOrder, pricing, dimIn, canOrder, minScale]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
