@extends('layouts.app')
@section('title', __( 'sale.list_pos'))

@section('content')

<!-- Content Header (Page header) -->
<section class="content-header no-print">
    <h1>@lang('sale.pos_sale')
    </h1>
</section>

<!-- Main content -->
<section class="content no-print">
    @component('components.filters', ['title' => __('report.filters')])
        @include('sell.partials.sell_list_filters')
    @endcomponent

    @component('components.widget', ['class' => 'box-primary', 'title' => __( 'sale.list_pos')])
        @can('sell.create')
            @slot('tool')
            
        <button style="margin-left:125ps;" onclick="search('')">All Orders</button>
         <button onclick="search('dine in')">Dine In</button>
         <button onclick="search('take away')">Take Away</button>
         <button onclick="search('delivery')">Delivery</button>
         <div class="box-tools" style="display: flex;">
            <button class="btn btn-primary" id="refreshButton" style="margin-right: 10px;" onclick="location.reload();">
                Refresh
            </button>
            <a class="btn btn-block btn-primary"
                href="{{action([\App\Http\Controllers\SellPosController::class, 'create'])}}">
                <i class="fa fa-plus"></i> @lang('messages.add')</a>
        </div>
                
                <script>
  function search(keyword) {
    // Get the input field by its id
    var inputField = document.getElementById("sell_table_filter").querySelector("input");
    //console.log("Hello " + keyword);
    // Set the value of the input field
    inputField.value = keyword;
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
  }
</script>
            @endslot
        @endcan
        @can('sell.view')
            <input type="hidden" name="is_direct_sale" id="is_direct_sale" value="0">
            @include('sale_pos.partials.sales_table')
        @endcan
    @endcomponent
</section>
<!-- /.content -->
<div class="modal fade payment_modal" tabindex="-1" role="dialog" 
    aria-labelledby="gridSystemModalLabel">
</div>

<div class="modal fade edit_payment_modal" tabindex="-1" role="dialog" 
    aria-labelledby="gridSystemModalLabel">
</div>

<div class="modal fade register_details_modal" tabindex="-1" role="dialog" 
    aria-labelledby="gridSystemModalLabel">
</div>
<div class="modal fade close_register_modal" tabindex="-1" role="dialog" 
    aria-labelledby="gridSystemModalLabel">
</div>

<!-- This will be printed -->
<!-- <section class="invoice print_section" id="receipt_section">
</section> -->


@stop

@section('javascript')
@include('sale_pos.partials.sale_table_javascript')
<script src="{{ asset('js/payment.js?v=' . $asset_v) }}"></script>
@endsection