export const config = {
  apiURL: process.env.REACT_APP_API_URL || "",
  useEncryptApplicationStorage: process.env.REACT_APP_USE_APPLICATION_ENCRYPT_STORAGE === "true",
}