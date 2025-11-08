from datetime import datetime
class SoftDeleteViewMixin:
    def perform_destroy(self, instance):
        instance.soft_delete()

class FilterByDateMixin:
    def _filter_by_date_range(self, queryset):
        instance_start_date_url_variable = self.url_start_date_variable
        instance_end_date_url_variable = self.url_end_date_variable
        start_date = self.request.query_params.get(instance_start_date_url_variable)
        end_date = self.request.query_params.get(instance_end_date_url_variable)
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                start_field_name = self.date_filter_start_field
                filter_to_apply = {start_field_name : start_date}
                queryset = queryset.filter(**filter_to_apply)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_field_name = self.date_filter_end_field
                filter_to_apply = {end_field_name : end_date}
                queryset = queryset.filter(**filter_to_apply)
            except ValueError:
                pass
        
        return queryset