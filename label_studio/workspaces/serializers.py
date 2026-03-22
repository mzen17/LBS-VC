"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license."""

from rest_framework import serializers
from users.serializers import UserSimpleSerializer
from workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    created_by = UserSimpleSerializer(read_only=True)
    project_count = serializers.SerializerMethodField()

    def get_project_count(self, workspace) -> int:
        return workspace.projects.count()

    def validate_color(self, value):
        if value.startswith('#') and len(value) == 7:
            try:
                int(value[1:], 16)
                return value
            except ValueError:
                pass
        raise serializers.ValidationError('Color must be in "#RRGGBB" format')

    class Meta:
        model = Workspace
        fields = [
            'id',
            'title',
            'description',
            'color',
            'organization',
            'created_by',
            'created_at',
            'updated_at',
            'project_count',
        ]
        read_only_fields = ['id', 'organization', 'created_by', 'created_at', 'updated_at', 'project_count']
