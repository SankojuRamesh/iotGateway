from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import Membership, Organization, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "is_active", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]


class MembershipSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "user", "user_email", "organization", "role", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"user": {"write_only": True}}


class UserSerializer(serializers.ModelSerializer):
    memberships = MembershipSerializer(many=True, read_only=True)
    active_organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_staff",
            "is_superuser",
            "active_organization",
            "memberships",
            "created_at",
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    organization_name = serializers.CharField(max_length=200)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            org_name = validated_data["organization_name"]
            slug = slugify(org_name)
            unique_slug = slug
            counter = 1
            while Organization.objects.filter(slug=unique_slug).exists():
                counter += 1
                unique_slug = f"{slug}-{counter}"

            organization = Organization.objects.create(name=org_name, slug=unique_slug)
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                active_organization=organization,
            )
            Membership.objects.create(
                user=user, organization=organization, role=Membership.Role.ORG_ADMIN
            )
            return user


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Membership.Role.choices)
    temporary_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower()


class TokenObtainPairWithProfileSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class SwitchOrganizationSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()

    def validate_organization_id(self, value):
        user = self.context["request"].user
        if not user.memberships.filter(organization_id=value).exists():
            raise serializers.ValidationError("You are not a member of this organization.")
        return value
