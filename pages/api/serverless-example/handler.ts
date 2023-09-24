import { NextApiRequest, NextApiResponse } from 'next';
import { sendNotification } from "../../../utils/fetchNotify";
 
export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
    // Add code here to loop through all accounts and send notification to each of them!
    // sendNotification({
    //     // title: "GM Ladiesssss",
    //     title: `Hello ${selectedHoroscope}, today ${HoroscopeData[selectedHoroscope]}`,
    //     body: `${horoscopePrediction}`,
    //     icon: `${window.location.origin}/WalletConnect-blue.svg`,
    //     url: window.location.origin,
    //     type: "promotional",
    //   });
  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
  });
}