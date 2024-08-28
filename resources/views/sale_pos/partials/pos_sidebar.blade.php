<div class="row" id="featured_products_box" style="display: none;">
@if(!empty($featured_products))
	@include('sale_pos.partials.featured_products')
@endif
</div>
<div class="row">
	@if(!empty($categories))
		<div class="col-md-4" id="product_category_div" style="display: none">
			<select class="select2" id="product_category" style="width:100% !important">

				<option value="all">@lang('lang_v1.all_category')</option>

				@foreach($categories as $category)
					<option value="{{$category['id']}}">{{$category['name']}}</option>
				@endforeach

				@foreach($categories as $category)
					@if(!empty($category['sub_categories']))
						<optgroup label="{{$category['name']}}">
							@foreach($category['sub_categories'] as $sc)
								<i class="fa fa-minus"></i> <option value="{{$sc['id']}}">{{$sc['name']}}</option>
							@endforeach
						</optgroup>
					@endif
				@endforeach
			</select>
		</div>
			<div id="category_tiles" class="category-tiles">
				<div class="category-tile default-selected" data-category-id="all">@lang('lang_v1.all_category')</div>
				@foreach($categories as $category)
					<div class="category-tile" data-category-id="{{$category['id']}}">{{$category['name']}}</div>
					@if(!empty($category['sub_categories']))
						@foreach($category['sub_categories'] as $sc)
							<div class="category-tile sub-category-tile" data-category-id="{{$sc['id']}}">{{$sc['name']}}</div>
						@endforeach
					@endif
				@endforeach
			</div>
		
<style>		
.category-tiles {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
	margin-right: 15px;
    margin-left: 10px;
}

.category-tile {
    padding: 10px;
    border: 1px solid #ccc;
    cursor: pointer;
    background-color: #2196f3;
    color: white;
    transition: background-color 0.3s;
}

.category-tile.selected {
    background-color: green;
}

.category-tile:hover:not(.selected) {
    background-color: green;
}

</style>		
		<script>		
	document.addEventListener("DOMContentLoaded", function() {
    const categoryTiles = document.querySelectorAll('.category-tile');
    const selectElement = document.getElementById('product_category');

    // Select the first tile by default
    const defaultSelectedTile = document.querySelector('.default-selected');
    defaultSelectedTile.classList.add('selected');

    categoryTiles.forEach(tile => {
        tile.addEventListener('click', function() {
            // Deselect all tiles
            categoryTiles.forEach(tile => {
                tile.classList.remove('selected');
            });
            // Select the clicked tile
            this.classList.add('selected');

            // Update the hidden input value if needed
            const categoryId = this.dataset.categoryId;
            selectElement.value = categoryId;

            // Trigger change event on select element to ensure select2 updates
            const event = new Event('change');
            selectElement.dispatchEvent(event);
        });
    });

    // Update the category tiles when select element changes
    selectElement.addEventListener('change', function() {
        const selectedCategoryId = this.value;
        categoryTiles.forEach(tile => {
            if (tile.dataset.categoryId === selectedCategoryId) {
                tile.classList.add('selected');
            } else {
                tile.classList.remove('selected');
            }
        });
    });
});


		</script>		
	@endif

	{{-- @if(!empty($brands))
		<div class="col-sm-4" id="product_brand_div">
			{!! Form::select('size', $brands, null, ['id' => 'product_brand', 'class' => 'select2', 'name' => null, 'style' => 'width:100% !important']) !!}
		</div>
	@endif --}}

	<!-- used in repair : filter for service/product -->
	<div class="col-md-6 hide" id="product_service_div">
		{!! Form::select('is_enabled_stock', ['' => __('messages.all'), 'product' => __('sale.product'), 'service' => __('lang_v1.service')], null, ['id' => 'is_enabled_stock', 'class' => 'select2', 'name' => null, 'style' => 'width:100% !important']) !!}
	</div>

	<div class="col-sm-4 @if(empty($featured_products)) hide @endif" id="feature_product_div">
		<button type="button" class="btn btn-primary btn-flat" id="show_featured_products">@lang('lang_v1.featured_products')</button>
	</div>
</div>
<br>
<div class="row">
	<input type="hidden" id="suggestion_page" value="1">
	<div class="col-md-12">
		<div class="eq-height-row" id="product_list_body"></div>
	</div>
	<div class="col-md-12 text-center" id="suggestion_page_loader" style="display: none;">
		<i class="fa fa-spinner fa-spin fa-2x"></i>
	</div>
</div>