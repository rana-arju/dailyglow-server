export const forgotEmailTemplate = (otp: any) => `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bettyesses - Password Reset Code</title>
    <style>
        :root {
            --color-primary-01: #0556AB;
            --color-primary-02: #00244A;
            --color-secondary: #73B7FF;
            --color-accent: #EEF6FF;
            --color-success: #10B981;
            --color-error: #FF4B4B;
            --color-text-og: #000407;
            --color-text-subtle: #61758A;
            --color-text-subtle-2: #B6BEC8;
            --color-text-white: #FAFAFA;
            --color-white-elements: #FFFFFF;
            --color-background: #FFFFFF;
            --color-stroke: #E2E8F0;
            --color-dash-background: #FAFCFF;
        }

        * {
            box-sizing: border-box;
        }

        body,
        html {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-dash-background) 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
        }

        table {
            border-spacing: 0;
            width: 100%;
            margin: 0;
            padding: 0;
        }

        img {
            max-width: 100%;
            height: auto;
            border: none;
            outline: none;
            text-decoration: none;
        }

        .email-wrapper {
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-dash-background) 100%);
            padding: 20px 0;
            min-height: 100vh;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(167, 139, 250, 0.2);
        }

        .header {
            background: linear-gradient(135deg, var(--color-primary-01) 0%, var(--color-primary-02) 100%);
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }

        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--color-secondary), var(--color-primary-01));
        }

        .logo {
            max-height: 60px;
            filter: brightness(0) invert(1);
        }

        .company-name {
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0 0 0;
            letter-spacing: 1px;
        }

        .body {
            padding: 40px 30px;
            text-align: center;
            background-color: #ffffff;
        }

        .greeting {
            font-size: 18px;
            color: var(--color-info);
            margin-bottom: 10px;
            font-weight: 500;
        }

        .body h1 {
            font-size: 28px;
            margin-bottom: 15px;
            color: var(--color-accent);
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .description {
            font-size: 16px;
            color: var(--color-info);
            margin-bottom: 30px;
            line-height: 1.5;
        }

        .otp-container {
            background: var(--color-card);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border: 2px dashed var(--color-secondary);
            position: relative;
        }

        .otp-label {
            font-size: 14px;
            color: var(--color-primary);
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .otp {
            display: inline-block;
            font-size: 36px;
            font-weight: 800;
            color: var(--color-primary);
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            user-select: all;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .otp:hover {
            transform: scale(1.05);
            color: var(--color-accent);
        }

        .copy-btn {
            display: inline-block;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
            margin-top: 20px;
        }

        .copy-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }

        .copy-btn:active {
            transform: translateY(0);
        }

        .copy-success {
            display: none;
            color: var(--color-success);
            font-size: 14px;
            margin-top: 10px;
            font-weight: 600;
        }

        .security-notice {
            background: var(--color-surface);
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            border-left: 4px solid var(--color-warning);
        }

        .security-notice h3 {
            color: var(--color-warning);
            font-size: 16px;
            margin: 0 0 10px 0;
            font-weight: 600;
        }

        .security-notice p {
            color: var(--color-info);
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }

        .expiry-time {
            background: var(--color-card);
            color: var(--color-primary);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            display: inline-block;
        }

        .footer {
            background-color: var(--color-accent);
            text-align: center;
            padding: 30px 20px;
            color: #ffffff;
        }

        .footer h4 {
            color: #ffffff;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
        }

        .social-icons {
            margin: 20px 0;
        }

        .social-icons a {
            display: inline-block;
            margin: 0 10px;
            padding: 10px;
            background-color: var(--color-primary);
            border-radius: 50%;
            transition: all 0.3s ease;
            text-decoration: none;
        }

        .social-icons a:hover {
            background-color: var(--color-secondary);
            transform: translateY(-2px);
        }

        .social-icons img {
            height: 20px;
            width: 20px;
            filter: brightness(0) invert(1);
        }

        .footer-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 20px;
            line-height: 1.5;
        }

        .footer-links {
            margin-top: 15px;
        }

        .footer-links a {
            color: var(--color-secondary);
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
        }

        .footer-links a:hover {
            color: #ffffff;
        }

        /* Email client specific fixes */
        .otp-selectable {
            background: #F6F5FD;
            border: 2px solid #7C3AED;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: 800;
            color: #7C3AED;
            letter-spacing: 6px;
            text-align: center;
            user-select: all;
            -webkit-user-select: all;
            -moz-user-select: all;
            -ms-user-select: all;
            word-break: break-all;
        }

        .copy-instruction {
            font-size: 14px;
            color: #7C3AED;
            font-weight: 600;
            margin-top: 10px;
            background: #EBFBFF;
            padding: 10px 15px;
            border-radius: 6px;
            border-left: 3px solid #7C3AED;
        }

        /* Fallback for email clients that strip CSS variables */
        .email-container {
            background-color: #ffffff;
        }
        
        .header {
            background: var(--color-primary-01);
            background: linear-gradient(135deg, var(--color-primary-01) 0%, var(--color-primary-02) 100%);
        }
        
        .body h1 {
            color: var(--color-text-og);
        }
        
        .greeting {
            color: var(--color-text-subtle);
        }
        
        .description {
            color: var(--color-text-subtle);
        }
        
        .otp-container {
            background: var(--color-accent);
            border: 2px dashed var(--color-secondary);
        }
        
        .otp-label {
            color: var(--color-primary-01);
        }
        
        .otp {
            color: var(--color-primary-01);
        }
        
        .expiry-time {
            background: var(--color-accent);
            color: #7C3AED;
        }
        
        .security-notice {
            background: var(--color-accent);
            border-left: 4px solid var(--color-error);
        }
        
        .security-notice h3 {
            color: var(--color-error);
        }
        
        .security-notice p {
            color: var(--color-text-subtle);
        }
        
        .footer {
            background-color: var(--color-primary-02);
        }
        
        .social-icons a {
            background-color: var(--color-primary-01);
        }
        
        .footer-links a {
            color: var(--color-secondary);
        }

        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }

            .email-container {
                margin: 0 10px;
                border-radius: 12px;
            }

            .header {
                padding: 25px 15px;
            }

            .company-name {
                font-size: 20px;
            }

            .body {
                padding: 30px 20px;
            }

            .body h1 {
                font-size: 24px;
            }

            .greeting {
                font-size: 16px;
            }

            .description {
                font-size: 15px;
            }

            .otp {
                font-size: 30px;
                letter-spacing: 6px;
            }

            .otp-container {
                padding: 20px 15px;
                margin: 25px 0;
            }

            .copy-btn {
                padding: 12px 24px;
                font-size: 15px;
            }

            .security-notice {
                padding: 15px;
                margin-top: 25px;
            }

            .footer {
                padding: 25px 15px;
            }

            .social-icons a {
                margin: 0 8px;
                padding: 8px;
            }

            .social-icons img {
                height: 18px;
                width: 18px;
            }
        }

        @media only screen and (max-width: 480px) {
            .otp {
                font-size: 26px;
                letter-spacing: 4px;
            }

            .copy-btn {
                width: 100%;
                padding: 14px;
            }

            .body h1 {
                font-size: 22px;
            }
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <table role="presentation" class="email-container" align="center">
            <!-- Header -->
            <tr>
                <td class="header">
                    <h2 class="company-name">bettyesses</h2>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td class="body">
                    <div class="greeting">Hello there! 👋</div>
                    <h1>Verify Your Account</h1>
                    <div class="description">
                        We've generated a secure one-time password (OTP) for your account verification.
                        Use this code to complete your authentication.
                    </div>

                    <div class="otp-container">
                        <div class="otp-label">Your OTP Code</div>
                        <div class="otp-selectable">${otp}</div>
                        <div class="copy-instruction">
                            👆 Tap and hold (mobile) or triple-click (desktop) to select and copy the OTP code above
                        </div>
                    </div>

                    <div class="expiry-time">
                        ⏰ Expires in 2 minutes
                    </div>

                    <div class="security-notice">
                        <h3>🔒 Security Notice</h3>
                        <p>
                            This OTP is confidential and should not be shared with anyone.
                            If you didn't request this verification, please contact our support team immediately.
                        </p>
                    </div>
                </td>
            </tr>

          
        </table>
    </div>

    <!-- 
        Note: JavaScript is not supported in most email clients for security reasons.
        Users can manually select and copy the OTP using standard text selection.
        For web-based usage, you can add JavaScript functionality separately.
    -->
</body>

</html>`;
