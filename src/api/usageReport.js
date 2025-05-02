// frontend/src/api/usageReport.js
import axios from "axios";
import { config } from "../config";

const API_BASE = config.API_URL;

export async function generateUsageReport(chatId, fromDate, toDate, userID) {
  // This returns a PDF. We can get it as a Blob to let the user download or view.
  const res = await axios.post(
    `${API_BASE}/usage-report`,
    { chatId, fromDate, toDate, userID },
    { responseType: "arraybuffer" } // important to get binary data
  );

  // console.log(res.data);
  return res.data; // this is an ArrayBuffer representing the PDF
}
