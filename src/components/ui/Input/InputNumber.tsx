// src/components/ui/InputNumber/index.tsx

import React, {
    useState,
    useCallback,
    useRef,
    useEffect,
    forwardRef,
} from 'react';
import classNames from 'classnames';
import { useConfig } from '../ConfigProvider';
import { useForm, useFormItem } from '../Form/context';
import { useInputGroup } from '../InputGroup/context';
import Input from '../Input'; // Import the base Input component
import Button from '../Button'; // Need buttons for controls
import { TbChevronUp, TbChevronDown, TbCircle } from 'react-icons/tb'; // Icons for controls and clear
import { CONTROL_SIZES } from '../utils/constants';
import isNil from 'lodash/isNil';
import type { CommonProps, TypeAttributes } from '../@types/common';
import type { InputHTMLAttributes, ReactNode } from 'react';

// Define the props for the InputNumber component
export interface InputNumberProps extends
    CommonProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'type' | 'value' | 'defaultValue' | 'onChange'>
{
    // Value should be number, null, or undefined
    value?: number | null | undefined;
    defaultValue?: number | null | undefined;
    // onChange should receive number, null, or undefined
    onChange?: (value: number | null | undefined) => void;
    // Number-specific props
    step?: number; // How much to increment/decrement
    min?: number; // Minimum allowed value
    max?: number; // Maximum allowed value
    precision?: number; // Number of decimal places
    // Optional controls/features
    prefix?: string | ReactNode; // Pass through to Input
    suffix?: string | ReactNode; // Pass through to Input
    size?: TypeAttributes.ControlSize; // Control size
    disabled?: boolean; // Disabled state
    invalid?: boolean; // Invalid state
    readOnly?: boolean; // ReadOnly state
    isClearable?: boolean; // Show a clear button
    // Control button appearance/positioning - let's default to vertical buttons on the right
    // buttonType?: 'vertical' | 'horizontal' | 'none';
}

// Helper to round to specified precision
const toPrecision = (num: number, precision?: number): number => {
    if (precision === undefined) {
        return num;
    }
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
};

const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>((props, ref) => {
    const {
        className,
        value,
        defaultValue,
        onChange,
        step = 1,
        min = -Infinity, // Default min to negative infinity
        max = Infinity, // Default max to infinity
        precision,
        prefix,
        suffix,
        size,
        disabled,
        invalid,
        readOnly,
        isClearable = false, // Default isClearable to false
        style,
        ...rest
    } = props;

    const { controlSize, direction } = useConfig();
    const formControlSize = useForm()?.size;
    const formItemInvalid = useFormItem()?.invalid;
    const inputGroupSize = useInputGroup()?.size;

    // Determine the effective size and invalid state
    const inputSize = size || inputGroupSize || formControlSize || controlSize;
    const isInputInvalid = invalid || formItemInvalid;
    const isDisabled = disabled; // Use local var for clarity


    // State for the internal value display in the text input
    // We need to manage the string representation including temporary user input
    const [stringValue, setStringValue] = useState<string>(
        value === null || value === undefined ? '' : String(value) // Initialize string value from prop
    );

    // Use state to track the actual numeric value (number | null | undefined)
    // This state is synced with the `value` prop if controlled, or manages the internal value if uncontrolled.
    const [numberValue, setNumberValue] = useState<number | null | undefined>(value ?? defaultValue);

    // Sync internal numeric state with controlled `value` prop
    useEffect(() => {
        setNumberValue(value ?? defaultValue);
        setStringValue(value === null || value === undefined ? '' : String(value));
    }, [value, defaultValue]);


    // Callback to update both internal states and call external onChange
    const updateValue = useCallback((val: number | null | undefined) => {
        // Apply min/max bounds
        let clampedValue = val;
        if (typeof clampedValue === 'number') {
             clampedValue = Math.max(min, Math.min(max, clampedValue));
             // Apply precision
             clampedValue = toPrecision(clampedValue, precision);
         } else if (clampedValue === undefined) {
             // If value becomes undefined (e.g., parsing failed, but not empty)
             // We might want to keep the last valid numberValue or set to min/max
             // For simplicity, let's pass undefined if parsing yields NaN, and null if empty.
             // The input string value might not be a valid number, but numberValue should be.
         }

        // Update internal states
        setNumberValue(clampedValue);
        setStringValue(clampedValue === null || clampedValue === undefined ? '' : String(clampedValue));

        // Call external onChange
        if (onChange) {
            onChange(clampedValue);
        }
    }, [onChange, min, max, precision]);


    // --- Handlers for Input Field ---

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setStringValue(val); // Update string value immediately

        // Try to parse the string value
        if (val === '') {
            // Handle empty string
            updateValue(null);
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                // If successfully parsed to a number
                updateValue(num);
            } else {
                // If parsing failed (e.g., user typed "abc")
                // We keep the string value but the numeric value remains the last valid one
                // We might signal invalidity, but react-hook-form/FormItem handles this.
                // Do NOT call updateValue(undefined) here unless you want onChange to receive undefined for invalid input strings
                // For now, let's just update the string value and rely on form validation for numeric correctness.
                 // If using react-hook-form with zodResolver, it will validate the final form value.
                 // If NOT using react-hook-form, you might need to set internal error state here.
            }
        }
    }, [updateValue]); // Depend on updateValue


    const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // When blurring, force the value to be clamped and rounded to precision
        // This formats the display value as well
        const val = e.target.value;
        if (val === '') {
             updateValue(null);
        } else {
            const num = parseFloat(val);
             if (!isNaN(num)) {
                updateValue(num); // This will clamp and round
             } else {
                // If blurred with invalid text, revert to last valid numberValue string representation
                 setStringValue(numberValue === null || numberValue === undefined ? '' : String(numberValue));
                 // You might still call updateValue(undefined) here or onChange(undefined) if needed
             }
        }
        // Call original onBlur if provided
        if (rest.onBlur) {
            rest.onBlur(e);
        }
    }, [updateValue, rest.onBlur, numberValue]); // Depend on updateValue, onBlur, numberValue


    // --- Handlers for Increment/Decrement Buttons ---
    const handleIncrement = useCallback(() => {
        if (isDisabled || readOnly) return;
        // Start from 0 if current value is null or undefined
        const currentValue = numberValue ?? 0;
        const newValue = currentValue + step;
        updateValue(newValue);
    }, [numberValue, step, updateValue, isDisabled, readOnly]);

    const handleDecrement = useCallback(() => {
        if (isDisabled || readOnly) return;
        // Start from 0 if current value is null or undefined
        const currentValue = numberValue ?? 0;
        const newValue = currentValue - step;
        updateValue(newValue);
    }, [numberValue, step, updateValue, isDisabled, readOnly]);


    // --- Handler for Clear Button ---
    const handleClear = useCallback(() => {
        if (isDisabled || readOnly) return;
        updateValue(null); // Set value to null
         // Call original onChange/onClear if provided (no specific onClear prop defined, so just call updateValue)
    }, [updateValue, isDisabled, readOnly]);

    // --- Determine Button Disability ---
    const canIncrement = typeof numberValue === 'number' ? numberValue < max : true; // Can increment if not at max
    const canDecrement = typeof numberValue === 'number' ? numberValue > min : true; // Can decrement if not at min

    const disableIncrement = isDisabled || readOnly || !canIncrement;
    const disableDecrement = isDisabled || readOnly || !canDecrement;

    // --- Clear Button Visibility ---
    // Visible if isClearable is true, not disabled, not readOnly, and has a non-null/undefined value
    const showClearButton = isClearable && !isDisabled && !readOnly && (numberValue !== null && numberValue !== undefined);


    // --- Styling and Classes ---
    const inputDefaultClass = 'input'; // From base Input
    const inputSizeClass = `input-${inputSize} ${CONTROL_SIZES[inputSize].h}`; // From base Input
    const inputFocusClass = `focus:ring-primary focus-within:ring-primary focus-within:border-primary focus:border-primary`; // From base Input
    const inputWrapperClass = classNames('input-wrapper', 'input-number', className); // Add input-number class
    const inputClass = classNames(
        inputDefaultClass,
        inputSizeClass,
        !isInputInvalid && inputFocusClass,
        isDisabled && 'input-disabled',
        isInputInvalid && 'input-invalid',
        readOnly && 'input-readonly' // Add readonly class
    );

    // Calculate padding for prefix/suffix/buttons
    // Need refs for prefix and suffix elements, similar to base Input
    const prefixNode = useRef<HTMLDivElement>(null);
    const suffixNode = useRef<HTMLDivElement>(null); // This will contain buttons and maybe a custom suffix

    const [prefixGutter, setPrefixGutter] = useState(0);
    const [suffixGutter, setSuffixGutter] = useState(0); // Gutter for suffix area (buttons + potential custom suffix)

    const getAffixSize = useCallback(() => {
        if (!prefixNode.current && !suffixNode.current) {
            return;
        }
        const prefixNodeWidth = prefixNode?.current?.offsetWidth;
        const suffixNodeWidth = suffixNode?.current?.offsetWidth; // Get width of the entire suffix area

        if (isNil(prefixNodeWidth) && isNil(suffixNodeWidth)) {
            return;
        }

        if (prefixNodeWidth) {
            setPrefixGutter(prefixNodeWidth);
        }

        if (suffixNodeWidth) {
            setSuffixGutter(suffixNodeWidth);
        }
    }, [prefixNode, suffixNode]); // Depend on ref objects


    // Recalculate gutter when prefix/suffix/buttons change or size changes
    useEffect(() => {
        getAffixSize();
        // Need to re-calculate if size changes, affecting button size
        const observer = new ResizeObserver(() => {
             getAffixSize();
        });
        if(prefixNode.current) observer.observe(prefixNode.current);
        if(suffixNode.current) observer.observe(suffixNode.current);

        return () => {
            observer.disconnect();
        }

    }, [prefix, suffix, getAffixSize, inputSize]); // Depend on props and the calculation callback


    const remToPxConvertion = (pixel: number) => 0.0625 * pixel;

    const affixGutterStyle = () => {
        const leftGutter = `${remToPxConvertion(prefixGutter) + 1}rem`;
        const rightGutter = `${remToPxConvertion(suffixGutter) + 1}rem`; // Use suffix gutter
        const gutterStyle: { paddingLeft?: string; paddingRight?: string } = {};

        if (direction === 'ltr') {
            if (prefix) {
                gutterStyle.paddingLeft = leftGutter;
            }
            // Apply right padding for the entire suffix area (buttons + custom suffix)
            gutterStyle.paddingRight = rightGutter;

        } else { // RTL direction
            if (prefix) {
                gutterStyle.paddingRight = leftGutter;
            }
             // Apply left padding for the entire suffix area (buttons + custom suffix)
             gutterStyle.paddingLeft = rightGutter;
        }
        return gutterStyle;
    };


    // --- Render Structure ---
    return (
        <div className={inputWrapperClass}> {/* Main wrapper */}
            {prefix ? (
                <div ref={prefixNode} className="input-suffix-start">
                    {prefix}
                </div>
            ) : null}

            <Input
                className={inputClass} // Apply combined input styles
                style={{ ...affixGutterStyle(), ...style }} // Apply gutter padding and custom style
                value={stringValue} // Use the string value for the text input
                onChange={handleInputChange} // Handle input change to update value states
                onBlur={handleInputBlur} // Handle blur for formatting/clamping
                disabled={isDisabled}
                readOnly={readOnly}
                invalid={isInputInvalid}
                ref={ref} // Forward the ref to the underlying Input element
                type="text" // Always use type="text" for controlled formatting
                // Do not pass size, prefix, suffix, invalid, disabled as props to Input
                // as we handled them here and applied classes.
                // Pass through other HTML attributes
                {...rest}
            />

            {/* Suffix Area: Contains Buttons and Optional Custom Suffix */}
            <div ref={suffixNode} className="input-suffix-end input-number-controls"> {/* Add input-number-controls class */}
                 {/* Clear Button (Optional) */}
                {showClearButton && (
                    <Button
                        className="input-number-clear-button"
                        icon={<TbCircle />}
                        size={inputSize}
                        variant="plain"
                        shape="circle"
                        onClick={handleClear}
                        disabled={isDisabled || readOnly}
                         // aria-label="Clear" // Good for accessibility
                    />
                )}

                {/* Increment/Decrement Buttons */}
                <div className="input-number-buttons"> {/* Container for vertical buttons */}
                    <Button
                        className="input-number-btn-up"
                        icon={<TbChevronUp />}
                        size={inputSize}
                        variant="plain"
                        shape="square" // Or 'circle' if preferred and size allows
                        onClick={handleIncrement}
                        disabled={disableIncrement}
                         // aria-label="Increment value"
                    />
                     <Button
                        className="input-number-btn-down"
                        icon={<TbChevronDown />}
                        size={inputSize}
                        variant="plain"
                        shape="square" // Or 'circle' if preferred
                        onClick={handleDecrement}
                        disabled={disableDecrement}
                         // aria-label="Decrement value"
                    />
                </div>

                 {/* Optional Custom Suffix (appears next to buttons) */}
                {suffix && (
                     <div className="input-number-custom-suffix"> {/* Container for custom suffix */}
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    );
});

InputNumber.displayName = 'InputNumber';

export default InputNumber;

// Helper function (kept as it's used in ActionColumn)
// function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); } // Assuming this is a global helper or imported elsewhere