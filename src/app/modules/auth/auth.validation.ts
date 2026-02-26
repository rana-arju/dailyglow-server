import { Role } from '@prisma/client';
import z from 'zod';

const phoneRegex = /^[+]*[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}$/;

const phoneRequestOtp = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone is required!' })
      .regex(phoneRegex, 'Invalid phone number'),
  }),
});

const phoneAuth = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone is required!' })
      .regex(phoneRegex, 'Invalid phone number')
  }),
});

const phoneVerifyRegister = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is required!' }),
    otpCode: z.string({ required_error: 'otpCode is required!' }).length(6, 'otpCode must be 6 digit'),
    firstName: z.string({ required_error: 'First name is required!' }),
    lastName: z.string({ required_error: 'Last name is required!' }),
  }),
});

const phoneVerifyLogin = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is required!' }),
    otpCode: z.string({ required_error: 'otpCode is required!' }).length(6, 'otpCode must be 6 digit'),
  }),
});

const registerUser = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'First name is required!',
    }),
    lastName: z.string({
      required_error: 'Last name is required!',
    }),
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, 'Password should be at least 8 characters'),
  }),
});

const createAdminUser = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'First name is required!',
    }),
    lastName: z.string({
      required_error: 'Last name is required!',
    }),
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, 'Password should be at least 8 characters'),
    role: z.enum([Role.ADMIN, Role.SUPERADMIN], {
      required_error: 'Role is required!',
      invalid_type_error: 'Role must be either ADMIN or SUPERADMIN',
    }),
  }),
});

const verifyOtp = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'userId is required!',
    }),
    otpCode: z
      .string({
        required_error: 'otpCode is required!',
      })
      .length(6, 'otpCode must be 6 digit'),
  }),
});

const loginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z.string({
      required_error: 'Password is required!',
    }),
    fcmToken: z.string().optional(),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    newPassword: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, 'password should be minimum 8 characters '),
  }),
});
const changePassword = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: 'old Password is required!',
    }),
    newPassword: z
      .string({
        required_error: 'new password is required!',
      })
      .min(8, 'Password should be minimum 8 characters '),
  }),
});

export const authValidation = {
  registerUser,
  createAdminUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  phoneAuth,
  phoneVerifyRegister,
  phoneVerifyLogin,
};
