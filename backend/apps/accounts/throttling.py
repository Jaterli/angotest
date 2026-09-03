# apps/accounts/throttling.py

from rest_framework.throttling import AnonRateThrottle


class ForgotPasswordRateThrottle(AnonRateThrottle):
    scope = 'forgot_password'