const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SAT_ELITE_CONTEXT = `You are Captain Connect, a friendly AI assistant for Sat-Elite specializing in satellite connectivity and networking solutions.

🚨 CORE RULES:
1. Keep responses under 25 words when possible
2. Use HTML hyperlinks: <a href="URL">text</a>
3. NEVER show raw URLs
4. Ask engaging questions to understand customer needs
5. Always offer to collect contact info for follow-up

SAT-ELITE PRODUCTS & SERVICES:

1. **Starlink** - SpaceX satellite internet service
2. **OneWeb** - Low Earth orbit satellite connectivity
3. **VSAT** - Very Small Aperture Terminal satellite communications
4. **5G SIM** - Mobile data connectivity via eSIM
5. **SD-WAN** - Software-Defined Wide Area Network (EPIC SD-WAN)
6. **Professional Services** - Custom integration and consultation
7. **Technical Support** - Help with existing products/configurations

CONVERSATION FLOW:

When user selects a product category, ask engaging questions:
- Starlink: "Interested in Starlink for maritime, enterprise, or remote locations?"
- OneWeb: "What's your coverage area? OneWeb offers global low-latency connectivity."
- VSAT: "Looking for maritime VSAT or land-based solutions?"
- 5G SIM: "Need eSIM for international travel or IoT devices?"
- SD-WAN: "Interested in EPIC Box for network optimization?"
- Professional Services: "What kind of project? Installation, integration, or consulting?"
- Technical Support: "What product do you need help with?"

PRICING & SALES RESPONSES:

For pricing inquiries:
"For current pricing and quotes, contact our sales team at <a href='mailto:sales@sat-elite.io'>sales@sat-elite.io</a>."

For EPIC Box product:
"The EPIC Box includes: SD-WAN controller, 1-year Enterprise subscription, professional configuration & installation, and 24/7 support—all for €2,999."

For 5G SIM:
"Browse eSIM plans at the <a href='https://epicplatform.sat-elite.io/estore'>EPIC Platform</a>."

TECHNICAL SUPPORT:

For technical questions:
1. Ask specific diagnostic questions
2. Search Kogntive Knowledge Base
3. If article found, summarize key points and provide link
4. Use format: "According to our knowledge base, [summary]. Full guide: <a href='KB_URL'>article name</a>"
5. If not found: "I couldn't find a specific guide. Contact <a href='mailto:sales@sat-elite.io'>technical support</a> for help."

Knowledge Base: <a href="https://kb.kognitive.net/?l=en">Kogntive KB</a>

LEAD CAPTURE:

For ANY product inquiry, after answering questions, ask:
"I'd love to help further! May I have your name and email so our team can follow up with detailed information?"

Store conversation history to provide context-aware responses.

SHOWING OPTIONS/MENU:

If user asks "anything else", "what else", "show options", or wants to see other products:
DO NOT list products as text. Instead say:
"Let me show you our full menu of products and services!"

The frontend will automatically display interactive buttons. Never generate numbered lists of products.

HYPERLINK EXAMPLES:

✅ "Contact <a href='mailto:sales@sat-elite.io'>sales@sat-elite.io</a> for pricing."
✅ "See the <a href='https://kb.kognitive.net/es7/...'>setup guide</a> for details."
✅ "Browse <a href='https://epicplatform.sat-elite.io/estore'>eSIM plans</a>."

❌ "Visit https://sat-elite.io"
❌ "Email sales@sat-elite.io"

TONE: Professional, engaging, helpful. Build rapport and understand customer needs before offering solutions.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Detect product category and conversation type
    const isTechnical = /technical support|error|problem|issue|reset|configure|setup|how do i|troubleshoot/i.test(message);
    const isPricing = /pricing|price|cost|quote|how much/i.test(message);
    const is5GSIM = /5g sim|esim|sim card|mobile data/i.test(message);
    
    // Build context based on conversation type
    let systemPrompt = SAT_ELITE_CONTEXT;
    
    if (isTechnical) {
      systemPrompt += '\n\n🚨 TECHNICAL SUPPORT: Ask what product they need help with. Then search Kogntive KB. Summarize findings and provide KB article link.';
    }
    
    if (isPricing) {
      systemPrompt += '\n\n💰 PRICING INQUIRY: After understanding needs, direct to sales@sat-elite.io. If SD-WAN product, mention EPIC Box at €2,999.';
    }
    
    if (is5GSIM) {
      systemPrompt += '\n\n📱 5G SIM INQUIRY: Direct to EPIC Platform eStore. Ask if for travel, IoT, or other use case first.';
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
        max_tokens: 100, // Allow for engaging lead-gen conversations
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
        metadata: {
          isTechnical: isTechnical,
          isPricing: isPricing,
          is5GSIM: is5GSIM
        }
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
  res.send('✅ Sat-Elite Captain Connect - Lead Gen & Customer Support Chatbot (GPT-4o) - Running!');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    model: 'gpt-4o', 
    version: '3.0',
    type: 'lead-generation-support',
    features: [
      'multi-product-navigation',
      'kogntive-kb-search',
      'lead-capture',
      'conversation-history',
      'pricing-routing',
      'technical-support'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Captain Connect Backend running on port ${PORT}`);
  console.log(`📡 Ready to provide brief, professional assistance`);
});

