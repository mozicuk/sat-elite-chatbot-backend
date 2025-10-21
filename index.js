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

ABOUT SAT-ELITE PRODUCTS:
Sat-Elite has TWO separate products:
1. **EPIC SD-WAN** = Technical networking product (SD-WAN, routing, traffic policies, configurations)
2. **EPIC Platform** = eSIM connectivity store (eSIM plans, data packages, international connectivity)

🚨 CRITICAL: These are DIFFERENT products with DIFFERENT links!

LINK RULES (VERY IMPORTANT):

SD-WAN/Technical Questions → Kogntive Knowledge Base:
- Base KB: <a href="https://kb.kognitive.net/?l=en">Kogntive Knowledge Base</a>
- Traffic Policy: <a href="https://kb.kognitive.net/es7/creating-a-new-network-traffic-policy">traffic policy guide</a>
- Configuration issues: <a href="https://kb.kognitive.net/?l=en">KB</a>
- Any SD-WAN technical issue: Point to Kogntive KB

eSIM/Connectivity Questions → EPIC Platform Store:
- eSIM plans: <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a>
- Data packages: <a href="https://epicplatform.sat-elite.io/estore">eSIM store</a>
- International connectivity: <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a>

TERMINOLOGY:
- SD-WAN questions: Say "EPIC SD-WAN"
- eSIM questions: Say "EPIC Platform" or "EPIC eSIM store"
- NEVER say "EDGE" or mention "Kogntive" (except in KB links)

TECHNICAL SUPPORT FLOW:
1. Ask what the issue is
2. Determine: SD-WAN technical OR eSIM/connectivity?
3. SD-WAN → Kogntive KB link
4. eSIM → EPIC Platform link

HYPERLINK FORMAT (STRICT):
✅ CORRECT: "Check the <a href="https://kb.kognitive.net/?l=en">Kogntive KB</a> for SD-WAN help."
✅ CORRECT: "Visit the <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a> for eSIM plans."
❌ WRONG: "Visit https://kb.kognitive.net"
❌ WRONG: "Visit [https://...](link)"

EXAMPLE RESPONSES:

User: "I need technical support"
Response: "Is this for EPIC SD-WAN or eSIM connectivity?"
(8 words, clarifying question)

User: "SD-WAN traffic policy issue"
Response: "Check the <a href="https://kb.kognitive.net/es7/creating-a-new-network-traffic-policy">traffic policy guide</a>. What error are you seeing?"
(14 words, correct KB link, question)

User: "SD-WAN configuration problem"
Response: "See the <a href="https://kb.kognitive.net/?l=en">Kogntive Knowledge Base</a> for configuration help."
(11 words, correct KB link)

User: "eSIM pricing"
Response: "Check the <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a> for eSIM pricing."
(10 words, correct store link)

User: "Tell me about EPIC SD-WAN"
Response: "EPIC SD-WAN is our networking solution. What would you like to know?"
(13 words, clarifying question)

User: "International eSIM plans"
Response: "Browse plans at the <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a>."
(9 words, correct store link)

🚨 NEVER DO THIS:
"For SD-WAN support, visit the eSIM store at https://epicplatform.sat-elite.io/estore"
(WRONG! SD-WAN should go to Kogntive KB, not eSIM store!)

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
      systemPrompt += '\n\n🚨 USER CLICKED TECHNICAL SUPPORT: First ask: "Is this for EPIC SD-WAN or eSIM connectivity?" to determine which product. DO NOT send links yet. Most technical issues are SD-WAN related.';
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

