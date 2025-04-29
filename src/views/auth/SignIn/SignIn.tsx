import Logo from '@/components/template/Logo'
import Alert from '@/components/ui/Alert'
import SignInForm from './components/SignInForm'
import OauthSignIn from './components/OauthSignIn'
import ActionLink from '@/components/shared/ActionLink'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useThemeStore } from '@/store/themeStore'
import { Checkbox } from '@/components/ui'
import { ChangeEvent } from 'react'
import LogoBlack from '@/components/template/LogoBlack'

type SignInProps = {
    signUpUrl?: string
    forgetPasswordUrl?: string
    disableSubmit?: boolean
}

export const SignInBase = ({
    signUpUrl = '/sign-up',
    forgetPasswordUrl = '/forgot-password',
    disableSubmit,
}: SignInProps) => {
    const [message, setMessage] = useTimeOutMessage()

    const mode = useThemeStore((state) => state.mode)

    const onCheck = (value: boolean, e: ChangeEvent<HTMLInputElement>) => {
        console.log(value, e)
    }

    return (
        <>
            <div className="mb-8">
                <LogoBlack
                    type="streamline"
                    mode={mode}
                    imgClass="mx-auto"
                    logoWidth={250}
                />
            </div>
            <div className="mb-3">
                <h2 className="mb-2">Welcome back!</h2>
                <p className="font-semibold heading-text">
                    Please enter your credentials to sign in!
                </p>
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            <SignInForm
                disableSubmit={disableSubmit}
                setMessage={setMessage}
                // --- Modified passwordHint prop ---
                passwordHint={
                    // Use a flex container to place items side-by-side
                    <div className="flex justify-between items-center mb-7 mt-5">
                        {/* Checkbox and Label */}
                        {/* <label className="flex items-center gap-1 cursor-pointer">
                            <Checkbox defaultChecked onChange={onCheck}>
                                Remember Me
                            </Checkbox>
                        </label> */}

                        {/* Forgot Password Link */}
                        <ActionLink
                            to={forgetPasswordUrl}
                            className="text-sm font-semibold heading-text underline" // Adjusted text size to match label potentially
                            themeColor={false}
                        >
                            Forgot password
                        </ActionLink>
                    </div>
                }
                // --- End of modified passwordHint ---
            />
            {/* <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="border-t border-gray-200 dark:border-gray-800 flex-1 mt-[1px]" />
                    <p className="font-semibold heading-text">
                        or countinue with
                    </p>
                    <div className="border-t border-gray-200 dark:border-gray-800 flex-1 mt-[1px]" />
                </div>
                <OauthSignIn
                    disableSubmit={disableSubmit}
                    setMessage={setMessage}
                />
            </div> */}
            {/* <div>
                <div className="mt-6 text-center">
                    <span>{`Don't have an account yet?`} </span>
                    <ActionLink
                        to={signUpUrl}
                        className="heading-text font-bold"
                        themeColor={false}
                    >
                        Sign up
                    </ActionLink>
                </div>
            </div> */}
        </>
    )
}

const SignIn = () => {
    return <SignInBase />
}

export default SignIn
