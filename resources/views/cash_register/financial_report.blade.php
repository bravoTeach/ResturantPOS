<div class="modal-dialog modal-lg" role="document">
  <div class="modal-content">

    <div class="modal-header">
      <button type="button" class="close no-print" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      <h3 class="finance-title">FINANCIAL REPORT</h3>
    </div>

    <div class="modal-body">
    <table style="border-bottom: 3px solid black" class="table table-condensed">
      <tr>
        <td class="myfont">
          Counter:
        </td>
        <td class="myfont">
          <span class="" data-currency_symbol="true">{{ $register_details->user_name}}</span>
        </td>
      </tr>
      <tr>
        <td class="myfont">
          Opening:
        </td>
        <td class="myfont">
          <span class="" data-currency_symbol="true">{{ \Carbon::createFromFormat('Y-m-d H:i:s', $register_details->open_time)->format('jS M, Y h:i A') }}</span>
        </td>
      </tr>
      <tr>
        <td class="myfont">
          Closing:
        </td>
        <td class="myfont">
          <span class="" data-currency_symbol="true">{{\Carbon::createFromFormat('Y-m-d H:i:s', $close_time)->format('jS M, Y h:i A')}}</span>
        </td>
      </tr>
      <tr>
        <td class="myfont">
          Print Date and Time:
        </td>
        <td class="myfont">
          <span  data-currency_symbol="true">{{\Carbon::now()->format('jS M, Y h:i A')}}</span>
        </td>
      </tr>
    </table>
    <table style="border-bottom: 3px solid black" class="table table-condensed">
      <tr class="success">
        <td class="myfont">
          Gross Total:
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $details['transaction_details']->total_before_tax}}</span></b>
        </td>
      </tr>
      <tr class="success">
        <td class="myfont">
          Gross Total(without: Disc. & ENT):
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $details['transaction_details']->total_before_tax - $register_details->total_custom_pay_1 - $details['transaction_details']->total_discount}}</span></b>
        </td>
      </tr>
      <tr class="success">
        <td class="myfont">
          @lang('sale.discount'):
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $details['transaction_details']->total_discount }}</span></b>
        </td>
      </tr>
      <tr class="success">
        <td class="myfont">
          @lang('sale.order_tax'):
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $details['transaction_details']->total_tax }}</span></b>
        </td>
      </tr>
      <tr class="success">
        <td class="myfont">
          ENT:
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $register_details->total_custom_pay_1 }}</span></b>
        </td>
      </tr>
      <tr class="danger">
        <td class="myfont">
          @lang('report.total_expense'):
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ $register_details->total_expense }}</span></b>
        </td>
      </tr>
      <tr class="success">
        <td class="myfont">
          NET SALE:
        </td>
        <td class="myfont">
          <b><span class="display_currency" data-currency_symbol="true">{{ ($details['transaction_details']->total_sales + $details['transaction_details']->total_discount - $register_details->total_expense) }}</span></b>
        </td>
      </tr>
    </table>
    <table class="table table-condensed">
    @if($details['is_chana'])
      <tr>
        <td class="myfont">
          CREDIT: 
        </td>
        <td class="myfont">
          <span class="display_currency" data-currency_symbol="true">{{ $register_details->total_card }}</span> 
        </td>
      </tr>
      <tr>
        <td class="myfont">
          CASH:
        </td>
        <td class="myfont">
          <span class="display_currency" data-currency_symbol="true">{{ $register_details->total_cash }}</span>
        </td>
      </tr>
    @endif  
    </table>
    <div class="row">
        <div class="col-xs-6">
          <b>@lang('report.user'):</b> {{ $register_details->user_name}}<br>
          <b>@lang('business.email'):</b> {{ $register_details->email}}<br>
          <b>@lang('business.business_location'):</b> {{ $register_details->location_name}}<br>
        </div>
        @if(!empty($register_details->closing_note))
          <div class="col-xs-6">
            <strong>@lang('cash_register.closing_note'):</strong><br>
            {{$register_details->closing_note}}
          </div>
        @endif
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-primary no-print" 
        aria-label="Print" 
          onclick="$(this).closest('div.modal').printThis();">
        <i class="fa fa-print"></i> @lang( 'messages.print' )
      </button>

      <button type="button" class="btn btn-default no-print" 
        data-dismiss="modal">@lang( 'messages.cancel' )
      </button>
    </div>

  </div><!-- /.modal-content -->
</div><!-- /.modal-dialog -->
<style type="text/css">
  .myfont{
    font-family: auto;
    font-size: 13px;
  }
  .finance-title{
    border: 3px solid black;
    border-radius: 5px;
    text-align: center;
    padding: 5px;
    font-weight: 900;
  }
  @media print {
    .modal {
        position: absolute;
        left: 0;
        top: 0;
        margin: 0;
        padding: 0;
        overflow: visible!important;
    }
}
</style>