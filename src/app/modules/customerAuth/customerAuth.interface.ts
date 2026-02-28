export interface ICustomerLogin {
  phoneNumber: string;
  password:  string;
}

export interface ICustomerChangePassword {
  oldPassword:  string;
  newPassword:  string;
}

export interface CustomerRefreshPayload {
  id: string;
  phoneNumber: string;
}
