/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ComponentType, JSX, Ref } from 'react'
import { HiCheck, HiChevronDown, HiX } from 'react-icons/hi'
import type {
    ClassNamesConfig,
    GroupBase,
    OptionProps,
    Props as ReactSelectProps,
    StylesConfig,
} from 'react-select'
import ReactSelect, { components } from 'react-select'
import type { AsyncProps } from 'react-select/async'
import type { CreatableProps } from 'react-select/creatable'
import type { CommonProps, TypeAttributes } from '../@types/common'
import { useConfig } from '../ConfigProvider'
import { useForm, useFormItem } from '../Form/context'
import { useInputGroup } from '../InputGroup/context'
import Spinner from '../Spinner/Spinner'
import cn from '../utils/classNames'
import { CONTROL_SIZES } from '../utils/constants'

// You can place this CSS in your global stylesheet or use a CSS-in-JS solution.
// For demonstration, it's included here as a comment block.
/*
<style>
.custom-checkbox {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid #d1d5db; // gray-300
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .custom-checkbox {
    border: 1px solid #4b5563; // dark:gray-600
}

.custom-checkbox-checked {
    color: white;
    background-color: #3b82f6; // A sample primary color (blue-500)
    border-color: #3b82f6;
}

.select-option:hover .custom-checkbox {
    border-color: #3b82f6;
}
</style>
*/

const DefaultDropdownIndicator = () => {
    return (
        <div className="select-dropdown-indicator">
            <HiChevronDown />
        </div>
    )
}

interface DefaultClearIndicatorProps {
    innerProps: JSX.IntrinsicElements['div']
    ref: Ref<HTMLElement>
}

const DefaultClearIndicator = ({
    innerProps: { ref, ...restInnerProps },
}: DefaultClearIndicatorProps) => {
    return (
        <div {...restInnerProps} ref={ref}>
            <div className="select-clear-indicator">
                <HiX />
            </div>
        </div>
    )
}

interface DefaultLoadingIndicatorProps {
    selectProps: { themeColor?: string }
}

const DefaultLoadingIndicator = ({
    selectProps,
}: DefaultLoadingIndicatorProps) => {
    const { themeColor } = selectProps
    return (
        <Spinner className={`select-loading-indicatior text-${themeColor}`} />
    )
}

// DefaultOption remains for single select
const DefaultOption = components.Option;

// Custom Option component with a checkbox for multi-select
const CheckboxOption = <
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>,
>({
    children,
    isSelected,
    ...rest
}: OptionProps<Option, IsMulti, Group>) => {
    return (
        <DefaultOption {...rest}>
            <div className="flex items-center gap-x-2">
                <span
                    className={cn(
                        'custom-checkbox',
                        isSelected && 'custom-checkbox-checked',
                    )}
                >
                    <HiCheck className={cn(!isSelected && 'hidden')} />
                </span>
                <span>{children}</span>
            </div>
        </DefaultOption>
    )
}

export type SelectProps<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = CommonProps &
    ReactSelectProps<Option, IsMulti, Group> &
    AsyncProps<Option, IsMulti, Group> &
    CreatableProps<Option, IsMulti, Group> & {
        invalid?: boolean
        size?: TypeAttributes.ControlSize
        field?: any
        componentAs?: ComponentType
    }

function Select<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectProps<Option, IsMulti, Group>) {
    const {
        components: parentComponents,
        componentAs: Component = ReactSelect,
        size,
        styles,
        className,
        classNames,
        field,
        invalid,
        isMulti,
        ...rest
    } = props

    const { controlSize } = useConfig()
    const formControlSize = useForm()?.size
    const formItemInvalid = useFormItem()?.invalid
    const inputGroupSize = useInputGroup()?.size

    const selectSize = (size ||
        inputGroupSize ||
        formControlSize ||
        controlSize) as keyof typeof CONTROL_SIZES

    const isSelectInvalid = invalid || formItemInvalid

    const selectClass = cn(`select select-${selectSize}`, className)

    return (
        <Component<Option, IsMulti, Group>
            className={selectClass}
            isMulti={isMulti}
            classNames={
                {
                    control: (state) =>
                        cn(
                            'select-control',
                            CONTROL_SIZES[selectSize].minH,
                            state.isDisabled && 'opacity-50 cursor-not-allowed',
                            (() => {
                                const classes: string[] = [
                                    'bg-gray-100 dark:bg-gray-700',
                                ]
                                if (state.isFocused) {
                                    classes.push(
                                        'select-control-focused ring-1 ring-primary border-primary bg-transparent',
                                    )
                                }
                                if (isSelectInvalid) {
                                    classes.push(
                                        'select-control-invalid bg-error-subtle',
                                    )
                                }
                                if (state.isFocused && isSelectInvalid) {
                                    classes.push('ring-error border-error')
                                }
                                return classes
                            })(),
                        ),
                    valueContainer: ({
                        isMulti: isMultiValue,
                        hasValue,
                        selectProps,
                    }) =>
                        cn(
                            'select-value-container',
                            isMultiValue &&
                                hasValue &&
                                selectProps.controlShouldRenderValue
                                ? 'flex'
                                : 'grid',
                        ),
                    input: ({ isDisabled }) =>
                        cn(
                            'select-input-container',
                            isDisabled ? 'invisible' : 'visible',
                        ),
                    placeholder: () =>
                        cn(
                            'select-placeholder',
                            isSelectInvalid ? 'text-error' : 'text-gray-400',
                        ),
                    indicatorsContainer: () => 'select-indicators-container',
                    dropdownIndicator: (state) =>
                        cn(
                            'select-dropdown-indicator-container',
                            state.isFocused && 'text-primary dark:text-white',
                            'hover:text-primary dark:hover:text-white',
                        ),
                    option: (state) =>
                        cn(
                            'select-option',
                            state.isSelected &&
                                'bg-primary-active text-primary-active-text',
                            state.isFocused &&
                                !state.isSelected &&
                                'bg-primary-hover text-primary-hover-text',
                        ),
                    singleValue: () => 'select-single-value',
                    multiValue: () => 'select-multi-value',
                    multiValueLabel: () => 'select-multi-value-label',
                    multiValueRemove: () => 'select-multi-value-remove',
                    menu: () => 'select-menu',
                    ...classNames,
                } as ClassNamesConfig<Option, IsMulti, Group>
            }
            classNamePrefix={'select'}
            styles={
                {
                    control: () => ({}),
                    valueContainer: () => ({}),
                    input: ({
                        margin,
                        paddingTop,
                        paddingBottom,
                        ...provided
                    }) => ({ ...provided }),
                    placeholder: () => ({}),
                    singleValue: () => ({}),
                    multiValue: () => ({}),
                    multiValueLabel: () => ({}),
                    multiValueRemove: () => ({}),
                    menu: ({
                        ...provided
                    }) => ({ ...provided, zIndex: 50 }),
                    ...styles,
                } as StylesConfig<Option, IsMulti, Group>
            }
            components={{
                IndicatorSeparator: () => null,
                Option: isMulti ? CheckboxOption : DefaultOption,
                LoadingIndicator: DefaultLoadingIndicator,
                DropdownIndicator: DefaultDropdownIndicator,
                ClearIndicator: DefaultClearIndicator,
                ...parentComponents,
            }}
            closeMenuOnSelect={!isMulti}
            hideSelectedOptions={false}
            {...field}
            {...rest}
        />
    )
}

export default Select