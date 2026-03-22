"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license."""

import logging

from core.permissions import ViewClassPermission, all_permissions
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from workspaces.models import Workspace
from workspaces.serializers import WorkspaceSerializer

logger = logging.getLogger(__name__)


class WorkspaceListAPI(generics.ListCreateAPIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    serializer_class = WorkspaceSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.organizations_view,
        POST=all_permissions.organizations_change,
    )

    def get_queryset(self):
        return Workspace.objects.filter(organization=self.request.user.active_organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.active_organization,
            created_by=self.request.user,
        )


class WorkspaceAPI(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    serializer_class = WorkspaceSerializer
    permission_required = ViewClassPermission(
        GET=all_permissions.organizations_view,
        PATCH=all_permissions.organizations_change,
        DELETE=all_permissions.organizations_change,
    )

    def get_queryset(self):
        return Workspace.objects.filter(organization=self.request.user.active_organization)
