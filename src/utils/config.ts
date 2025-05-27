export const config = {
  apiURL: process.env.REACT_APP_API_URL || "",
  // apiURL: "http://127.0.0.1:8000/api",
  useEncryptApplicationStorage: process.env.REACT_APP_USE_APPLICATION_ENCRYPT_STORAGE === "true",
}