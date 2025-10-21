import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ VERIFIED KOGNTIVE KB LINKS - Only links confirmed to work
const VERIFIED_KB_LINKS = {
  main: 'https://kb.kognitive.net/?l=en',
  
  // Only add specific article links here after verifying they exist
  // Format: 'topic-keyword': 'full-url'
  
  // Example (commented out until verified):
  // 'traffic-policy': 'https://kb.kognitive.net/es7/creating-a-new-network-traffic-policy',
  // 'initial-setup': 'https://kb.kognitive.net/es7/initial-configuration',
};

// 🎯 SAT-ELITE CHATBOT CONTEXT
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
5. **EPIC SD-WAN** - Software-Defined Wide Area Network (EPIC Box)
6. **Professional Services** - Custom integration and consultation
7. **Technical Support** - Help with existing products/configurations

CONVERSATION FLOW:

When user selects a product category, ask engaging questions:
- Starlink: "Interested in Starlink for maritime, enterprise, or remote locations?"
- OneWeb: "What's your coverage area? OneWeb offers global low-latency connectivity."
- VSAT: "Looking for maritime VSAT or land-based solutions?"
- 5G SIM: "Need eSIM for international travel or IoT devices?"
- EPIC SD-WAN: "Interested in EPIC Box for network optimization?"
- Professional Services: "What kind of project? Installation, integration, or consulting?"
- Technical Support: "What product do you need help with?"

PRICING & SALES RESPONSES:

For pricing inquiries:
"For current pricing and quotes, contact our sales team at <a href='mailto:sales@sat-elite.io'>sales@sat-elite.io</a>."

For EPIC Box product:
"The EPIC Box includes: SD-WAN controller, 1-year Enterprise subscription, professional configuration & installation, and 24/7 support—all for €2,999."

For 5G SIM:
"Browse eSIM plans at the <a href='https://epicplatform.sat-elite.io/estore'>EPIC Platform</a>."

TECHNICAL SUPPORT - CRITICAL RULES:

🚨 **KNOWLEDGE BASE LINK RULES:**

1. **ONLY use verified KB links** - Never make up or guess article URLs
2. **For most technical issues**: Direct users to search the KB themselves
3. **Main KB link**: <a href="https://kb.kognitive.net/?l=en">Kogntive Knowledge Base</a>

**Format for technical support responses:**

For SD-WAN issues:
"Let me help! First, search the <a href='https://kb.kognitive.net/?l=en'>Knowledge Base</a> for '[search term]'. If you can't find it, email <a href='mailto:sales@sat-elite.io'>technical support</a>."

For eSIM connectivity:
"Check the <a href='https://epicplatform.sat-elite.io/estore'>EPIC Platform</a> for eSIM support."

**Never say:** "Visit this guide: [made-up-URL]"
**Always say:** "Search our KB for '[topic]' or contact support directly."

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
✅ "Search the <a href='https://kb.kognitive.net/?l=en'>Knowledge Base</a> for help."
✅ "Browse <a href='https://epicplatform.sat-elite.io/estore'>eSIM plans</a>."

❌ "Visit https://sat-elite.io"
❌ "Check this guide: https://kb.kognitive.net/some-random-article"
❌ "Email sales@sat-elite.io"

TONE: Professional, engaging, helpful. Build rapport and understand customer needs before offering solutions.`;

// 🤖 Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build conversation context for OpenAI
    const messages = [
      { role: 'system', content: SAT_ELITE_CONTEXT },
      ...conversationHistory.map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Detect intent for enhanced responses
    const isTechnical = /technical|support|help|issue|problem|not working|error|troubleshoot|fix/i.test(message);
    const isSDWAN = /sd-wan|sdwan|epic box|network|routing|vpn|firewall|wan|traffic|policy/i.test(message);
    const isPricing = /price|pricing|cost|how much|quote|€|euro|\$/i.test(message);
    const is5GSIM = /esim|5g|sim|mobile|cellular|data plan/i.test(message);

    // Build system prompt with context-aware enhancements
    let systemPrompt = SAT_ELITE_CONTEXT;

    // 🚨 Technical Support Override - Force diagnostic questions
    if (/^(technical support|i need technical support)/i.test(message.trim())) {
      systemPrompt += '\n\n🚨 USER CLICKED TECHNICAL SUPPORT: First ask: "Is this for EPIC SD-WAN or eSIM connectivity?" to determine which product. DO NOT send links yet. Most technical issues are SD-WAN related.';
    }

    // 🚨 Menu Override - Show buttons, not text list
    if (/anything else|what else|show (?:me )?(?:the )?options|show (?:me )?(?:the )?menu|other (?:products|services)|what (?:do you|can you) offer/i.test(message)) {
      systemPrompt += '\n\n🚨 USER IS ASKING FOR MENU/OPTIONS: Respond ONLY with: "Let me show you our full menu of products and services!" (The frontend will then display the buttons). DO NOT list products as text.';
    }

    // 🚨 SD-WAN Technical Issue Override
    if (isTechnical && isSDWAN) {
      systemPrompt += '\n\n🚨 SD-WAN TECHNICAL ISSUE DETECTED: Ask diagnostic questions first (e.g., "What specific issue are you experiencing?"). Then direct them to SEARCH the Knowledge Base themselves using: <a href="https://kb.kognitive.net/?l=en">Knowledge Base</a>. NEVER provide specific article links unless they are in the verified list.';
    }

    // 🚨 eSIM Technical Issue Override
    if (isTechnical && is5GSIM) {
      systemPrompt += '\n\n🚨 eSIM TECHNICAL ISSUE: Direct to <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a> for eSIM support. If they need human help, ask for their email.';
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(1)],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0].message.content;

    // Return response with metadata
    res.json({
      response: aiResponse,
      metadata: {
        isTechnical,
        isSDWAN,
        isPricing,
        is5GSIM
      }
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// 🏥 Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sat-Elite Captain Connect Chatbot',
    version: '3.1',
    timestamp: new Date().toISOString(),
    features: [
      'OpenAI GPT-4o Integration',
      'Multi-product lead generation flow',
      'Technical support diagnostics',
      'Verified KB links only (no 404s)',
      'Hyperlinked responses',
      'Brief, conversational tone',
      'Interactive menu buttons'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sat-Elite Chatbot Backend running on port ${PORT}`);
  console.log(`📡 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});
