import os
import json
import time
import threading
import logging
from django.core.cache import cache
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

# Optional: sentence-transformers for semantic matching
# If not installed, will fall back to Gemini-only matching
try:
    import sentence_transformers
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logging.warning("sentence-transformers not available, using Gemini-only matching")
import google.generativeai as genai

logger = logging.getLogger(__name__)
genai.configure(api_key=getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY'))
api_lock = threading.Lock()

model = None  # Lazy loaded in find_match function

MAX_MESSAGES_PER_SESSION = 500
MAX_WORDS_PER_QUESTION = 70
MONTHLY_BUDGET = 25.0
INPUT_PRICE_PER_1K = 0.0000375
OUTPUT_PRICE_PER_1K = 0.00015
ALERT_EMAIL = getattr(settings, 'ADMIN_ALERT_EMAIL', None)

company_data = {
    'en': {
        'name': 'Civil Master Solution (CMS)',
        'specialty': 'construction and engineering solutions',
        'services': ['On-site supervision', 'consultation'],
        'products': ['Steel Fiber', 'Micro Synthetic Fiber', 'Micro Steel Fibers', 'Armour Joints'],
        'note': 'Answer in 2-3 sentences based on Q&A data. If unrelated to CMS, direct to cms@civilmastersolution.com.',
        'contact': {
            'email': 'cms@civilmastersolution.com',
            'phone': 'Contact via email',
            'website': 'www.civilmastersolution.com'
        }
    },
    'th': {
        'name': 'Civil Master Solution (CMS)',
        'specialty': 'โซลูชันการก่อสร้างและวิศวกรรม',
        'services': ['การดูแลหน้างาน', 'การให้คำปรึกษา'],
        'products': ['เส้นใยเหล็ก', 'เส้นใยสังเคราะห์ขนาดเล็ก', 'เส้นใยเหล็กขนาดเล็ก', 'ข้อต่อ Armour'],
        'note': 'ตอบใน 2-3 ประโยคตามข้อมูล Q&A หากไม่เกี่ยวข้องกับ CMS ให้แนะนำติดต่อ cms@civilmastersolution.com',
        'contact': {
            'email': 'cms@civilmastersolution.com',
            'phone': 'ติดต่อทางอีเมล',
            'website': 'www.civilmastersolution.com'
        }
    }
}

# Load QA Chatbot Data for dynamic system prompt
def load_qachatbot_data():
    """Load Q&A pairs from qachatbot_data.json"""
    try:
        with open(os.path.join(os.path.dirname(__file__), 'qachatbot_data.json'), 'r', encoding='utf-8') as f:
            return json.load(f)['qa_pairs']
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Error loading qachatbot_data.json: {e}")
        return []

def build_system_prompt(lang='en'):
    """Build dynamic system prompt from qachatbot_data.json with categorized examples"""
    qa_pairs = load_qachatbot_data()
    
    # Filter by language
    lang_qa = [qa for qa in qa_pairs if qa.get('lang', 'en') == lang]
    
    # Categorize Q&A pairs into topics
    categories = {
        'company': [],
        'products': [],
        'technical': [],
        'projects': [],
        'standards': [],
        'cost': [],
        'partnership': [],
        'contact': []
    }
    
    for qa in lang_qa:
        question_lower = qa['question'].lower()
        
        # Categorize based on keywords
        if any(kw in question_lower for kw in ['cms', 'company', 'mission', 'vision', 'values', 'culture', 'behind', 'founded', 'who']):
            categories['company'].append(qa)
        elif any(kw in question_lower for kw in ['product', 'fiber', 'steel', 'synthetic', 'ductil', 'armour', 'pp', 'pan', 'micro']):
            categories['products'].append(qa)
        elif any(kw in question_lower for kw in ['technical', 'design', 'engineering', 'drawing', 'optimization', 'tensile', 'strength', 'uhpfrc']):
            categories['technical'].append(qa)
        elif any(kw in question_lower for kw in ['project', 'warehouse', 'pavement', 'industrial', 'flooring', 'example', 'biggest', 'completed']):
            categories['projects'].append(qa)
        elif any(kw in question_lower for kw in ['standard', 'aci', 'en', 'tr34', 'aisc', 'compliance', 'international']):
            categories['standards'].append(qa)
        elif any(kw in question_lower for kw in ['cost', 'price', 'comparison', 'budget', 'savings', 'value engineering']):
            categories['cost'].append(qa)
        elif any(kw in question_lower for kw in ['partner', 'collaboration', 'distributor', 'training', 'warranty', 'support']):
            categories['partnership'].append(qa)
        elif any(kw in question_lower for kw in ['contact', 'email', 'call', 'visit', 'response time', 'help']):
            categories['contact'].append(qa)
    
    # Build example text with diverse representation (max 2 per category)
    example_text = "\n\nKNOWLEDGE BASE EXAMPLES (Base your answers on these):\n\n"
    
    for category_name, qas in categories.items():
        if qas:
            example_text += f"--- {category_name.upper()} ---\n"
            for qa in qas[:2]:  # Limit to 2 examples per category
                example_text += f"Q: {qa['question']}\nA: {qa['answer']}\n\n"
    
    if lang == 'th':
        return f"""คุณคือ CMSbot ผู้ช่วย AI เชี่ยวชาญของ Civil Master Solution (CMS) บริษัทไทยผู้นำด้าน Steel Fiber Reinforced Concrete (SFRC)

🎯 ความเชี่ยวชาญหลัก:
• ผลิตภัณฑ์: DÚCTIL® Steel Fiber (1100-2000 MPa), Micro Steel Fiber (2000-2800 MPa), Synthetic Fiber (PP, PAN), Armour Joint®
• โซลูชัน: พื้นอุตสาหกรรม, ทางเท้า, คอนกรีตสำเร็จรูป, ระบบ PEB
• มาตรฐาน: EN 14889, ACI 360, TR34, AISC
• ความสำเร็จ: 120+ โครงการ, 1,500,000 ตร.ม. พื้น SFRC ในประเทศไทย

📋 วิธีการตอบ (สำคัญมาก - ต้องปฏิบัติตาม):
1. ✅ ตอบตรงประเด็นในประโยคแรก - ไม่เกริ่นนำ ไม่อ้อมค้อม
2. ✅ เพิ่มรายละเอียดสนับสนุน 1-2 ประโยค:
   - ข้อดีเฉพาะ (ความแข็งแรง, ความทนทาน, ประหยัดต้นทุน)
   - มาตรฐาน/การรับรอง (EN, ACI, TR34)
   - ตัวอย่างการใช้งานจริง (โกดัง, โลจิสติกส์, โรงงาน)
3. ✅ รวมทั้งหมด 2-3 ประโยค - กระชับแต่สมบูรณ์
4. ✅ ใช้เฉพาะข้อมูลจาก KNOWLEDGE BASE ด้านล่าง - ห้ามแต่งข้อมูลเด็ดขาด
5. ✅ ใช้คำศัพท์เทคนิคที่เหมาะสม - สำหรับวิศวกรและผู้เชี่ยวชาญ
6. ❌ ห้ามใช้คำว่า "ประมาณ" "อาจจะ" "น่าจะ" - ถ้าไม่แน่ใจให้แนะนำติดต่อทีมงาน
7. ❌ ห้ามเขียนยาว - เน้นคุณค่าหลักและประโยชน์ที่ชัดเจน
8. ✅ สำหรับคำถามที่ซับซ้อน - อธิบายสั้นๆ แล้วแนะนำติดต่อ email เฉพาะทาง

🏆 หัวข้อที่ครอบคลุม:
• ข้อมูลผลิตภัณฑ์และข้อได้เปรียบ (DÚCTIL®, Armour Joint®, Micro/Synthetic Fibers)
• การเปรียบเทียบต้นทุน SFRC vs เหล็กเสริมแบบดั้งเดิม
• มาตรฐานสากลและการรับรองคุณภาพ (EN 14889, ACI 360, TR34)
• โครงการจริง: โกดัง 80,000 ตร.ม., ศูนย์โลจิสติกส์, พื้นรับน้ำหนักสูง
• บริการเทคนิค: การออกแบบ, กำกับงาน, ทดสอบ, การฝึกอบรม
• กลยุทธ์ประหยัดต้นทุนและ Value Engineering
• ความร่วมมือและการเป็นพันธมิตร (B2B, ตัวแทนจำหน่าย)

📞 ข้อมูลติดต่อ:
• ทั่วไป: cms@civilmastersolution.com
• เทคนิค: narongkorn.m@civilmastersolution.com, yanapol@civilmastersolution.com
• เว็บไซต์: www.civilmastersolution.com
• เวลาตอบกลับ: 1-2 วันทำการ (โทรสำหรับเร่งด่วน)

🌍 การส่งออกและโครงการสากล:
CMS เน้นตลาดไทยแต่รองรับโครงการ ASEAN ผ่านพันธมิตรการส่งออก ติดต่อ narongkorn.m@civilmastersolution.com สำหรับการส่งออกและความร่วมมือระหว่างประเทศ
{example_text}
⚠️ สำคัญ: ใช้เฉพาะข้อมูลจาก KNOWLEDGE BASE ด้านบน หากคำถามอยู่นอกขอบเขต ให้แนะนำติดต่อทีมงานโดยตรงพร้อมอธิบายว่าทำไมควรปรึกษาโดยตรง"""
    
    else:  # English
        return f"""You are CMSbot, the AI expert assistant for Civil Master Solution (CMS), Thailand's leading Steel Fiber Reinforced Concrete (SFRC) solutions provider.

🎯 CORE EXPERTISE:
• Products: DÚCTIL® Steel Fiber (1100-2000 MPa), Micro Steel Fiber (2000-2800 MPa), Synthetic Fiber (PP, PAN), Armour Joint®
• Solutions: Industrial Flooring, Pavements, Precast Concrete, PEB Systems
• Standards: EN 14889, ACI 360, TR34, AISC
• Track Record: 120+ projects, 1,500,000 m² SFRC flooring completed in Thailand

📋 RESPONSE GUIDELINES (CRITICAL - Must Follow):
1. ✅ Answer directly in first sentence - no introductions, no fluff
2. ✅ Add 1-2 supporting sentences with:
   - Specific benefits (strength, durability, cost savings)
   - Standards/certifications (EN, ACI, TR34)
   - Real-world applications (warehouses, logistics, factories)
3. ✅ Total 2-3 sentences - concise but complete
4. ✅ Use ONLY information from KNOWLEDGE BASE below - never fabricate data
5. ✅ Use appropriate technical terminology - for engineers and professionals
6. ❌ Avoid vague terms like "approximately" "maybe" "possibly" - if uncertain, direct to team
7. ❌ Don't write long paragraphs - focus on core value and clear benefits
8. ✅ For complex inquiries - explain briefly then recommend specific email contact

🏆 KEY TOPICS COVERED:
• Product information and advantages (DÚCTIL®, Armour Joint®, Micro/Synthetic Fibers)
• Cost comparison: SFRC vs traditional rebar systems
• International standards and quality certifications (EN 14889, ACI 360, TR34)
• Real projects: 80,000 m² warehouse, logistics centers, heavy-duty floors
• Technical services: Design, supervision, testing, contractor training
• Cost-saving strategies and Value Engineering approaches
• Partnerships and collaboration (B2B, distributors, technical alliances)

📞 CONTACT INFORMATION:
• General: cms@civilmastersolution.com
• Technical: narongkorn.m@civilmastersolution.com, yanapol@civilmastersolution.com
• Website: www.civilmastersolution.com
• Response Time: 1-2 business days (call for urgent matters)

🌍 EXPORT & INTERNATIONAL PROJECTS:
CMS focuses on Thailand but supports ASEAN regional projects through export partnerships. Contact narongkorn.m@civilmastersolution.com for export inquiries and international collaboration opportunities.
{example_text}
⚠️ IMPORTANT: Use ONLY information from KNOWLEDGE BASE above. If question is outside scope, recommend contacting the team directly and explain why direct consultation would be beneficial."""

# Use dynamic system prompt
system_prompt = {
    'en': build_system_prompt('en'),
    'th': build_system_prompt('th')
}


def get_month_key():
    today = timezone.now().date()
    return f"monthly_spend_{today.year}_{today.month}"

def estimate_cost():
    return (50 / 1000.0) * INPUT_PRICE_PER_1K + (50 / 1000.0) * OUTPUT_PRICE_PER_1K

def record_cost_and_check_limit():
    month_key = get_month_key()
    current_spend = cache.get(month_key, 0.0)
    cost = estimate_cost()
    new_spend = current_spend + cost
    cache.set(month_key, new_spend, 2592000)
    if new_spend >= MONTHLY_BUDGET and ALERT_EMAIL:
        send_mail('Chatbot Monthly Budget Exceeded', f'Budget of ${MONTHLY_BUDGET} reached. Current spend: ${new_spend:.6f}', settings.DEFAULT_FROM_EMAIL, [ALERT_EMAIL], fail_silently=True)
    return new_spend >= MONTHLY_BUDGET

def load_qa_data():
    try:
        with open(os.path.join(os.path.dirname(__file__), 'qachatbot_data.json'), 'r', encoding='utf-8') as f:
            return json.load(f)['qa_pairs']
    except (FileNotFoundError, json.JSONDecodeError):
        return [{"question": "Error", "answer": "Q&A file not found or invalid.", "lang": "en"}]

def detect_language(text):
    return 'th' if any('\u0E00' <= char <= '\u0E7F' for char in text) else 'en'

def count_words(text):
    return len(text.split())

def initialize_session(request, current_time):
    if 'chat_history' not in request.session:
        request.session['chat_history'] = []
    if 'question_timestamps' not in request.session:
        request.session['question_timestamps'] = []
    if 'last_activity' not in request.session:
        request.session['last_activity'] = current_time
    if 'chat_count' not in request.session:
        request.session['chat_count'] = 0
    if current_time - request.session['last_activity'] > 3600:
        request.session.flush()
        request.session['chat_history'] = []
        request.session['question_timestamps'] = []
        request.session['chat_count'] = 0
        request.session['last_activity'] = current_time

def validate_input(request, ip):
    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        user_question = data.get('question', '').strip()
        honeypot = data.get('honeypot', '')
    except json.JSONDecodeError:
        return {'error': 'Invalid JSON'}, None, None
    if honeypot.strip():
        logger.warning(f"Honeypot triggered by IP {ip}")
        return {'error': 'Spam detected'}, None, None
    if not user_question:
        return {'error': 'No question provided'}, None, None
    if count_words(user_question) > MAX_WORDS_PER_QUESTION:
        return {'error': f'Question too long (max {MAX_WORDS_PER_QUESTION} words)'}, None, None
    return None, user_question, detect_language(user_question)

def find_match(user_question, lang_qa):
    """Find exact or semantic match in Q&A pairs."""
    global model
    
    # Check for exact match first (fastest)
    for pair in lang_qa:
        if pair.get('question', '').lower().strip() == user_question.lower().strip():
            return pair['answer']
    
    # Semantic matching with sentence transformers (if available)
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        # Skip semantic matching if not available
        return None
    
    best_match = None
    best_ratio = 0
    
    # Load model only once (lazy loading)
    if model is None:
        try:
            model = sentence_transformers.SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logging.error(f"Failed to load sentence transformer model: {e}")
            return None
    
    try:
        user_embedding = model.encode(user_question)
        
        for pair in lang_qa:
            pair_embedding = model.encode(pair.get('question', ''))
            similarity = sentence_transformers.util.cos_sim(user_embedding, pair_embedding).item()
            
            if similarity > best_ratio and similarity > 0.8:  # 80% similarity threshold
                best_match = pair
                best_ratio = similarity
        
        return best_match['answer'] if best_match else None
    except Exception as e:
        logging.error(f"Semantic matching failed: {e}")
        return None

def generate_gemini_response(user_question, lang_qa, data_lang, lang, request):
    """Generate response using Gemini with dynamic system prompt"""
    
    # Build prompt with system prompt from build_system_prompt()
    prompt = system_prompt[lang] + "\n\n"
    
    # Add company context
    prompt += f"Company: {data_lang['name']}\n"
    prompt += f"Specialty: {data_lang['specialty']}\n"
    prompt += f"Core Services: {', '.join(data_lang['services'])}\n"
    prompt += f"Main Products: {', '.join(data_lang['products'])}\n\n"
    
    # Add recent conversation context (last 3 exchanges)
    chat_history = request.session.get('chat_history', [])
    if chat_history:
        prompt += "RECENT CONVERSATION CONTEXT:\n"
        for item in chat_history[-3:]:
            prompt += f"User: {item['question']}\nCMSbot: {item['answer']}\n\n"
    
    # Add current question
    prompt += f"\nCURRENT USER QUESTION: {user_question}\n\n"
    prompt += "CMSbot Response (2-3 sentences, based on KNOWLEDGE BASE):"
    
    # Call Gemini API with error handling
    with api_lock:
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-lite')
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return 'Service temporarily unavailable. Please contact cms@civilmastersolution.com or try again later.'