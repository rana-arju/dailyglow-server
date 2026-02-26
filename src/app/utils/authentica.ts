import axios from 'axios';
import config from '../../config';

const AUTHENTICA_BASE_URL = 'https://api.authentica.sa/api/v2';

export interface SendOTPResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message?: string;
}

export const sendOTP = async (phone: string, otp?: string): Promise<SendOTPResponse> => {
  try {
    const response = await axios.post(
      `${AUTHENTICA_BASE_URL}/send-otp`,
      {
        method: 'sms',
        phone: phone.startsWith('+') ? phone : `+${phone}`,
        template_id: 31, // Using template 31 as shown in the docs
        otp: otp, // Custom OTP if provided
      },
      {
        headers: {
          'X-Authorization': config.authentica.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: 'OTP sent successfully',
      transaction_id: response.data?.transaction_id,
    };
  } catch (error: any) {
    console.error('Authentica send OTP error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP',
    };
  }
};

export const verifyOTP = async (phone: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    const response = await axios.post(
      `${AUTHENTICA_BASE_URL}/verify-otp`,
      {
        phone: phone.startsWith('+') ? phone : `+${phone}`,
        otp: otp,
      },
      {
        headers: {
          'X-Authorization': config.authentica.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    console.error('Authentica verify OTP error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to verify OTP',
    };
  }
};
