import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Redux Imports
import { useAppDispatch } from '@/reduxtool/store'
import { forgotPasswordAction } from '@/reduxtool/auth/middleware' // Assuming this path is correct

// UI Component Imports
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Input } from '@/components/ui'
import type { ReactNode } from 'react'

// --- Zod Schema for Forgot Password Form ---
const forgotPasswordSchema = z.object({
    email: z
        .string({ required_error: 'Please enter your email' })
        .min(1, { message: 'Email is required.' })
        .email({ message: 'Please enter a valid email address.' }),
})
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// --- ForgotPasswordForm Component (Refactored) ---
type ForgotPasswordFormProps = {
    emailSent: boolean
    setMessage: (message: string | null) => void // Allow null to clear
    setEmailSent: (sent: boolean) => void
    children: ReactNode // For the "Continue" button
}

const ForgotPasswordForm = ({
    emailSent,
    setMessage,
    setEmailSent,
    children,
}: ForgotPasswordFormProps) => {
    const dispatch = useAppDispatch()
    // Manage loading state locally instead of using useAppSelector
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onTouched',
        defaultValues: {
            email: '',
        },
    })

    const onFormSubmit = async (data: ForgotPasswordFormData) => {
        setMessage(null) // Clear previous messages
        setIsSubmitting(true) // Start loading

        try {
            const resultAction = await dispatch(forgotPasswordAction(data))

            if (forgotPasswordAction.fulfilled.match(resultAction)) {
                setEmailSent(true)
            } else if (forgotPasswordAction.rejected.match(resultAction)) {
                // Get error message from rejected thunk payload
                const errorMessage =
                    (resultAction.payload as string) || // Payload is now a string
                    'Failed to send reset link. Please try again.'
                setMessage(errorMessage)
            }
        } catch (error: any) {
            // This catches unexpected errors not handled by the thunk's rejection
            console.error('Forgot Password error:', error)
            const errorMessage =
                error.message || 'An unexpected error occurred.'
            setMessage(errorMessage)
        } finally {
            setIsSubmitting(false) // Stop loading
        }
    }

    // If email is sent, show the children (the "Continue" button)
    if (emailSent) {
        return <div>{children}</div>
    }

    // Otherwise, show the form
    return (
        <FormContainer>
            <form noValidate onSubmit={handleSubmit(onFormSubmit)}>
                <FormItem
                    label="Email"
                    invalid={!!errors.email}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="email"
                                placeholder="e.g., user@company.com"
                                autoComplete="off"
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    variant="solid"
                    type="submit"
                    className='mt-2'
                >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                </Button>
            </form>
        </FormContainer>
    )
}

// --- Main ForgotPassword Component (Wrapper) ---
type ForgotPasswordProps = {
    signInUrl?: string
}

export const ForgotPasswordBase = ({
    signInUrl = '/sign-in',
}: ForgotPasswordProps) => {
    const [emailSent, setEmailSent] = useState(false)
    const [message, setMessage] = useTimeOutMessage()
    const navigate = useNavigate()

    const handleContinue = () => {
        navigate(signInUrl)
    }

    return (
        <div>
            <div className="mb-6">
                {emailSent ? (
                    <>
                        <h3 className="mb-2">Check your email</h3>
                        <p className="font-semibold heading-text">
                            We have sent a password recovery link to your email.
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="mb-2">Reset password</h3>
                        <p className="font-semibold heading-text">
                            Enter your email to request a password reset.
                        </p>
                    </>
                )}
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            )}
            <ForgotPasswordForm
                emailSent={emailSent}
                setMessage={setMessage}
                setEmailSent={setEmailSent}
            >
                {/* This button is passed as a child and rendered only when emailSent is true */}
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </ForgotPasswordForm>
            <div className="mt-4 text-center">
                <span>Back to </span>
                <ActionLink
                    to={signInUrl}
                    className="heading-text font-bold"
                    themeColor={false}
                >
                    Sign in
                </ActionLink>
            </div>
        </div>
    )
}

const ForgotPassword = () => {
    return <ForgotPasswordBase />
}

export default ForgotPassword