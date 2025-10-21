{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww18340\viewh16040\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const cors = require('cors');\
\
const app = express();\
app.use(cors());\
app.use(express.json());\
\
// Get OpenAI API key from environment variable\
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;\
\
// Sat-Elite knowledge base for Captain Connect\
const SAT_ELITE_CONTEXT = `You are Captain Connect, a warm and professional AI assistant for Sat-Elite.\
\
About Sat-Elite:\
- Global connectivity provider specializing in 5G eSIM and satellite communications\
- EPIC Platform: Our connectivity management system at https://epicplatform.sat-elite.io/estore\
- Coverage: 190+ countries worldwide\
- Services: eSIM solutions, satellite communications, IoT connectivity, enterprise solutions\
\
Key Features:\
- eSIM: Digital SIM cards with instant activation via QR code (no physical card needed)\
- Compatible with: iPhone XS+, Google Pixel 3+, Samsung Galaxy S20+, and most modern smartphones\
- Use cases: International travel, business connectivity, IoT devices, maritime, aviation, remote locations\
- Pricing: Competitive rates with no hidden fees, pay-as-you-go plans available\
\
Your Role:\
- Answer questions about Sat-Elite's services professionally and warmly\
- Direct eSIM and 5G questions to the EPIC eSIM store\
- For satellite or enterprise solutions, offer to connect them with a representative\
- Always be helpful, friendly, and knowledgeable\
- Use emojis occasionally to be engaging (\uc0\u55356 \u57101  \u55357 \u57072 \u65039  \u55357 \u56561  \u55357 \u56960 )\
\
Important: If someone asks for contact or has complex needs, offer to collect their email for follow-up.`;\
\
// Chat endpoint\
app.post('/api/chat', async (req, res) => \{\
  try \{\
    const \{ message, conversationHistory = [] \} = req.body;\
\
    // Build conversation with context\
    const messages = [\
      \{ role: 'system', content: SAT_ELITE_CONTEXT \},\
      ...conversationHistory.slice(-6),\
      \{ role: 'user', content: message \}\
    ];\
\
    // Call OpenAI GPT-4o API\
    const response = await fetch('https://api.openai.com/v1/chat/completions', \{\
      method: 'POST',\
      headers: \{\
        'Content-Type': 'application/json',\
        'Authorization': `Bearer $\{OPENAI_API_KEY\}`\
      \},\
      body: JSON.stringify(\{\
        model: 'gpt-4o',\
        messages: messages,\
        max_tokens: 300,\
        temperature: 0.7\
      \})\
    \});\
\
    const data = await response.json();\
    \
    if (data.error) \{\
      console.error('OpenAI Error:', data.error);\
      throw new Error(data.error.message || 'OpenAI API error');\
    \}\
    \
    if (data.choices && data.choices[0]) \{\
      res.json(\{ \
        success: true, \
        reply: data.choices[0].message.content\
      \});\
    \} else \{\
      throw new Error('No response from OpenAI');\
    \}\
\
  \} catch (error) \{\
    console.error('Error:', error);\
    res.status(500).json(\{ \
      success: false, \
      error: error.message || 'Failed to get response from AI'\
    \});\
  \}\
\});\
\
// Health check endpoint\
app.get('/', (req, res) => \{\
  res.send('\uc0\u9989  Sat-Elite Chatbot Backend (GPT-4o) is running!');\
\});\
\
app.get('/api/health', (req, res) => \{\
  res.json(\{ status: 'OK', model: 'gpt-4o', version: '1.0' \});\
\});\
\
const PORT = process.env.PORT || 3000;\
app.listen(PORT, () => \{\
  console.log(`\uc0\u55357 \u56960  Server running on port $\{PORT\}`);\
\});}