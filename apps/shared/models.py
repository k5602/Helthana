from django.db import models

class SoftDeleteMixin(models.Model):
    
    is_active = models.BooleanField(default=True)
    
    def soft_delete(self):
        self.is_active = False
        self.save()
        
        
    class Meta:
        #This tells Django to not create a separate database for the mixin
        abstract = True
