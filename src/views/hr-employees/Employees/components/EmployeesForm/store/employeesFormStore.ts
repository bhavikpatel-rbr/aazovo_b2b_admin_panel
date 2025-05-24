import { create } from 'zustand'

export type CompanyFormState = {
}

type CompanyFormAction = {

}

const initialState: CompanyFormState = {
}

export const useCompanyFormStore = create<CompanyFormState & CompanyFormAction>(
    (set) => ({
    }),
)
