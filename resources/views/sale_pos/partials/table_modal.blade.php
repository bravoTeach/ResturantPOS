<div class="modal fade" id="table_modal" tabindex="-1" role="dialog">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button"  class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title">Dine In tables</h4>
			</div>
			<div class="modal-body">
				<div data-toggle="tab" aria-expanded="true">
					<input type="text" id="tableSearch" placeholder="Search for table..." style="margin-bottom: 10px; padding: 5px; width: 100%; font-size: 16px;">
					<div class="grid-container" id="table_active">
					</div>
				</div>
				<style type="text/css">
					.grid-container {
						display: grid;
						grid-template-columns: repeat(4, 1fr); /* 5 columns */
						gap: 10px; /* Gap between grid items */
					}
				
					.grid-item {
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						height: 150px;
						border: 1px solid #575757;
						padding: 0px;
						/* text-align: center;
						align-content: center;
						justify-content: center; */
					}
				</style>

			</div>
			<div class="modal-footer">
			    <button type="button" class="btn btn-default" data-dismiss="modal">@lang('messages.close')</button>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div>