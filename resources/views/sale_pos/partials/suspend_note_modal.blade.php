<div class="modal fade" tabindex="-1" role="dialog" id="confirmSuspendModal">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title">@lang('lang_v1.suspend_sale')</h4>
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="col-xs-12">
				        <div class="form-group">
				            {!! Form::label('additional_notes', __('lang_v1.suspend_note') . ':' ) !!}
				            {{-- {!! Form::textarea('additional_notes', !empty($transaction->additional_notes) ? $transaction->additional_notes : null, ['class' => 'form-control','rows' => '4']); !!} --}}
                            {!! Form::textarea('additional_notes', isset($transaction->additional_notes) ? "" : "", ['class' => 'form-control', 'rows' => '4']) !!}
				            {!! Form::hidden('is_suspend', 0, ['id' => 'is_suspend']); !!}
				        </div>
				    </div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary" id="pos-suspend">@lang('messages.save')</button>
			    <button type="button" class="btn btn-default" data-dismiss="modal">@lang('messages.close')</button>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->


<div class="modal fade" tabindex="-1" role="dialog" id="cashModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Cash</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <!-- Left Side: Calculator Input and Buttons -->
                    <div class="col-xs-12 col-md-6 text-center">
                        <div class="form-group">
                            <label for="amountGiven">Enter Amount:</label>
                            <input type="text" class="form-control" id="amountGiven" autofocus oninput="calculateGiveBack()">
                        </div>
                        {{-- <div class="calculator">
                            <div class="row">
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(1)">1</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(2)">2</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(3)">3</button></div>
                            </div>
                            <div class="row">
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(4)">4</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(5)">5</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(6)">6</button></div>
                            </div>
                            <div class="row">
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(7)">7</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(8)">8</button></div>
                                <div class="col-xs-4"><button class="btn btn-default" onclick="appendNumber(9)">9</button></div>
                            </div>
                            <div class="row">
                                <div class="col-xs-4 col-xs-offset-4"><button class="btn btn-default" onclick="appendNumber(0)">0</button></div>
                            </div>
                        </div> --}}
                    </div>
                    <!-- Right Side: Amount Details -->
                    <div class="col-xs-12 col-md-6">
                        <div class="form-group">
                            <p>Bill Amount: <span id="mytotcash"></span></p>
                            <p>Cash Received: <span id="amountGivenDisplay"></span></p>
                            <p>Net Change: <span id="giveBack"></span></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="my-pos-cash">Cash</button>
                <button type="button" class="btn btn-default" data-dismiss="modal">@lang('messages.close')</button>
            </div>
        </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
</div><!-- /.modal -->

<script>
function calculateGiveBack() {
    const totalAmount = parseFloat(document.getElementById('mytotcash').innerText) || 0;
    const amountGiven = parseFloat(document.getElementById('amountGiven').value) || 0;
    const giveBack = amountGiven - totalAmount;

    document.getElementById('amountGivenDisplay').innerText = amountGiven.toFixed(2);
    document.getElementById('giveBack').innerText = giveBack.toFixed(2);
}

function appendNumber(number) {
    const amountGivenInput = document.getElementById('amountGiven');
    amountGivenInput.value += number;
    calculateGiveBack();
}

</script>

<style>
.calculator {
    margin-top: 10px;
}
.calculator .row {
    margin-bottom: 5px;
}
</style>
