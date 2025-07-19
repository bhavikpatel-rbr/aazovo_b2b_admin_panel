// src/components/Select/Option.tsx (or wherever you have this file)

import classNames from 'classnames'
import type { ReactNode } from 'react'
import { HiCheck } from 'react-icons/hi'
import type { GroupBase, OptionProps } from 'react-select'

// It's good practice to ensure the generic type T is properly constrained if possible.
// For now, we'll use a more explicit type for props.
type DefaultOptionProps<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = OptionProps<Option, IsMulti, Group> & {
    customLabel?: (data: Option, label: string) => ReactNode
}

const Option = <
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(
    props: DefaultOptionProps<Option, IsMulti, Group>,
) => {
    // Destructure isFocused from props
    const {
        innerProps,
        label,
        isSelected,
        isDisabled,
        isFocused, // <-- Add this prop
        data,
        customLabel,
    } = props

    return (
        <div
            className={classNames(
                'select-option',
                'flex items-center justify-between p-2 cursor-pointer', // Base styles
                isDisabled && 'opacity-50 cursor-not-allowed',
                // When focused (hover or keyboard) but NOT selected, apply hover styles
                isFocused &&
                !isSelected &&
                'bg-gray-100 dark:bg-gray-600',
                // When selected, apply selected styles
                isSelected && 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 font-semibold',
            )}
            {...innerProps}
        >
            {/* Using a flex container for label and checkmark */}
            <div className="flex items-center">
                {customLabel ? (
                    customLabel(data, label)
                ) : (
                    // Removed ml-2, padding is on the parent now
                    <span>{label}</span>
                )}
            </div>
            {isSelected && <HiCheck className="text-xl text-primary-600 dark:text-primary-400" />}
        </div>
    )
}

export default Option