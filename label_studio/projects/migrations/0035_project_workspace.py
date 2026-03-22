from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0034_project_annotator_evaluation_enabled'),
        ('workspaces', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='workspace',
            field=models.ForeignKey(
                blank=True,
                help_text='Workspace this project belongs to (optional)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='projects',
                to='workspaces.workspace',
            ),
        ),
    ]
