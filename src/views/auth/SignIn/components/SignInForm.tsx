import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
// import { useAuth } from '@/auth' // This import seems unused in this component
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'
import { useAppDispatch } from '@/reduxtool/store'
import { loginUserByEmailAction } from '@/reduxtool/auth/middleware'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string | null) => void // Allow null to clear message
}

type SignInFormSchema = {
    email: string
    password: string
}

const validationSchema: ZodType<SignInFormSchema> = z.object({
    email: z
        .string({ required_error: 'Please enter your email' })
        .min(1, { message: 'Please enter your email' }),
    password: z
        .string({ required_error: 'Please enter your password' })
        .min(1, { message: 'Please enter your password' }),
})

const SignInForm = (props: SignInFormProps) => {
    const dispatch = useAppDispatch()
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, setMessage, passwordHint } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
        setError, // Import setError to manually set form errors from API response
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const onSignIn = async (values: SignInFormSchema) => {
        const { email, password } = values
        if (disableSubmit) {
            return
        }

        setSubmitting(true)
        setMessage?.(null) // Clear previous messages

        try {
            // When using createAsyncThunk, dispatch returns a Promise.
            // We can await its result.
            // .unwrap() will throw an error if the thunk was rejected,
            // or return the fulfilled action payload.
            const resultAction = await dispatch(loginUserByEmailAction({ email, password }))

            if (loginUserByEmailAction.fulfilled.match(resultAction)) {
                // Login successful, Redux state should be updated by the thunk/reducer
                // You might navigate the user or show a success message via Redux state
                // setMessage?.('Sign in successful!'); // Or handle this through global state
            } else if (loginUserByEmailAction.rejected.match(resultAction)) {
                // Login failed
                const errorMessage = (resultAction.payload as any)?.message || // Try to get error from payload
                                   (resultAction.error as any)?.message ||    // Try to get error from error object
                                   'Sign in failed. Please check your credentials.';
                setMessage?.(errorMessage)

                // Optionally, set errors on specific fields if the API returns them
                // For example, if API says "Invalid email":
                // if ((resultAction.payload as any)?.field === 'email') {
                //     setError('email', { type: 'manual', message: errorMessage });
                // } else {
                //     setError('root.serverError', { type: 'manual', message: errorMessage });
                // }
            }
        } catch (error: any) {
            // This catch block handles errors not originating from the thunk's rejection
            // (e.g., network issues before dispatch, or if .unwrap() was used and it threw)
            console.error('Sign in error:', error)
            const errorMessage = error.message || 'An unexpected error occurred during sign in.'
            setMessage?.(errorMessage)
            // setError('root.serverError', { type: 'manual', message: errorMessage });
        } finally {
            setSubmitting(false) // Ensure loader is turned off
        }
    }

    return (
        <div className={className}>
            {/* Display root errors if any (e.g., general server error) */}
            {errors.root?.serverError && (
                 <div className="text-red-500 text-sm mb-4">{errors.root.serverError.message}</div>
            )}
            <Form onSubmit={handleSubmit(onSignIn)}>
                <FormItem
                    label="User"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="Email"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Password"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        // Ensure there's enough space if an error message is present
                        // This logic seems a bit complex, might simplify if not needed:
                        // passwordHint && errors.password?.message ? 'mb-0' : // If hint and error, hint might handle spacing
                        // !passwordHint && errors.password?.message ? 'mb-8' : // If no hint but error, give space
                        // passwordHint && !errors.password?.message ? 'mb-0' : // If hint and no error, hint handles spacing
                        // '' // Default
                        errors.password?.message ? 'mb-8' : (passwordHint ? 'mb-0' : '')
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        // rules={{ required: true }} // Not needed if using Zod resolver
                        render={({ field }) => (
                            <PasswordInput
                                // type="text" // PasswordInput usually handles its own type toggle, default to "password"
                                placeholder="Password"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                {passwordHint}

                <div className="mb-3">
                <p className="font-semibold heading-text">
                                <a
                href="/forgot-password"
                >
                Forgot Password?
                </a>
                </p>
                </div>
                <Button
                    block
                    loading={isSubmitting}
                    disabled={isSubmitting || disableSubmit} // Also disable button when submitting
                    className="h-10 mt-6" // Added margin-top for spacing
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </Form>
        </div>
    )
}

export default SignInForm