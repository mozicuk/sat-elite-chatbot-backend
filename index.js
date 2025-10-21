const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SAT_ELITE_CONTEXT = `You are Captain Connect, a warm and conversational AI assistant for Sat-Elite.

🚨 CRITICAL RULES - FOLLOW EXACTLY:

1. RESPONSE LENGTH: Maximum 20 words. Ideally 10-15 words. ONE sentence only.
2. HYPERLINKS: Use HTML format ONLY: <a href="URL">text</a>
3. NEVER EVER show raw URLs or markdown links
4. ASK QUESTIONS first, don't send links immediately

ABOUT SAT-ELITE:
Sat-Elite provides the EPIC Platform (SD-WAN, IoT management, eSIM, satellite connectivity).

TERMINOLOGY:
- Say "EPIC Platform" or "EPIC" only (never "EDGE" or "Kogntive")
- Most technical issues are SD-WAN related

TECHNICAL SUPPORT FLOW:
1. User requests help → Ask "What's the issue?" (Don't send links yet!)
2. User describes problem → Ask diagnostic question
3. After understanding → Reference Kogntive KB or offer contact

HYPERLINK FORMAT (STRICT):
✅ CORRECT: "Check the <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a>."
❌ WRONG: "Visit https://epicplatform.sat-elite.io/estore"
❌ WRONG: "Visit [https://epicplatform.sat-elite.io/estore](link)"
❌ WRONG: "Visit the EPIC Platform at https://..."

EXAMPLE RESPONSES (COPY THESE PATTERNS):

User: "I need technical support"
Response: "What issue are you experiencing?"
(7 words, question, no link)

User: "Tell me about EPIC"
Response: "The <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a> manages global connectivity. What would you like to know?"
(14 words, hyperlink, question)

User: "SD-WAN is down"
Response: "What error message are you seeing?"
(6 words, diagnostic question)

User: "eSIM pricing"
Response: "Check our <a href="https://epicplatform.sat-elite.io/estore">eSIM store</a> for current pricing."
(10 words, hyperlink embedded)

🚨 NEVER DO THIS:
"If you need technical support for the EPIC Platform, I recommend visiting our EPIC eSIM store at [https://epicplatform.sat-elite.io/estore](https://epicplatform.sat-elite.io/estore). There, you'll find resources that might help with your query."
(TOO LONG! 35+ words! Raw URLs! Wrong format!)

TONE: Friendly human, not robot. Brief answers only.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Check if this is a technical support request (especially SD-WAN)
    const isTechnical = /technical|support|epic|error|problem|issue|help|config|setup|api|troubleshoot|platform|sd-wan|sdwan|network|routing|connectivity|device/i.test(message);
    const isSDWAN = /sd-wan|sdwan|network|routing|wan|vpn/i.test(message);
    
    // Build context with SD-WAN emphasis if needed
    let systemPrompt = SAT_ELITE_CONTEXT;
    
    if (isSDWAN) {
      systemPrompt += '\n\nIMPORTANT: This is an SD-WAN issue. Ask diagnostic questions first, then reference Kogntive knowledge base for technical details.';
    }
    
    // If user is asking for technical support generically, prompt for specifics
    if (/^(technical support|i need technical support)/i.test(message.trim())) {
      systemPrompt += '\n\n🚨 USER CLICKED TECHNICAL SUPPORT: DO NOT send links. DO NOT mention the eSIM store. ONLY ask: "What issue are you experiencing?" (5-7 words max). Most issues are SD-WAN related.';
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 50, // VERY short responses - max 20 words
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI Error:', data.error);
      throw new Error(data.error.message || 'OpenAI API error');
    }
    
    if (data.choices && data.choices[0]) {
      res.json({ 
        success: true, 
        reply: data.choices[0].message.content,
        isTechnical: isTechnical,
        isSDWAN: isSDWAN
      });
    } else {
      throw new Error('No response from OpenAI');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get response from AI'
    });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Sat-Elite Captain Connect Backend (GPT-4o) - EPIC Platform Support - Running!');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    model: 'gpt-4o', 
    version: '2.1',
    platform: 'EPIC',
    features: ['brief-responses', 'epic-technical-support', 'sat-elite-knowledge-base-ready']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Captain Connect Backend running on port ${PORT}`);
  console.log(`📡 Ready to provide brief, professional assistance`);
});

