import { create } from "zustand";
// import type { ProductOption, Products, SelectedProduct } from '../types'

export type MemberFormState = {};

type MemberFormAction = {};

const initialState: MemberFormState = {
  productList: [],
  productOption: [],
  selectedProduct: [],
};

export const useMemberFormStore = create<MemberFormState & MemberFormAction>(
  (set) => ({})
);
