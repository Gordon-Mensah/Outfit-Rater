// api/ping.js - Keep API warm to prevent cold starts
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  return res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    message: 'API is warm and ready!'
  })
}