from django.contrib import admin
from .models import Test, Question, Answer

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 1
    fields = ('answer_text', 'is_correct')
    max_num = 10

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('question_text',)
    show_change_link = True

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'test', 'question_preview', 'answer_count')
    search_fields = ('question_text', 'test__title')
    list_filter = ('test',)
    inlines = [AnswerInline]

    def question_preview(self, obj):
        return obj.question_text[:50] + ('...' if len(obj.question_text) > 50 else '')
    question_preview.short_description = 'Pregunta'

    def answer_count(self, obj):
        return obj.answers.count()
    answer_count.short_description = 'Respuestas'

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'answer_preview', 'is_correct')
    list_filter = ('is_correct', 'question__test')
    search_fields = ('answer_text', 'question__question_text')

    def answer_preview(self, obj):
        return obj.answer_text[:50] + ('...' if len(obj.answer_text) > 50 else '')
    answer_preview.short_description = 'Respuesta'

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'level', 'main_topic', 'sub_topic', 'specific_topic', 'created_by', 'is_active', 'total_questions', 'created_at')
    list_filter = ('level', 'is_active', 'main_topic', 'sub_topic', 'created_at')
    search_fields = ('title', 'description', 'main_topic', 'sub_topic', 'specific_topic', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at', 'total_questions')
    ordering = ('-created_at',)
    inlines = [QuestionInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'level', 'created_by')
        }),
        ('Temática', {
            'fields': ('main_topic', 'sub_topic', 'specific_topic')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def total_questions(self, obj):
        return obj.total_questions
    total_questions.short_description = 'Nº preguntas'