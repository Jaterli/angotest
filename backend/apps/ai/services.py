# ai/services.py
import json
import os
import requests
from django.db import transaction
from datetime import datetime
from typing import Dict, Any, Tuple
from django.db.models import F
from apps.test.models import Test, Question, Answer
from apps.admin_panel.models import SystemConfig, UserQuota
from apps.shared.models import get_main_topics, get_topics, insert_or_update_topic, invalidate_topics_cache
from apps.admin_panel.utils import SystemConfigManager

# Configuración de proveedores de IA
class AIProviderConfig:
    def __init__(self, name, api_key, base_url, model, max_tokens=8000, temperature=0.5):
        self.name = name
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature

def get_ai_provider():
    """Obtiene la configuración del proveedor de IA"""
    groq_api_key = os.getenv('GROQ_API_KEY')
    if groq_api_key:
        return AIProviderConfig(
            name='groq',
            api_key=groq_api_key,
            base_url=os.getenv('GROQ_BASE_URL', 'https://api.groq.com/openai/v1/chat/completions'),
            model='openai/gpt-oss-120b', #os.getenv('GROQ_MODEL', 'mixtral-8x7b-32768'),
            max_tokens=int(os.getenv('AI_MAX_TOKENS', 8000)),
            temperature=float(os.getenv('AI_TEMPERATURE', 0.5))
        )
    return None

def get_system_prompt(provider: str) -> str:
    return """Eres un experto en tests educativos. Genera preguntas con exactamente una respuesta correcta.
Responde ÚNICAMENTE con JSON válido sin markdown.
Jerarquía de temas: main_topic > sub_topic > specific_topic.
Respuestas incorrectas: plausibles pero incorrectas."""


def build_prompt(input_data: Dict[str, Any]) -> str:
    """Construye el prompt para la IA"""
    language_names = {
        'es': 'español',
        'en': 'inglés',
        'fr': 'francés',
        'de': 'alemán',
        'it': 'italiano',
        'pt': 'portugués',
    }
    
    lang_name = language_names.get(input_data.get('language', 'es'), 'español')
    is_free_mode = input_data.get('generation_mode') == 'prompt' and input_data.get('ai_prompt')
    
    if is_free_mode:
        return build_free_mode_prompt(input_data, lang_name)
    else:
        return build_guided_mode_prompt(input_data, lang_name)

def build_free_mode_prompt(input_data: Dict[str, Any], lang_name: str) -> str:
    topics_summary = build_topics_summary()
    n_q = input_data.get('num_questions')
    n_a = input_data.get('num_answers')

    return f"""Genera un test educativo en {lang_name}.

CONTENIDO: {input_data.get('ai_prompt', '')}

{topics_summary}

CLASIFICACIÓN: Usa categorías existentes si encajan, si no crea una jerarquía nueva coherente (main_topic > sub_topic > specific_topic).

SPECS: dificultad={input_data.get('level')} | preguntas={n_q} | opciones/pregunta={n_a}

REGLAS:
- Exactamente {n_q} preguntas y {n_a} opciones cada una
- Solo 1 opción correcta por pregunta ("is_correct": true)
- Opciones incorrectas verosímiles pero claramente erróneas
- Sin opciones repetidas por pregunta

RESPONDE SOLO CON ESTE JSON:
{{"title":"...","description":"1-2 frases","main_topic":"...","sub_topic":"...","specific_topic":"...","questions":[{{"question_text":"...","answers":[{{"answer_text":"...","is_correct":true/false}}]}}]}}"""


def build_guided_mode_prompt(input_data: Dict[str, Any], lang_name: str) -> str:
    n_q = input_data.get('num_questions')
    n_a = input_data.get('num_answers')

    return f"""Genera un test educativo en {lang_name}.

TEMA: {input_data.get('main_topic')} > {input_data.get('sub_topic')} > {input_data.get('specific_topic')}
SPECS: dificultad={input_data.get('level')} | preguntas={n_q} | opciones/pregunta={n_a}

REGLAS:
- Exactamente {n_q} preguntas y {n_a} opciones cada una
- Solo 1 opción correcta ("is_correct": true), resto false
- Opciones incorrectas verosímiles pero claramente erróneas
- Sin opciones repetidas por pregunta

RESPONDE SOLO CON ESTE JSON:
{{"title":"...","description":"1-2 frases","questions":[{{"question_text":"...","answers":[{{"answer_text":"...","is_correct":true/false}}]}}]}}"""



def build_topics_summary() -> str:
    """Genera resumen de la jerarquía de temas existente"""
    try:
        hierarchy = get_topics(False)
        main_topics = get_main_topics()
        
        result = "ESTRUCTURA EDUCATIVA EXISTENTE (usar si el contenido encaja):\n\n"
        result += f"Temas principales disponibles ({len(main_topics)}):\n"
        for main in main_topics:
            result += f"- {main}\n"
        result += "\n"
        
        for main, subs in hierarchy.items():
            result += f"📚 {main}\n"
            for sub, specifics in subs.items():
                result += f"  ├─ 📖 {sub}\n"
                for spec in specifics[:5]:
                    result += f"  │   ├─ • {spec}\n"
                if len(specifics) > 5:
                    result += f"  │   └─ ... y {len(specifics)-5} temas específicos más\n"
            result += "\n"
        
        result += "INSTRUCCIÓN: Si el contenido del usuario encaja claramente con alguna de estas categorías, úsalas. "
        result += "Si no encaja perfectamente, crea una nueva jerarquía educativa coherente y descriptiva."
        
        return result
    except Exception as e:
        return "No se pudo cargar la estructura de temas existente."


# Lógica de quotas
def get_default_max_requests() -> int:
    """Obtiene el máximo de requests mensuales configurado (única fuente de verdad)."""
    try:
        config = SystemConfig.objects.get(key='AI_REQUESTS_PER_MONTH')
        return int(config.value)
    except SystemConfig.DoesNotExist:
        return SystemConfigManager.get('AI_REQUESTS_PER_MONTH')


def get_or_create_user_quota(user_id: int) -> UserQuota:
    """Obtiene la quota del usuario para el mes indicado, creándola si no existe."""
    month_year = datetime.now().strftime('%Y-%m')

    quota, _ = UserQuota.objects.get_or_create(
        user_id=user_id,
        month_year=month_year,
        defaults={
            'max_requests': get_default_max_requests(),
            'used_requests': 0,
        }
    )
    return quota


def quota_to_dict(quota: UserQuota) -> Dict[str, Any]:
    """Serializa una quota siempre con el mismo formato."""
    remaining = quota.max_requests - quota.used_requests
    return {
        'month_year': quota.month_year,
        'max_requests': quota.max_requests,
        'used_requests': quota.used_requests,
        'remaining_requests': remaining,
        'percentage_used': (quota.used_requests / quota.max_requests * 100) if quota.max_requests > 0 else 0,
    }


def check_quota_available(user_id: int) -> Tuple[bool, Dict[str, Any]]:
    """
    Verifica disponibilidad, NO modifica la base de datos.
    Retorna (disponible, datos_de_la_cuota).
    """
    quota = get_or_create_user_quota(user_id)
    available = quota.used_requests < quota.max_requests
    return available, quota_to_dict(quota)


@transaction.atomic
def consume_quota(user_id: int) -> Tuple[bool, Dict[str, Any]]:
    # Obtener o crear la cuota del mes actual
    quota = get_or_create_user_quota(user_id)

    # Verificar si hay cupo disponible
    if quota.used_requests >= quota.max_requests:
        return False, quota_to_dict(quota)

    # Incrementar atómicamente
    quota.used_requests = F('used_requests') + 1
    quota.save(update_fields=['used_requests'])
    
    # Refrescar para obtener el valor actualizado
    quota.refresh_from_db()
    return True, quota_to_dict(quota)


def generate_mock_test(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Genera un test mock para desarrollo"""
    main_topic = input_data.get('main_topic', 'General')
    sub_topic = input_data.get('sub_topic', 'General')
    specific_topic = input_data.get('specific_topic', 'General')
    num_questions = input_data.get('num_questions', 10)
    num_answers = input_data.get('num_answers', 4)
    level = input_data.get('level', 'Intermedio')
    
    questions = []
    for i in range(1, num_questions + 1):
        correct_index = i % num_answers
        answers = []
        for j in range(num_answers):
            is_correct = j == correct_index
            answers.append({
                'answer_text': f"Opción {chr(65+j)} {'(Correcta)' if is_correct else ''}",
                'is_correct': is_correct
            })
        
        questions.append({
            'question_text': f"Pregunta {i} sobre {specific_topic}",
            'answers': answers
        })
    
    return {
        'title': f"Test de {main_topic} - {sub_topic} - {specific_topic}",
        'description': f"Test sobre {main_topic}, en la categoría {sub_topic}, tema específico: {specific_topic}",
        'main_topic': main_topic,
        'sub_topic': sub_topic,
        'specific_topic': specific_topic,
        'questions': questions
    }

def make_ai_request(provider: AIProviderConfig, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Hace la solicitud a la API del proveedor"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {provider.api_key}'
    }
    
    if provider.name == 'groq':
        headers['User-Agent'] = 'AngoTest/1.0'
    
    response = requests.post(
        provider.base_url,
        json=payload,
        headers=headers,
        timeout=90
    )
    
    response.raise_for_status()
    return response.json()

def clean_ai_content(content: str) -> str:
    """Limpia el contenido de la respuesta de IA"""
    content = content.strip()
    
    # Eliminar bloques de código y texto adicional
    patterns = [
        '```json\n', '```json', '```\n', '```',
        'Here\'s the test in JSON format:',
        'Here is the test in JSON format:',
        'Generated test:',
        '```JSON',
    ]
    
    for pattern in patterns:
        if pattern in content:
            parts = content.split(pattern, 1)
            if len(parts) > 1:
                content = parts[1]
                break
    
    if content.endswith('```'):
        content = content[:-3]
    
    return content.strip()

def repair_json(content: str) -> str:
    """Intenta reparar JSON mal formado"""
    content = content.strip()
    
    if not content.startswith('{'):
        idx = content.find('{')
        if idx != -1:
            content = content[idx:]
    
    if not content.endswith('}'):
        idx = content.rfind('}')
        if idx != -1:
            content = content[:idx+1]
    
    # Reemplazar comillas simples por dobles
    content = content.replace("'", '"')
    
    return content

def parse_ai_response(result: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Parsea la respuesta de la IA"""
    # Extraer contenido
    content = ''
    if 'choices' in result and result['choices']:
        choice = result['choices'][0]
        if 'message' in choice and 'content' in choice['message']:
            content = choice['message']['content']
    
    if not content:
        return generate_mock_test(input_data)
    
    content = clean_ai_content(content)
    
    try:
        ai_response = json.loads(content)
    except json.JSONDecodeError:
        repaired = repair_json(content)
        try:
            ai_response = json.loads(repaired)
        except json.JSONDecodeError:
            return generate_mock_test(input_data)
    
    # Validar estructura
    if 'questions' not in ai_response or not ai_response['questions']:
        return generate_mock_test(input_data)
    
    is_free_mode = input_data.get('generation_mode') == 'prompt' and input_data.get('ai_prompt')
    
    # Determinar temas
    if is_free_mode:
        main_topic = ai_response.get('main_topic', input_data.get('main_topic', 'General'))
        sub_topic = ai_response.get('sub_topic', input_data.get('sub_topic', 'General'))
        specific_topic = ai_response.get('specific_topic', input_data.get('specific_topic', 'General'))
    else:
        main_topic = input_data.get('main_topic', 'General')
        sub_topic = input_data.get('sub_topic', 'General')
        specific_topic = input_data.get('specific_topic', 'General')
    
    # Procesar preguntas
    questions = []
    num_questions = input_data.get('num_questions', 10)
    num_answers = input_data.get('num_answers', 4)
    
    for q in ai_response.get('questions', [])[:num_questions]:
        if not q.get('question_text') or len(q.get('answers', [])) < num_answers:
            continue
        
        answers = []
        correct_count = 0
        
        for a in q['answers'][:num_answers]:
            is_correct = a.get('is_correct', False)
            if is_correct:
                correct_count += 1
            answers.append({
                'answer_text': a.get('answer_text', ''),
                'is_correct': is_correct
            })
        
        # Asegurar exactamente una respuesta correcta
        if correct_count != 1 and answers:
            if correct_count == 0:
                answers[0]['is_correct'] = True
            else:
                for i in range(1, len(answers)):
                    answers[i]['is_correct'] = False
        
        questions.append({
            'question_text': q['question_text'],
            'answers': answers
        })
    
    return {
        'title': ai_response.get('title', f"Test de {main_topic}"),
        'description': ai_response.get('description', ''),
        'main_topic': main_topic,
        'sub_topic': sub_topic,
        'specific_topic': specific_topic,
        'questions': questions
    }

def create_test_from_ai_response(ai_response: Dict[str, Any], user_id: int, input_data: Dict[str, Any]) -> Test:
    """Crea un test en la base de datos a partir de la respuesta de IA"""
    
    with transaction.atomic():
        # Crear el test
        test = Test.objects.create(
            title=ai_response.get('title', 'Test Generado por IA')[:250],
            description=ai_response.get('description', '')[:500],
            main_topic=ai_response.get('main_topic', input_data.get('main_topic', 'General')),
            sub_topic=ai_response.get('sub_topic', input_data.get('sub_topic', 'General')),
            specific_topic=ai_response.get('specific_topic', input_data.get('specific_topic', 'General')),
            level=input_data.get('level', 'Intermedio'),
            created_by_id=user_id,
            is_active=True
        )
        
        # Insertar topics si es modo libre
        is_free_mode = input_data.get('generation_mode') == 'prompt' and input_data.get('ai_prompt')
        if is_free_mode:
            try:
                insert_or_update_topic(
                    test.main_topic,
                    test.sub_topic,
                    test.specific_topic,
                    is_predefined=False
                )
                invalidate_topics_cache()
            except Exception:
                pass
        
        # Crear preguntas y respuestas
        for q_data in ai_response.get('questions', [])[:input_data.get('num_questions', 10)]:
            question = Question.objects.create(
                test=test,
                question_text=q_data.get('question_text', '')[:1000]
            )
            
            for a_data in q_data.get('answers', []):
                Answer.objects.create(
                    question=question,
                    answer_text=a_data.get('answer_text', '')[:500],
                    is_correct=a_data.get('is_correct', False)
                )
        
        return test