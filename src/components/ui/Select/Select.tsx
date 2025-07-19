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
import Option from './Option'

// CSS for the custom checkbox with a lighter theme.
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
    background-color: #3b82f6; // A pleasant blue (blue-500)
    border-color: #3b82f6;
}

.select-option:hover .custom-checkbox:not(.custom-checkbox-checked) {
    border-color: #93c5fd; // light blue on hover
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

const DefaultOption = components.Option

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

    const selectClass = cn('select', `select-${selectSize}`, className)

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
                            state.isDisabled && 'opacity-50 bg-gray-100 cursor-not-allowed',
                            // Base styles
                            'bg-gray-50 dark:bg-gray-700',
                            // Focused state
                            state.isFocused && !isSelectInvalid &&
                                'ring-1 ring-blue-300 border-blue-300 bg-white dark:bg-gray-700',
                            // Invalid state
                            isSelectInvalid && 'select-control-invalid bg-red-50 border-red-300',
                            // Focused and invalid state
                            state.isFocused && isSelectInvalid && 'ring-1 ring-red-300'
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
                            isSelectInvalid ? 'text-red-500' : 'text-gray-400',
                        ),
                    indicatorsContainer: () => 'select-indicators-container',
                    dropdownIndicator: (state) =>
                        cn(
                            'select-dropdown-indicator-container',
                            state.isFocused && 'text-blue-600 dark:text-blue-300',
                            'hover:text-blue-600 dark:hover:text-blue-300',
                        ),
                    option: (state) =>
                        cn(
                            'select-option', // Custom class for checkbox styling
                            state.isSelected &&
                                'bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200 font-semibold',
                            state.isFocused &&
                                !state.isSelected &&
                                'bg-gray-100 dark:bg-gray-700/60',
                        ),
                    singleValue: () => 'select-single-value',
                    multiValue: () => 'select-multi-value bg-blue-100 text-blue-700 rounded',
                    multiValueLabel: () => 'select-multi-value-label',
                    multiValueRemove: () => 'select-multi-value-remove hover:bg-blue-200 hover:text-blue-800',
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
                Option: isMulti ? CheckboxOption : Option,
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