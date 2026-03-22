"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license."""

import logging

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


class Workspace(models.Model):
    title = models.CharField(
        _('title'),
        max_length=150,
        help_text='Workspace title',
    )
    description = models.TextField(
        _('description'),
        blank=True,
        null=True,
        default='',
        help_text='Workspace description',
    )
    color = models.CharField(
        _('color'),
        max_length=16,
        default='#FFFFFF',
        help_text='Workspace color in #RRGGBB format',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='workspaces',
        help_text='Organization this workspace belongs to',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_workspaces',
        help_text='User who created this workspace',
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    def has_permission(self, user):
        return self.organization == user.active_organization

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['title']
