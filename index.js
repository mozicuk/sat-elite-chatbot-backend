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
1. Keep responses under 30 words when possible
2. Use HTML hyperlinks: <a href="URL">text</a>
3. NEVER show raw URLs
4. Engage naturally based on customer details (name, vessel/company, location)
5. Provide solutions based on Sat-Elite marketing materials
6. Ask qualifying questions to understand specific needs

CONVERSATION FLOW:

The chatbot first collects:
- First name
- Vessel or company name
- Location or operational region

Then presents 5 service categories:

1. **SATELLITE** - Includes Starlink, OneWeb, and VSAT solutions
   - Starlink: High-speed LEO satellite internet for maritime, enterprise, remote locations
   - OneWeb: Global LEO coverage with low latency
   - VSAT: Traditional satellite communications for maritime and land-based operations
   
2. **SIM** - Mobile connectivity via eSIM/5G
   - Global eSIM data plans for travel and IoT
   - Available through EPIC Platform eStore
   
3. **SD-WAN** - EPIC SD-WAN networking solutions
   - EPIC Box: €2,999 (includes SD-WAN controller, 1-year Enterprise subscription, installation, 24/7 support)
   - Network optimization, multi-WAN management
   
4. **PROFESSIONAL SERVICES** - Custom integration and consulting
   - Installation and configuration
   - Network design and integration
   - Ongoing consultation and support
   
5. **TECHNICAL SUPPORT** - Help with existing products
   - For SD-WAN: Direct to <a href="https://kb.kognitive.net/?l=en">Knowledge Base</a>
   - For eSIM: Direct to <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a>

RESPONSE STYLE:

When user selects a service:
- Reference their details (name, vessel/company, location) to personalize
- Ask specific qualifying questions about their needs
- Provide relevant solutions from Sat-Elite offerings
- Be consultative and engaging, not just transactional

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
    const { message, conversationHistory = [], userData = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build system prompt with user context
    let systemPromptWithContext = SAT_ELITE_CONTEXT;
    
    // Add user details to system prompt if available
    if (userData.firstName || userData.vesselOrCompany || userData.location) {
      systemPromptWithContext += '\n\n🔹 CUSTOMER DETAILS (DO NOT ASK FOR THESE AGAIN):\n';
      if (userData.firstName) {
        systemPromptWithContext += `- First Name: ${userData.firstName}\n`;
      }
      if (userData.vesselOrCompany) {
        systemPromptWithContext += `- Vessel/Company: ${userData.vesselOrCompany}\n`;
      }
      if (userData.location) {
        systemPromptWithContext += `- Location/Region: ${userData.location}\n`;
      }
      systemPromptWithContext += '\nUse these details naturally in your responses. NEVER ask for this information again.';
    }

    // Build conversation context for OpenAI
    const messages = [
      { role: 'system', content: systemPromptWithContext },
      ...conversationHistory,  // Frontend already sends correct format: { role, content }
      { role: 'user', content: message }
    ];

    // Detect intent for enhanced responses
    const isTechnical = /technical|support|help|issue|problem|not working|error|troubleshoot|fix/i.test(message);
    const isSatellite = /satellite|starlink|oneweb|vsat|maritime|offshore/i.test(message);
    const isSIM = /sim|esim|5g|mobile|cellular|data plan/i.test(message);
    const isSDWAN = /sd-wan|sdwan|epic box|network|routing|vpn|firewall|wan|traffic|policy/i.test(message);
    const isProfServices = /professional|services|installation|integration|consulting/i.test(message);
    const isPricing = /price|pricing|cost|how much|quote|€|euro|\$/i.test(message);

    // Add context-aware enhancements to system prompt
    // 🚨 Technical Support Override - Force diagnostic questions
    if (/^(technical support|i need technical support)/i.test(message.trim())) {
      systemPromptWithContext += '\n\n🚨 USER CLICKED TECHNICAL SUPPORT: First ask: "Is this for EPIC SD-WAN or eSIM connectivity?" to determine which product. DO NOT send links yet. Most technical issues are SD-WAN related.';
    }

    // 🚨 Menu Override - Show buttons, not text list
    if (/anything else|what else|show (?:me )?(?:the )?options|show (?:me )?(?:the )?menu|other (?:products|services)|what (?:do you|can you) offer/i.test(message)) {
      systemPromptWithContext += '\n\n🚨 USER IS ASKING FOR MENU/OPTIONS: Respond ONLY with: "Let me show you our full menu of products and services!" (The frontend will then display the buttons). DO NOT list products as text.';
    }

    // 🚨 Satellite Service Override
    if (isSatellite) {
      systemPromptWithContext += '\n\n🚨 SATELLITE SERVICE: Ask which type they need (Starlink/OneWeb/VSAT) and their specific use case (maritime, enterprise, remote). Tailor response to their vessel/company and location.';
    }

    // 🚨 SIM Service Override
    if (isSIM) {
      systemPromptWithContext += '\n\n🚨 SIM/eSIM SERVICE: Direct to <a href="https://epicplatform.sat-elite.io/estore">EPIC Platform</a> for plans. Ask about their use case (travel, IoT, backup connectivity).';
    }

    // 🚨 SD-WAN Service Override
    if (isSDWAN && !isTechnical) {
      systemPromptWithContext += '\n\n🚨 SD-WAN SERVICE: Mention EPIC Box (€2,999). Ask about their networking needs. For technical issues, direct to <a href="https://kb.kognitive.net/?l=en">Knowledge Base</a>.';
    }

    // 🚨 SD-WAN Technical Issue Override
    if (isTechnical && isSDWAN) {
      systemPromptWithContext += '\n\n🚨 SD-WAN TECHNICAL ISSUE: Ask diagnostic questions first. Then direct to <a href="https://kb.kognitive.net/?l=en">Knowledge Base</a> for solutions. NEVER guess article links.';
    }

    // 🚨 Professional Services Override
    if (isProfServices) {
      systemPromptWithContext += '\n\n🚨 PROFESSIONAL SERVICES: Ask about their project needs (installation, integration, consulting). Offer to connect with sales team at <a href="mailto:sales@sat-elite.io">sales@sat-elite.io</a>.';
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
        messages,  // Already includes systemPromptWithContext
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
        isSatellite,
        isSIM,
        isSDWAN,
        isProfServices,
        isPricing
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
    version: '4.1',
    timestamp: new Date().toISOString(),
    features: [
      'OpenAI GPT-4o Integration',
      'Lead qualification (name, vessel/company, location)',
      'User data persistence (localStorage)',
      'AI aware of collected user details',
      '5 service categories (Satellite, SIM, SD-WAN, Prof Services, Tech Support)',
      'Personalized consultative conversations',
      'Technical support routing',
      'Verified KB links only',
      'Hyperlinked responses',
      'Marketing-focused solutions'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sat-Elite Chatbot Backend running on port ${PORT}`);
  console.log(`📡 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});
