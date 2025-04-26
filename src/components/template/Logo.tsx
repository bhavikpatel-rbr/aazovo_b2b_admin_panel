import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 'auto',
    } = props

    return (
        <div
            className={classNames('logo', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
                display: 'flex',  // Use flexbox to align logos horizontally
                alignItems: 'center',  // Center the logos vertically
            }}
        >
            <img
                className={imgClass}
                src={`${LOGO_SRC_PATH}aazovo logo-02.png`}
                alt={`${APP_NAME} logo`}
                style={{
                    marginRight: '8px', // Space between logos
                    width: '63px', // Set width
                    height: '62px', // Set height
                }}
            />
            <div
                style={{
                    borderRight: '1px solid #000', // Single line between logos
                    height: '30px', // Adjust the height of the line as needed
                    marginRight: '8px', // Space between line and second logo
                }}
            />
            <img
                className={imgClass}
                src={`${LOGO_SRC_PATH}Aazovo-white--02.png`}
                alt={`${APP_NAME} logo`}
            />
        </div>
    )
}

export default Logo
