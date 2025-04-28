// frontend/src/api/usageReport.js
import axios from "axios";

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5080/api";
const API_BASE = "https://abstract-pump-109a297e2430.herokuapp.com/api";
// const API_BASE = "http://localhost:5080/api";

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
