// src/views/your-path/formBuilderStore.ts
import type { FormBuilderItem } from './FormBuilder';
import { initialDummyForms as originalInitialDummyForms } from './FormBuilder';

let globalFormsData: FormBuilderItem[] | undefined = undefined; // Initialize as undefined
let listeners: (() => void)[] = [];

function initializeGlobalFormsData() {
    if (globalFormsData === undefined) {
        // This check is crucial for debugging if the issue is more complex
        if (typeof originalInitialDummyForms === 'undefined') {
            console.error(
                "CRITICAL ERROR in formBuilderStore: originalInitialDummyForms is undefined at the point of initialization. " +
                "This indicates a severe circular dependency or module loading issue. " +
                "Ensure 'initialDummyForms' is exported correctly and directly in FormBuilder.tsx and not within a function or class that hasn't run yet."
            );
            // Fallback to an empty array to prevent further crashes, but the root cause needs fixing.
            globalFormsData = []; 
        } else {
            try {
                globalFormsData = JSON.parse(JSON.stringify(originalInitialDummyForms));
            } catch (error) {
                console.error("Error parsing or stringifying originalInitialDummyForms:", error);
                globalFormsData = []; // Fallback
            }
        }
    }
}

export const getFormsFromStore = (): FormBuilderItem[] => {
    initializeGlobalFormsData();
    // The non-null assertion operator (!) tells TypeScript that globalFormsData will not be null/undefined here.
    return globalFormsData!; 
};

export const getFormByIdFromStore = (id: string | number): FormBuilderItem | undefined => {
  initializeGlobalFormsData();
  return globalFormsData!.find(form => String(form.id) === String(id));
};

export const addFormToStore = (form: FormBuilderItem) => {
  initializeGlobalFormsData();
  const newForm = {
    ...form,
    id: form.id || `FORM${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by_name: "Current User (Store)",
    updated_by_role: "Creator (Store)"
  };
  // Prepend to the array
  globalFormsData = [newForm, ...globalFormsData!];
  notifyListeners();
  return newForm;
};

export const updateFormInStore = (updatedForm: FormBuilderItem) => {
  initializeGlobalFormsData();
  let found = false;
  globalFormsData = globalFormsData!.map(form => {
    if (String(form.id) === String(updatedForm.id)) {
      found = true;
      return {
        ...form, // Keep existing fields not in updatedForm
        ...updatedForm, // Override with new data
        updated_at: new Date().toISOString(),
        updated_by_name: "Current User (Store)", // Or get from actual user session
        updated_by_role: "Editor (Store)"
      };
    }
    return form;
  });
  if (!found) {
    console.error("Form to update not found in store:", updatedForm.id);
    // Optionally, add it if not found, or handle as an error
    // addFormToStore(updatedForm); // Example: if update implies create if not exists
    return undefined;
  }
  notifyListeners();
  return globalFormsData!.find(f => String(f.id) === String(updatedForm.id));
};

export const deleteFormFromStore = (formId: string | number): boolean => {
  initializeGlobalFormsData();
  const initialLength = globalFormsData!.length;
  globalFormsData = globalFormsData!.filter(form => String(form.id) !== String(formId));
  if (globalFormsData!.length < initialLength) {
    notifyListeners();
    return true;
  }
  return false;
};

export const cloneFormInStore = (itemToClone: FormBuilderItem): FormBuilderItem | undefined => {
    initializeGlobalFormsData();
    const now = new Date().toISOString();
    const clonedForm: FormBuilderItem = {
        ...(JSON.parse(JSON.stringify(itemToClone))), 
        id: `FORM${Date.now()}_CLONE`,
        form_name: `${itemToClone.form_name} (Clone)`,
        status: "draft", // Cloned forms usually start as draft
        created_at: now,
        updated_at: now,
        updated_by_name: "Cloner User (Store)",
        updated_by_role: "User (Store)"
    };
    globalFormsData = [clonedForm, ...globalFormsData!];
    notifyListeners();
    return clonedForm;
}

export const changeFormStatusInStore = (itemId: string | number, newStatus: string): FormBuilderItem | undefined => {
    initializeGlobalFormsData();
    let changedItem: FormBuilderItem | undefined;
    globalFormsData = globalFormsData!.map(f => {
        if (String(f.id) === String(itemId)) {
            changedItem = {
                ...f,
                status: newStatus,
                updated_at: new Date().toISOString(),
                updated_by_name: "Status Changer (Store)"
                // updated_by_role might also change or be set here
            };
            return changedItem;
        }
        return f;
    });
    if (changedItem) {
        notifyListeners();
    }
    return changedItem;
}


export const subscribeToStore = (listener: () => void) => {
  listeners.push(listener);
  // Return an unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => {
    try {
        listener();
    } catch (error) {
        console.error("Error in store listener:", error);
    }
  });
};

// For development/testing: allows re-initializing the store with fresh dummy data
export const resetFormsInStore = () => {
    if (typeof originalInitialDummyForms === 'undefined') {
        console.error("CRITICAL ERROR during resetFormsInStore: originalInitialDummyForms is undefined.");
        globalFormsData = [];
    } else {
        try {
            globalFormsData = JSON.parse(JSON.stringify(originalInitialDummyForms));
        } catch (error) {
            console.error("Error parsing or stringifying originalInitialDummyForms during reset:", error);
            globalFormsData = [];
        }
    }
    notifyListeners();
}

// Optional: You can call initializeGlobalFormsData() once at the very end of this file.
// This ensures it's initialized after all imports in this file are processed.
// However, the lazy approach (calling it inside each exported function) is generally more robust against subtle timing issues.
// initializeGlobalFormsData(); 