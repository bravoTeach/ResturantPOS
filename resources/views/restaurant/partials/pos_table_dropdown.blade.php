@if($tables_enabled)
<div class="col-sm-4" data-toggle="modal" data-target="#table_modal" id="mycustomtable" style="cursor: pointer">
	<div class="form-group">
		<div class="input-group">
			<span class="input-group-addon">
				<i class="fa fa-table"></i>
			</span>
			<script lang="javascript">
				$(document).ready(function() {
					var custom = $('select[name="res_table_id"]').find('option:selected').text()

					$('#myTable').text(custom);
				});
			</script>
			<p id="myTable" class="form-control"></p>
			{!! Form::select('res_table_id', $tables, $view_data['res_table_id'], [
				'class' => 'form-control',
				'id' => 'res_table_id',
				'placeholder' => __('restaurant.select_table'),
				'style' => 'display: none;'
				]); 
			!!}
		</div>
	</div>
</div>
@endif
@if($waiters_enabled)
<div class="col-sm-4" data-toggle="modal" data-target="#staff_modal" style="cursor: pointer">
	<div class="form-group">
		<div class="input-group">
			<span class="input-group-addon">
				<i class="fa fa-user-secret"></i>
			</span>
			<script lang="javascript">
				$(document).ready(function() {
					var custom = $('select[name="res_waiter_id"]').find('option:selected').text()

					$('#myStaff').text(custom);
				});
			</script>
			<p id="myStaff" class="form-control"></p>
			<select class="form-control" name="res_waiter_id" id="res_waiter_id" style="display: none;" @if ($is_service_staff_required) 
			required
			@endif>
				<option selected value="">{{ __('restaurant.select_service_staff') }}</option>
				 @foreach ($waiters as $waiter)
					<option {{ $waiter->id == $view_data['res_waiter_id'] ? 'selected' : ''; }} value="{{ $waiter->id }}" data-is_enable="{{ $waiter->is_enable_service_staff_pin }}">{{ $waiter->first_name .  $waiter->last_name}}</option>
				 @endforeach
			</select>
			@if(!empty($pos_settings['inline_service_staff']))
			<div class="input-group-btn">
                <button type="button" class="btn btn-default bg-white btn-flat" id="select_all_service_staff" data-toggle="tooltip" title="@lang('lang_v1.select_same_for_all_rows')"><i class="fa fa-check"></i></button>
            </div>
            @endif
		</div>
	</div>
</div>
@endif