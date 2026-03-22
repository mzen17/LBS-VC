"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license."""

from django.urls import re_path

from . import api

urlpatterns = [
    re_path(r'^api/workspaces/?$', api.WorkspaceListAPI.as_view(), name='workspace-list'),
    re_path(r'^api/workspaces/(?P<pk>\d+)/?$', api.WorkspaceAPI.as_view(), name='workspace-detail'),
]
