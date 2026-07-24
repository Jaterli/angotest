from rest_framework import serializers # type: ignore
from .models import AIRequestLog
from apps.test.models import Test

class AIRequestLogSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True, allow_null=True)
    test_id = serializers.IntegerField(source='test.id', read_only=True, allow_null=True)

    class Meta:
        model = AIRequestLog
        fields = [
            'id', 'test_id', 'test_title', 'main_topic', 'sub_topic',
            'specific_topic', 'level', 'num_questions', 'num_answers',
            'language', 'generation_mode', 'status', 'error_message',
            'response_time', 'tokens_used', 'created_at', 'updated_at'
        ]


class AIRequestLogDetailSerializer(serializers.ModelSerializer):
    test = serializers.SerializerMethodField()
    input = serializers.SerializerMethodField()

    class Meta:
        model = AIRequestLog
        fields = [
            'id', 'test', 'input', 'ai_provider', 'ai_model',
            'status', 'error_message', 'response_time', 'tokens_used',
            'created_at', 'updated_at'
        ]

    def get_test(self, obj):
        if obj.test:
            return {
                'id': obj.test.id,
                'title': obj.test.title,
                'description': obj.test.description,
                'main_topic': obj.test.main_topic,
                'sub_topic': obj.test.sub_topic,
                'specific_topic': obj.test.specific_topic,
                'level': obj.test.level,
            }
        return None

    def get_input(self, obj):
        return {
            'main_topic': obj.main_topic,
            'sub_topic': obj.sub_topic,
            'specific_topic': obj.specific_topic,
            'level': obj.level,
            'num_questions': obj.num_questions,
            'num_answers': obj.num_answers,
            'language': obj.language,
            'generation_mode': obj.generation_mode,
            'ai_prompt': obj.ai_prompt,
        }


class GenerateAITestSerializer(serializers.Serializer):
    generation_mode = serializers.ChoiceField(choices=['guided', 'prompt'], default='guided')
    main_topic = serializers.CharField(required=False, allow_blank=True)
    sub_topic = serializers.CharField(required=False, allow_blank=True)
    specific_topic = serializers.CharField(required=False, allow_blank=True)
    level = serializers.ChoiceField(choices=['Principiante', 'Intermedio', 'Avanzado'])
    num_questions = serializers.IntegerField(min_value=5, max_value=50)
    num_answers = serializers.IntegerField(min_value=2, max_value=6)
    language = serializers.CharField(default='es')
    ai_prompt = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['generation_mode'] == 'guided':
            if not data.get('main_topic') or not data.get('sub_topic') or not data.get('specific_topic'):
                raise serializers.ValidationError(
                    "main_topic, sub_topic y specific_topic son obligatorios en modo guiado"
                )
        return data