from rest_framework import serializers # type: ignore
from .models import Test, Question, Answer
from apps.results.models import Result
import json

class TestListSerializer(serializers.ModelSerializer):
    total_questions = serializers.IntegerField(source='question_count', read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'main_topic', 'sub_topic',
            'specific_topic', 'level', 'is_active', 'created_by',
            'created_at', 'updated_at', 'total_questions'
        ]


class CompletedTestSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title')
    test_description = serializers.CharField(source='test.description')
    test_main_topic = serializers.CharField(source='test.main_topic')
    test_sub_topic = serializers.CharField(source='test.sub_topic')
    test_specific_topic = serializers.CharField(source='test.specific_topic')
    test_level = serializers.CharField(source='test.level')
    test_created_at = serializers.DateTimeField(source='test.created_at')
    total_questions = serializers.IntegerField(source='test.questions.count', read_only=True)
    score_percent = serializers.SerializerMethodField()
    score_rounded = serializers.SerializerMethodField()
    attempt_position = serializers.IntegerField(read_only=True)
    total_attempts = serializers.IntegerField(read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'user_id', 'test_id', 'correct_answers', 'wrong_answers',
            'time_taken', 'status', 'started_at', 'updated_at',
            'test_title', 'test_description', 'test_main_topic', 'test_sub_topic',
            'test_specific_topic', 'test_level', 'test_created_at',
            'total_questions', 'score_percent', 'score_rounded',
            'attempt_position', 'total_attempts'
        ]

    def get_score_percent(self, obj):
        total = obj.correct_answers + obj.wrong_answers
        if total == 0:
            return 0.0
        return round((obj.correct_answers / total) * 100, 2)

    def get_score_rounded(self, obj):
        total = obj.correct_answers + obj.wrong_answers
        if total == 0:
            return 0
        return round((obj.correct_answers / total) * 100)


class InProgressTestSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title')
    test_description = serializers.CharField(source='test.description')
    test_main_topic = serializers.CharField(source='test.main_topic')
    test_sub_topic = serializers.CharField(source='test.sub_topic')
    test_specific_topic = serializers.CharField(source='test.specific_topic')
    test_level = serializers.CharField(source='test.level')
    test_created_at = serializers.DateTimeField(source='test.created_at')
    total_questions = serializers.IntegerField(source='test.questions.count', read_only=True)
    answered_count = serializers.SerializerMethodField()
    remaining_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            'id', 'user_id', 'test_id', 'time_taken', 'status',
            'started_at', 'updated_at',
            'test_title', 'test_description', 'test_main_topic', 'test_sub_topic',
            'test_specific_topic', 'test_level', 'test_created_at',
            'total_questions', 'answered_count', 'remaining_count', 'progress'
        ]

    def get_answered_count(self, obj):
        if obj.answers:
            try:
                answers = json.loads(obj.answers) if isinstance(obj.answers, str) else obj.answers
                return len(answers) if answers else 0
            except:
                return 0
        return 0

    def get_remaining_count(self, obj):
        total = self.get_total_questions(obj)
        answered = self.get_answered_count(obj)
        return max(0, total - answered)

    def get_progress(self, obj):
        total = self.get_total_questions(obj)
        if total == 0:
            return 0.0
        answered = self.get_answered_count(obj)
        return round((answered / total) * 100, 2)

    def get_total_questions(self, obj):
        return obj.test.questions.count()




class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'answer_text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'answers']


class TestDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'main_topic', 'sub_topic',
            'specific_topic', 'level', 'is_active', 'created_by',
            'created_at', 'updated_at', 'questions'
        ]


class QuestionWithAnswersSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'answers']


class SaveResultInputSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.IntegerField(), required=False, default=dict)
    time_taken = serializers.IntegerField(required=False, default=0)
    status = serializers.ChoiceField(choices=['in_progress', 'completed', 'expired'])


class TestProgressSerializer(serializers.Serializer):
    test = TestDetailSerializer()  # reutilizamos el serializer existente
    answers = serializers.DictField()
    time_elapsed = serializers.IntegerField()
    progress = serializers.FloatField()
    is_resuming = serializers.BooleanField()
    result_id = serializers.IntegerField(required=False, allow_null=True)


# Serializers para administración
class AnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'answer_text', 'is_correct']

class QuestionCreateSerializer(serializers.ModelSerializer):
    answers = AnswerCreateSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'answers']

class TestCreateUpdateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'main_topic', 'sub_topic',
            'specific_topic', 'level', 'is_active', 'created_by',
            'created_at', 'updated_at', 'questions'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, data):
        # Validar que cada pregunta tenga exactamente una respuesta correcta
        questions = data.get('questions', [])
        for idx, q_data in enumerate(questions):
            answers = q_data.get('answers', [])
            correct_count = sum(1 for a in answers if a.get('is_correct', False))
            if correct_count != 1:
                raise serializers.ValidationError(
                    f"La pregunta {idx+1} debe tener exactamente una respuesta correcta (tiene {correct_count})"
                )
        return data

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        validated_data['created_by'] = self.context['request'].user
        test = Test.objects.create(**validated_data)
        for q_data in questions_data:
            answers_data = q_data.pop('answers')
            question = Question.objects.create(test=test, **q_data)
            for a_data in answers_data:
                Answer.objects.create(question=question, **a_data)
        return test

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        # Actualizar campos del test
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            # Obtener IDs de preguntas existentes
            existing_q_ids = list(instance.questions.values_list('id', flat=True))
            new_q_ids = []

            for q_data in questions_data:
                q_id = q_data.get('id')
                if q_id:
                    # Actualizar pregunta existente
                    try:
                        question = Question.objects.get(id=q_id, test=instance)
                    except Question.DoesNotExist:
                        continue
                    question.question_text = q_data.get('question_text', question.question_text)
                    question.save()
                    new_q_ids.append(q_id)
                    # Actualizar respuestas
                    answers_data = q_data.get('answers', [])
                    existing_a_ids = list(question.answers.values_list('id', flat=True))
                    new_a_ids = []
                    for a_data in answers_data:
                        a_id = a_data.get('id')
                        if a_id:
                            try:
                                answer = Answer.objects.get(id=a_id, question=question)
                            except Answer.DoesNotExist:
                                continue
                            answer.answer_text = a_data.get('answer_text', answer.answer_text)
                            answer.is_correct = a_data.get('is_correct', answer.is_correct)
                            answer.save()
                            new_a_ids.append(a_id)
                        else:
                            # Crear nueva respuesta
                            answer = Answer.objects.create(question=question, **a_data)
                            new_a_ids.append(answer.id)
                    # Eliminar respuestas que no están en la lista
                    Answer.objects.filter(question=question).exclude(id__in=new_a_ids).delete()
                else:
                    # Crear nueva pregunta
                    answers_data = q_data.pop('answers', [])
                    question = Question.objects.create(test=instance, **q_data)
                    new_q_ids.append(question.id)
                    for a_data in answers_data:
                        Answer.objects.create(question=question, **a_data)

            # Eliminar preguntas que no están en la lista
            Question.objects.filter(test=instance).exclude(id__in=new_q_ids).delete()

        return instance