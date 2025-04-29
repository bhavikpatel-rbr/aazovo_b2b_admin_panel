import { cloneElement } from 'react'
import type { CommonProps } from '@/@types/common'

type SideProps = CommonProps

const Side = ({ children, ...rest }: SideProps) => {
    return (
        <div className="flex h-full p-6 bg-white dark:bg-gray-800">
            <div className=" flex flex-col justify-center items-center flex-1">
                <div className="w-full xl:max-w-[450px] px-8 max-w-[380px]">
                    {children
                        ? cloneElement(children as React.ReactElement, {
                              ...rest,
                          })
                        : null}
                </div>
            </div>
            <div
                className="py-6 px-10 lg:flex flex-col flex-1 justify-between hidden rounded-2xl items-end relative max-w-[520px] 2xl:max-w-[720px] bg-blue-500" // <-- Add desired background color here (e.g., bg-blue-500)
            >
                <img
                    src="/img/others/Loginimage.png"
                    className="absolute h-full w-full top-0 left-0 rounded-3xl " // <-- Add opacity class (e.g., opacity-75, opacity-50)
                />
                {/* Optional: Add other content here if needed; it will be above the image */}
            </div>
        </div>
    )
}

export default Side
