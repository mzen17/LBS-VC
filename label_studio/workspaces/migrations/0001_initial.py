from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('organizations', '0006_alter_organizationmember_deleted_at'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Workspace',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Workspace title', max_length=150, verbose_name='title')),
                ('description', models.TextField(blank=True, default='', help_text='Workspace description', null=True, verbose_name='description')),
                ('color', models.CharField(default='#FFFFFF', help_text='Workspace color in #RRGGBB format', max_length=16, verbose_name='color')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('organization', models.ForeignKey(help_text='Organization this workspace belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='workspaces', to='organizations.organization')),
                ('created_by', models.ForeignKey(help_text='User who created this workspace', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_workspaces', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['title'],
            },
        ),
    ]
