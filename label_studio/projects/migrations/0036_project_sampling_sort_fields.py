from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0035_project_workspace'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='sampling_sort_fields',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Ordered list of {field, direction} specs for Sorted sequential sampling',
                verbose_name='sampling sort fields',
            ),
        ),
    ]
