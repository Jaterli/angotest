from rest_framework import serializers # type: ignore
from .models import Result
import json

class IncorrectAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    question_number = serializers.IntegerField()
    question_text = serializers.CharField()
    correct_answer_id = serializers.IntegerField(allow_null=True)
    correct_answer_text = serializers.CharField()
    user_answer_text = serializers.CharField()


class IncorrectAnswersSummarySerializer(serializers.Serializer):
    total_questions = serializers.IntegerField()
    total_correct = serializers.IntegerField()
    total_incorrect = serializers.IntegerField()
    questions_with_errors = serializers.IntegerField()
    score_percentage = serializers.FloatField()


class IncorrectAnswersResponseSerializer(serializers.Serializer):
    incorrect_questions = IncorrectAnswerSerializer(many=True)
    summary = IncorrectAnswersSummarySerializer()


class ResultListSerializer(serializers.ModelSerializer):
    user__username = serializers.CharField(source='user.username')
    user__email = serializers.CharField(source='user.email')
    user__first_name = serializers.CharField(source='user.first_name')
    user__last_name = serializers.CharField(source='user.last_name')
    user__role = serializers.CharField(source='user.role')
    test__title = serializers.CharField(source='test.title')
    test__description = serializers.CharField(source='test.description')
    test__main_topic = serializers.CharField(source='test.main_topic')
    test__sub_topic = serializers.CharField(source='test.sub_topic')
    test__specific_topic = serializers.CharField(source='test.specific_topic')
    test__level = serializers.CharField(source='test.level')
    total_questions = serializers.SerializerMethodField()
    score = serializers.FloatField(read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'user_id', 'test_id', 'correct_answers', 'wrong_answers',
            'time_taken', 'status', 'answers', 'started_at', 'updated_at',
            'user__username', 'user__email', 'user__first_name', 'user__last_name', 'user__role',
            'test__title', 'test__description', 'test__main_topic', 'test__sub_topic',
            'test__specific_topic', 'test__level',
            'total_questions', 'score'
        ]

    def get_total_questions(self, obj):
        return obj.test.questions.count()


class UserResultListSerializer(serializers.ModelSerializer):
    test__title = serializers.CharField(source='test.title')
    test__description = serializers.CharField(source='test.description')
    test__main_topic = serializers.CharField(source='test.main_topic')
    test__sub_topic = serializers.CharField(source='test.sub_topic')
    test__specific_topic = serializers.CharField(source='test.specific_topic')
    test__level = serializers.CharField(source='test.level')
    test__created_at = serializers.DateTimeField(source='test.created_at')
    total_questions = serializers.IntegerField(source='test.questions.count', read_only=True)
    score = serializers.FloatField(read_only=True)
    answered_count = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            'id', 'test_id', 'correct_answers', 'wrong_answers',
            'time_taken', 'status', 'started_at', 'updated_at',
            'test__title', 'test__description', 'test__main_topic', 'test__sub_topic',
            'test__specific_topic', 'test__level', 'test__created_at', 'total_questions',
            'score', 'answered_count'
        ]

    def get_answered_count(self, obj):
        if not obj.answers:
            return 0
        try:
            answers = json.loads(obj.answers) if isinstance(obj.answers, str) else obj.answers
        except (json.JSONDecodeError, TypeError):
            return 0
        return len(answers) if answers else 0
