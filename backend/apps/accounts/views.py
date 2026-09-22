from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.accounts.models import Membership, Organization, User
from apps.accounts.serializers import (
    InviteMemberSerializer,
    MembershipSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    SwitchOrganizationSerializer,
    TokenObtainPairWithProfileSerializer,
    UserSerializer,
)
from apps.common.permissions import HasOrgRole


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairWithProfileSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or already blacklisted token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class SwitchOrganizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SwitchOrganizationSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        organization = Organization.objects.get(
            id=serializer.validated_data["organization_id"]
        )
        request.user.active_organization = organization
        request.user.save(update_fields=["active_organization"])
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{getattr(settings, 'FRONTEND_URL', '')}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject="Reset your IoT Gateway password",
                message=f"Use this link to reset your password: {reset_link}",
                from_email=None,
                recipient_list=[email],
                fail_silently=True,
            )
        # Always return 200 to avoid leaking which emails are registered.
        return Response({"detail": "If that email exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST
            )
        if not default_token_generator.check_token(user, data["token"]):
            return Response(
                {"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password has been reset."})


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.ORG_ADMIN)]

    def get_queryset(self):
        return Membership.objects.filter(
            organization_id__in=self.request.user.memberships.values_list(
                "organization_id", flat=True
            )
        ).select_related("user", "organization")

    def perform_create(self, serializer):
        organization = self.request.user.active_organization
        if organization is None:
            raise PermissionDenied("No active organization selected.")
        if not self.request.user.memberships.filter(
            organization_id=organization.id, role=Membership.Role.ORG_ADMIN
        ).exists() and not self.request.user.is_superuser:
            raise PermissionDenied("Only organization admins can invite members.")
        serializer.save(organization=organization)


class InviteMemberView(APIView):
    permission_classes = [HasOrgRole.with_min_role(Membership.Role.ORG_ADMIN)]

    def post(self, request):
        organization = request.user.active_organization
        if organization is None:
            raise PermissionDenied("No active organization selected.")
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user, created = User.objects.get_or_create(
            email=data["email"],
            defaults={"active_organization": organization},
        )
        if created:
            user.set_password(data["temporary_password"])
            user.save(update_fields=["password"])

        membership, _ = Membership.objects.get_or_create(
            user=user,
            organization=organization,
            defaults={"role": data["role"]},
        )
        return Response(MembershipSerializer(membership).data, status=status.HTTP_201_CREATED)
