import { cloneElement } from 'react'
import type { CommonProps } from '@/@types/common'

type SideProps = CommonProps

const Side = ({ children, ...rest }: SideProps) => {
    return (
        <div className="flex h-full p-0 bg-white dark:bg-gray-800">
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
                className="hidden lg:flex flex-col flex-1 justify-center items-center relative max-w-[50%] 2xl:max-w-[50%] bg-primary text-white p-10" // <-- Add desired background color here (e.g., bg-blue-500)
            >   
                <img
                    src="/img/others/Loginimage.png"
                    className="rounded-3xl w-[592px] h-[592px]" // <-- Add opacity class (e.g., opacity-75, opacity-50)
                />
            </div>
        </div>
    )
}

export default Side
