import { config } from "../../utils/config"
import { encryptStorage } from "../../utils/secureLocalStorage"

const { useEncryptApplicationStorage } = config

// This function use to get the local refresh token.
export const getLocalRefreshToken = (): string | null => {
  const userData: any | undefined = encryptStorage.getItem("user", !useEncryptApplicationStorage)
  if (userData === undefined) return null
  const user = userData
  return user
}

export const getLocalAccessToken = (): string | null => {
  const userData: any | undefined = encryptStorage.getItem("user", !useEncryptApplicationStorage)
  if (userData === undefined) return null
  const user: any = userData
  return user
}

export const updateLocalAccessToken = (accessToken: string, refreshToken: string) => {
  const userData: any | undefined = encryptStorage.getItem("user", !useEncryptApplicationStorage)
  if (userData !== undefined) {
    const user: any = userData
    encryptStorage.setItem("user", JSON.stringify(user), !useEncryptApplicationStorage)
  }
  return null
}

export const getUser = (): any | null => {
  const userData: any | undefined = encryptStorage.getItem("user", !useEncryptApplicationStorage)
  if (userData === undefined) return null
  const user: any = userData
  return user
}

export const setUser = (user: any) => {
  encryptStorage.setItem("user", user, !useEncryptApplicationStorage)
}

export const removeUser = () => {
  encryptStorage.removeItem("user")
}