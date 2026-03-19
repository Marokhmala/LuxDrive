/**
 * LuxeDrive — Gemini AI Chatbot Integration
 * 
 * To use this, you must:
 * 1. Get an API Key from https://aistudio.google.com/app/apikey
 * 2. Paste it in the variable GEMINI_API_KEY below.
 */

// API Key ვინც მომპაროს დაგინებულია ბროებო :3
const GEMINI_API_KEY = "AIzaSyA3Hh1CvhfpaushxKPRwKxj-MR5twpRt-E";

const LuxDriveAI = {
    // System Prompt to define the AI's persona and knowledge
    SYSTEM_PROMPT: `You are the LuxeDrive Assistant, a professional and friendly AI for a luxury car rental company.
    Your goal is to help customers rent premium vehicles.
    
    Company Info:
    - Name: LuxeDrive
    - Services: Premium luxury car rentals, daily/weekly/monthly rates.
    - Locations: Tbilisi, Batumi, Kutaisi (Georgia).
    - Features: Newest models, full insurance, 24/7 support.
    
    Current Fleet Examples:
    - Mercedes-Benz S-Class: Ultimate luxury for executives.
    - BMW M4: High-performance sports coupe.
    - Mercedes GL (SUV): Perfect for mountain trips.
    - Range Rover Vogue: The pinnacle of luxury SUVs.
    
    Booking Info:
    - Requirements: Standard driver's license (min 2 years experience), ID/Passport.
    - Payment: Credit card or cash.
    
    Be helpful, use a premium tone. Keep answers concise. If you don't know something, suggest contacting hello@luxedrive.com.`,

    history: [],

    async sendMessage(userMessage) {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "NOKEY" || GEMINI_API_KEY.length < 10) {
            return "Please provide a valid Gemini API Key in js/chatbot.js to enable the AI.";
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            this.history.push({ role: "user", parts: [{ text: userMessage }] });

            const payload = {
                contents: [
                    { role: "user", parts: [{ text: this.SYSTEM_PROMPT }] },
                    { role: "model", parts: [{ text: "Understood. I am now the LuxeDrive Assistant." }] },
                    ...this.history
                ]
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.error) {
                console.error("Gemini Error:", data.error);
                return "I'm having a little trouble connecting to my brain. Please try again in a bit!";
            }

            const botResponse = data.candidates[0].content.parts[0].text;
            this.history.push({ role: "model", parts: [{ text: botResponse }] });

            return botResponse;
        } catch (error) {
            console.error("AI Error:", error);
            return "Something went wrong on my end. How about we try another question?";
        }
    }
};

/* ============================================================
   UI RENDERING
   ============================================================ */

function initChatbot() {
    // Inject HTML
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <div><span class="chatbot-dot"></span><h3>LuxeDrive AI</h3></div>
                <button class="chatbot-close" id="chatbot-toggle-close">
                    <i data-lucide="x" style="width:20px;height:20px;"></i>
                </button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chat-msg bot" data-author="LuxeDrive AI">Hello! I'm your LuxeDrive Assistant. How can I help you find the perfect car today?</div>
            </div>
            <form class="chatbot-input-area" id="chatbot-form">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Ask about cars, locations..." required>
                <button type="submit" class="chatbot-send" id="chatbot-send">
                    <i data-lucide="send" style="width:20px;height:20px;"></i>
                </button>
            </form>
        </div>
        <div class="chatbot-bubble" id="chatbot-toggle-btn" title="Chat with AI">
            <i data-lucide="message-square"></i>
        </div>
    `;
    document.body.appendChild(container);

    // Elements
    const windowEl = document.getElementById('chatbot-window');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-toggle-close');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');
    const sendBtn = document.getElementById('chatbot-send');

    // Toggle Logic
    const toggle = () => windowEl.classList.toggle('active');
    toggleBtn.onclick = toggle;
    closeBtn.onclick = toggle;

    // Form Handling
    form.onsubmit = async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        input.value = '';

        // Show typing indicator
        const typingId = showTyping();

        // Get AI response
        const response = await LuxDriveAI.sendMessage(text);

        // Remove typing and add bot response
        removeTyping(typingId);
        addMessage(response, 'bot');
    };

    function addMessage(text, role) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${role}`;
        msg.setAttribute('data-author', role === 'bot' ? 'LuxeDrive AI' : 'You');
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'typing-indicator';
        div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Refresh icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Initialized on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
