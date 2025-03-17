import axios from "axios";

export async function sendBrevoEmail(mailOption) {
  try {
    const response = await axios.post(
        process.env.BREVA_URL,
      {
        ...mailOption 
      },
      {
        headers: {
          "api-key": process.env.BREVA_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}
