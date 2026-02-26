import { Role } from "@prisma/client";

const phoneRegex = /^[+]*[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}[ -]?[0-9]{1,4}$/;


export interface IRegisterUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  fcmToken?: string;
}
export type IJwtPayload = {
  id?: string;
  email: string;
  role: Role;
};
export type RefreshPayload = {
  id: string;

  email: string;
  role: Role;
  iat: number;
  exp: number;
};

export interface IOtp {
  userId: string;
  otpCode: string
}




export interface IUserLogin {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface IChangePassword {
  newPassword: string;
  oldPassword: string;
}

export interface IPartnerRegistration {
  dateTimeFormat: string;
  timezone: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  password: string;
  country: string;
}
