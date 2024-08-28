$(document).ready(function () {
    let initialData = captureTableData();
    customer_set = false;
    //Prevent enter key function except texarea
    $('form').on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13 && e.target.tagName != 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    //For edit pos form
    if ($('form#edit_pos_sell_form').length > 0) {
        pos_total_row();
        pos_form_obj = $('form#edit_pos_sell_form');
    } else {
        pos_form_obj = $('form#add_pos_sell_form');
    }
    if ($('form#edit_pos_sell_form').length > 0 || $('form#add_pos_sell_form').length > 0) {
        initialize_printer();
    }

    $('select#select_location_id').change(function () {
        reset_pos_form();

        var default_price_group = $(this).find(':selected').data('default_price_group')
        if (default_price_group) {
            if ($("#price_group option[value='" + default_price_group + "']").length > 0) {
                $("#price_group").val(default_price_group);
                $("#price_group").change();
            }
        }

        //Set default invoice scheme for location
        if ($('#invoice_scheme_id').length) {
            if ($('input[name="is_direct_sale"]').length > 0) {
                //default scheme for sale screen
                var invoice_scheme_id = $(this).find(':selected').data('default_sale_invoice_scheme_id');
            } else {
                var invoice_scheme_id = $(this).find(':selected').data('default_invoice_scheme_id');
            }

            $("#invoice_scheme_id").val(invoice_scheme_id).change();
        }

        //Set default invoice layout for location
        if ($('#invoice_layout_id').length) {
            let invoice_layout_id = $(this).find(':selected').data('default_invoice_layout_id');
            $("#invoice_layout_id").val(invoice_layout_id).change();
        }

        //Set default price group
        if ($('#default_price_group').length) {
            var dpg = default_price_group ?
                default_price_group : 0;
            $('#default_price_group').val(dpg);
        }

        set_payment_type_dropdown();

        if ($('#types_of_service_id').length && $('#types_of_service_id').val()) {
            $('#types_of_service_id').change();
        }
    });

    //get customer
    $('select#customer_id').select2({
        ajax: {
            url: '/contacts/customers',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    q: params.term, // search term
                    page: params.page,
                };
            },
            processResults: function (data) {
                return {
                    results: data,
                };
            },
        },
        templateResult: function (data) {
            var template = '';
            if (data.supplier_business_name) {
                template += data.supplier_business_name + "<br>";
            }
            template += data.text + "<br>" + LANG.mobile + ": " + data.mobile;

            if (typeof (data.total_rp) != "undefined") {
                var rp = data.total_rp ? data.total_rp : 0;
                template += "<br><i class='fa fa-gift text-success'></i> " + rp;
            }

            return template;
        },
        minimumInputLength: 1,
        language: {
            noResults: function () {
                var name = $('#customer_id')
                    .data('select2')
                    .dropdown.$search.val();
                return (
                    '<button type="button" data-name="' +
                    name +
                    '" class="btn btn-link add_new_customer"><i class="fa fa-plus-circle fa-lg" aria-hidden="true"></i>&nbsp; ' +
                    __translate('add_name_as_new_customer', { name: name }) +
                    '</button>'
                );
            },
        },
        escapeMarkup: function (markup) {
            return markup;
        },
    });
    $('#customer_id').on('select2:select', function (e) {
        var data = e.params.data;
        if (data.pay_term_number) {
            $('input#pay_term_number').val(data.pay_term_number);
        } else {
            $('input#pay_term_number').val('');
        }

        if (data.pay_term_type) {
            $('#add_sell_form select[name="pay_term_type"]').val(data.pay_term_type);
            $('#edit_sell_form select[name="pay_term_type"]').val(data.pay_term_type);
        } else {
            $('#add_sell_form select[name="pay_term_type"]').val('');
            $('#edit_sell_form select[name="pay_term_type"]').val('');
        }

        update_shipping_address(data);
        $('#advance_balance_text').text(__currency_trans_from_en(data.balance), true);
        $('#advance_balance').val(data.balance);

        if (data.price_calculation_type == 'selling_price_group') {
            $('#price_group').val(data.selling_price_group_id);
            $('#price_group').change();
        } else {
            $('#price_group').val('');
            $('#price_group').change();
        }
        if ($('.contact_due_text').length) {
            get_contact_due(data.id);
        }
    });

    set_default_customer();

    if ($('#search_product').length) {
        //Add Product
        $('#search_product')
            .autocomplete({
                delay: 1000,
                source: function (request, response) {
                    var price_group = '';
                    var search_fields = [];
                    $('.search_fields:checked').each(function (i) {
                        search_fields[i] = $(this).val();
                    });

                    if ($('#price_group').length > 0) {
                        price_group = $('#price_group').val();
                    }
                    $.getJSON(
                        '/products/list',
                        {
                            price_group: price_group,
                            location_id: $('input#location_id').val(),
                            term: request.term,
                            not_for_selling: 0,
                            search_fields: search_fields
                        },
                        response
                    );
                },
                minLength: 2,
                response: function (event, ui) {
                    if (ui.content.length == 1) {
                        ui.item = ui.content[0];

                        var is_overselling_allowed = false;
                        if ($('input#is_overselling_allowed').length) {
                            is_overselling_allowed = true;
                        }
                        var for_so = false;
                        if ($('#sale_type').length && $('#sale_type').val() == 'sales_order') {
                            for_so = true;
                        }

                        if ((ui.item.enable_stock == 1 && ui.item.qty_available > 0) ||
                            (ui.item.enable_stock == 0) || is_overselling_allowed || for_so) {
                            $(this)
                                .data('ui-autocomplete')
                                ._trigger('select', 'autocompleteselect', ui);
                            $(this).autocomplete('close');
                        }
                    } else if (ui.content.length == 0) {
                        toastr.error(LANG.no_products_found);
                        $('input#search_product').select();
                    }
                },
                focus: function (event, ui) {
                    if (ui.item.qty_available <= 0) {
                        return false;
                    }
                },
                select: function (event, ui) {
                    var searched_term = $(this).val();
                    var is_overselling_allowed = false;
                    if ($('input#is_overselling_allowed').length) {
                        is_overselling_allowed = true;
                    }
                    var for_so = false;
                    if ($('#sale_type').length && $('#sale_type').val() == 'sales_order') {
                        for_so = true;
                    }

                    var is_draft = false;
                    if ($('input#status') && ($('input#status').val() == 'quotation' ||
                        $('input#status').val() == 'draft')) {
                        var is_draft = true;
                    }

                    if (ui.item.enable_stock != 1 || ui.item.qty_available > 0 || is_overselling_allowed || for_so || is_draft) {
                        $(this).val(null);

                        //Pre select lot number only if the searched term is same as the lot number
                        var purchase_line_id = ui.item.purchase_line_id && searched_term == ui.item.lot_number ? ui.item.purchase_line_id : null;
                        pos_product_row(ui.item.variation_id, purchase_line_id);
                    } else {
                        alert(LANG.out_of_stock);
                    }
                },
            })
            .autocomplete('instance')._renderItem = function (ul, item) {
                var is_overselling_allowed = false;
                if ($('input#is_overselling_allowed').length) {
                    is_overselling_allowed = true;
                }

                var for_so = false;
                if ($('#sale_type').length && $('#sale_type').val() == 'sales_order') {
                    for_so = true;
                }
                var is_draft = false;
                if ($('input#status') && ($('input#status').val() == 'quotation' ||
                    $('input#status').val() == 'draft')) {
                    var is_draft = true;
                }

                if (item.enable_stock == 1 && item.qty_available <= 0 && !is_overselling_allowed && !for_so && !is_draft) {
                    var string = '<li class="ui-state-disabled">' + item.name;
                    if (item.type == 'variable') {
                        string += '-' + item.variation;
                    }
                    var selling_price = item.selling_price;
                    if (item.variation_group_price) {
                        selling_price = item.variation_group_price;
                    }
                    string +=
                        ' (' +
                        item.sub_sku +
                        ')' +
                        '<br> Price: ' +
                        selling_price +
                        ' (Out of stock) </li>';
                    return $(string).appendTo(ul);
                } else {
                    var string = '<div>' + item.name;
                    if (item.type == 'variable') {
                        string += '-' + item.variation;
                    }

                    var selling_price = item.selling_price;
                    if (item.variation_group_price) {
                        selling_price = item.variation_group_price;
                    }

                    string += ' (' + item.sub_sku + ')' + '<br> Price: ' + selling_price;
                    if (item.enable_stock == 1) {
                        var qty_available = __currency_trans_from_en(item.qty_available, false, false, __currency_precision, true);
                        string += ' - ' + qty_available + item.unit;
                    }
                    string += '</div>';

                    return $('<li>')
                        .append(string)
                        .appendTo(ul);
                }
            };
    }

    //Update line total and check for quantity not greater than max quantity
    $('table#pos_table tbody').on('change', 'input.pos_quantity', function () {
        if (sell_form_validator) {
            sell_form.valid();
        }
        if (pos_form_validator) {
            pos_form_validator.element($(this));
        }
        // var max_qty = parseFloat($(this).data('rule-max'));
        var entered_qty = __read_number($(this));

        var tr = $(this).parents('tr');

        var unit_price_inc_tax = __read_number(tr.find('input.pos_unit_price_inc_tax'));
        var line_total = entered_qty * unit_price_inc_tax;

        __write_number(tr.find('input.pos_line_total'), line_total, false, 2);
        tr.find('span.pos_line_total_text').text(__currency_trans_from_en(line_total, true));

        //Change modifier quantity
        tr.find('.modifier_qty_text').each(function () {
            $(this).text(__currency_trans_from_en(entered_qty, false));
        });
        tr.find('.modifiers_quantity').each(function () {
            $(this).val(entered_qty);
        });

        pos_total_row();

        adjustComboQty(tr);
    });

    //If change in unit price update price including tax and line total
    $('table#pos_table tbody').on('change', 'input.pos_unit_price', function () {
        var unit_price = __read_number($(this));
        var tr = $(this).parents('tr');

        //calculate discounted unit price
        var discounted_unit_price = calculate_discounted_unit_price(tr);

        var tax_rate = tr
            .find('select.tax_id')
            .find(':selected')
            .data('rate');
        var quantity = __read_number(tr.find('input.pos_quantity'));

        var unit_price_inc_tax = __add_percent(discounted_unit_price, tax_rate);
        var line_total = quantity * unit_price_inc_tax;

        __write_number(tr.find('input.pos_unit_price_inc_tax'), unit_price_inc_tax);
        __write_number(tr.find('input.pos_line_total'), line_total);
        tr.find('span.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        pos_each_row(tr);
        pos_total_row();
        round_row_to_iraqi_dinnar(tr);
    });

    //If change in tax rate then update unit price according to it.
    $('table#pos_table tbody').on('change', 'select.tax_id', function () {
        var tr = $(this).parents('tr');

        var tax_rate = tr
            .find('select.tax_id')
            .find(':selected')
            .data('rate');
        var unit_price_inc_tax = __read_number(tr.find('input.pos_unit_price_inc_tax'));

        var discounted_unit_price = __get_principle(unit_price_inc_tax, tax_rate);
        var unit_price = get_unit_price_from_discounted_unit_price(tr, discounted_unit_price);
        __write_number(tr.find('input.pos_unit_price'), unit_price);
        pos_each_row(tr);
    });

    //If change in unit price including tax, update unit price
    $('table#pos_table tbody').on('change', 'input.pos_unit_price_inc_tax', function () {
        var unit_price_inc_tax = __read_number($(this));

        if (iraqi_selling_price_adjustment) {
            unit_price_inc_tax = round_to_iraqi_dinnar(unit_price_inc_tax);
            __write_number($(this), unit_price_inc_tax);
        }

        var tr = $(this).parents('tr');

        var tax_rate = tr
            .find('select.tax_id')
            .find(':selected')
            .data('rate');
        var quantity = __read_number(tr.find('input.pos_quantity'));

        var line_total = quantity * unit_price_inc_tax;
        var discounted_unit_price = __get_principle(unit_price_inc_tax, tax_rate);
        var unit_price = get_unit_price_from_discounted_unit_price(tr, discounted_unit_price);

        __write_number(tr.find('input.pos_unit_price'), unit_price);
        __write_number(tr.find('input.pos_line_total'), line_total, false, 2);
        tr.find('span.pos_line_total_text').text(__currency_trans_from_en(line_total, true));

        pos_each_row(tr);
        pos_total_row();
    });

    //Change max quantity rule if lot number changes
    $('table#pos_table tbody').on('change', 'select.lot_number', function () {
        var qty_element = $(this)
            .closest('tr')
            .find('input.pos_quantity');

        var tr = $(this).closest('tr');
        var multiplier = 1;
        var unit_name = '';
        var sub_unit_length = tr.find('select.sub_unit').length;
        if (sub_unit_length > 0) {
            var select = tr.find('select.sub_unit');
            multiplier = parseFloat(select.find(':selected').data('multiplier'));
            unit_name = select.find(':selected').data('unit_name');
        }
        var allow_overselling = qty_element.data('allow-overselling');
        if ($(this).val() && !allow_overselling) {
            var lot_qty = $('option:selected', $(this)).data('qty_available');
            var max_err_msg = $('option:selected', $(this)).data('msg-max');

            if (sub_unit_length > 0) {
                lot_qty = lot_qty / multiplier;
                var lot_qty_formated = __number_f(lot_qty, false);
                max_err_msg = __translate('lot_max_qty_error', {
                    max_val: lot_qty_formated,
                    unit_name: unit_name,
                });
            }

            qty_element.attr('data-rule-max-value', lot_qty);
            qty_element.attr('data-msg-max-value', max_err_msg);

            qty_element.rules('add', {
                'max-value': lot_qty,
                messages: {
                    'max-value': max_err_msg,
                },
            });
        } else {
            var default_qty = qty_element.data('qty_available');
            var default_err_msg = qty_element.data('msg_max_default');
            if (sub_unit_length > 0) {
                default_qty = default_qty / multiplier;
                var lot_qty_formated = __number_f(default_qty, false);
                default_err_msg = __translate('pos_max_qty_error', {
                    max_val: lot_qty_formated,
                    unit_name: unit_name,
                });
            }

            qty_element.attr('data-rule-max-value', default_qty);
            qty_element.attr('data-msg-max-value', default_err_msg);

            qty_element.rules('add', {
                'max-value': default_qty,
                messages: {
                    'max-value': default_err_msg,
                },
            });
        }
        qty_element.trigger('change');
    });

    //Change in row discount type or discount amount
    $('table#pos_table tbody').on(
        'change',
        'select.row_discount_type, input.row_discount_amount',
        function () {
            var tr = $(this).parents('tr');

            //calculate discounted unit price
            var discounted_unit_price = calculate_discounted_unit_price(tr);

            var tax_rate = tr
                .find('select.tax_id')
                .find(':selected')
                .data('rate');
            var quantity = __read_number(tr.find('input.pos_quantity'));

            var unit_price_inc_tax = __add_percent(discounted_unit_price, tax_rate);
            var line_total = quantity * unit_price_inc_tax;

            __write_number(tr.find('input.pos_unit_price_inc_tax'), unit_price_inc_tax);
            __write_number(tr.find('input.pos_line_total'), line_total, false, 2);
            tr.find('span.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
            pos_each_row(tr);
            pos_total_row();
            round_row_to_iraqi_dinnar(tr);
        }
    );

    //Remove row on click on remove row
    $('table#pos_table tbody').on('click', 'i.pos_remove_row', function () {
        $(this)
            .parents('tr')
            .remove();
        pos_total_row();
    });

    //Cancel the invoice
    $('button#pos-cancel').click(function () {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(confirm => {
            if (confirm) {
                reset_pos_form();
            }
        });
    });

    //Save invoice as draft
    $('button#pos-draft').click(function () {
        // Check if a table is selected
        if ($('#res_table_id').val() === '') {
            // e.preventDefault(); // Prevent form submission
            toastr.warning('Please select a table.');
            return false;
        }

        if ($('input[name="types_of_service_text"]').length === 0) {
            // Check if any service type radio button is selected
            if (!$('input[name="types_of_service_id"]:checked').length) {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Please select an Order Type.');
                return false;
            }
        }
        else {
            if ($('input[name="types_of_service_text"]').val() === '') {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Service type text cannot be empty.');
                return false;
            }
        }

        //Check if product is present or not.
        if ($('table#pos_table tbody').find('.product_row').length <= 0) {
            toastr.warning(LANG.no_products_added);
            return false;
        }

        var is_valid = isValidPosForm();
        if (is_valid != true) {
            return;
        }

        var data = pos_form_obj.serialize();
        data = data + '&status=draft';
        var url = pos_form_obj.attr('action');

        disable_pos_form_actions();
        $.ajax({
            method: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            success: function (result) {
                enable_pos_form_actions();
                if (result.success == 1) {
                    reset_pos_form();
                    toastr.success(result.msg);
                } else {
                    toastr.error(result.msg);
                }
            },
        });
    });

    //Save invoice as Quotation
    $('button#pos-quotation').click(function () {
        // Check if a table is selected
        if ($('#res_table_id').val() === '') {
            // e.preventDefault(); // Prevent form submission
            toastr.warning('Please select a table.');
            return false;
        }

        if ($('input[name="types_of_service_text"]').length === 0) {
            // Check if any service type radio button is selected
            if (!$('input[name="types_of_service_id"]:checked').length) {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Please select an Order Type.');
                return false;
            }
        }
        else {
            if ($('input[name="types_of_service_text"]').val() === '') {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Service type text cannot be empty.');
                return false;
            }
        }

        //Check if product is present or not.
        if ($('table#pos_table tbody').find('.product_row').length <= 0) {
            toastr.warning(LANG.no_products_added);
            return false;
        }

        var is_valid = isValidPosForm();
        if (is_valid != true) {
            return;
        }

        var data = pos_form_obj.serialize();
        data = data + '&status=quotation';
        var url = pos_form_obj.attr('action');

        disable_pos_form_actions();
        $.ajax({
            method: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            success: function (result) {
                enable_pos_form_actions();
                if (result.success == 1) {
                    reset_pos_form();
                    toastr.success(result.msg);

                    //Check if enabled or not
                    if (result.receipt.is_enabled) {
                        pos_print(result.receipt);
                    }
                } else {
                    toastr.error(result.msg);
                }
            },
        });
    });

    //Finalize invoice, open payment modal
    $('button#pos-finalize').click(function () {
        // Check if a table is selected
        if ($('#res_table_id').val() === '') {
            // e.preventDefault(); // Prevent form submission
            toastr.warning('Please select a table.');
            return false;
        }

        if ($('input[name="types_of_service_text"]').length === 0) {
            // Check if any service type radio button is selected
            if (!$('input[name="types_of_service_id"]:checked').length) {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Please select an Order Type.');
                return false;
            }
        }
        else {
            if ($('input[name="types_of_service_text"]').val() === '') {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Service type text cannot be empty.');
                return false;
            }
        }

        //Check if product is present or not.
        if ($('table#pos_table tbody').find('.product_row').length <= 0) {
            toastr.warning(LANG.no_products_added);
            return false;
        }

        if ($('#reward_point_enabled').length) {
            var validate_rp = isValidatRewardPoint();
            if (!validate_rp['is_valid']) {
                toastr.error(validate_rp['msg']);
                return false;
            }
        }

        $('#modal_payment').modal('show');
    });

    $('#modal_payment').one('shown.bs.modal', function () {
        $('#modal_payment')
            .find('input')
            .filter(':visible:first')
            .focus()
            .select();
        if ($('form#edit_pos_sell_form').length == 0) {
            $(this).find('#method_0').change();
        }
    });

    //Finalize without showing payment options
    $('button.pos-express-finalize').click(function () {
        // Check if a table is selected
        if ($('#res_table_id').val() === '') {
            // e.preventDefault(); // Prevent form submission
            toastr.warning('Please select a table.');
            return false;
        }

        if ($('input[name="types_of_service_text"]').length === 0) {
            // Check if any service type radio button is selected
            if (!$('input[name="types_of_service_id"]:checked').length) {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Please select an Order Type.');
                return false;
            }
        }
        else {
            if ($('input[name="types_of_service_text"]').val() === '') {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Service type text cannot be empty.');
                return false;
            }
        }

        //Check if product is present or not.
        if ($('table#pos_table tbody').find('.product_row').length <= 0) {
            toastr.warning(LANG.no_products_added);
            return false;
        }

        if ($('#reward_point_enabled').length) {
            var validate_rp = isValidatRewardPoint();
            if (!validate_rp['is_valid']) {
                toastr.error(validate_rp['msg']);
                return false;
            }
        }

        var pay_method = $(this).data('pay_method');

        //If pay method is credit sale submit form
        if (pay_method == 'credit_sale') {
            $('#is_credit_sale').val(1);
            pos_form_obj.submit();
            return true;
        } else {
            if ($('#is_credit_sale').length) {
                $('#is_credit_sale').val(0);
            }
        }

        //Check for remaining balance & add it in 1st payment row
        var total_payable = __read_number($('input#final_total_input'));
        var total_paying = __read_number($('input#total_paying_input'));
        if (total_payable > total_paying) {
            var bal_due = total_payable - total_paying;

            var first_row = $('#payment_rows_div')
                .find('.payment-amount')
                .first();
            var first_row_val = __read_number(first_row);
            first_row_val = first_row_val + bal_due;
            __write_number(first_row, first_row_val);
            first_row.trigger('change');
        }

        //Change payment method.
        var payment_method_dropdown = $('#payment_rows_div')
            .find('.payment_types_dropdown')
            .first();

        payment_method_dropdown.val(pay_method);
        payment_method_dropdown.change();
        if (pay_method == 'card') {
            $('div#card_details_modal').modal('show');
        } else if (pay_method == 'suspend') {
            let currentData = captureTableData();
            let differences = compareData(initialData, currentData);
            let summary = differences.summary;
            if (summary.productsRemoved > 0 || summary.productsDecreased > 0) {
                showDifferencesModal(differences);
            } else {
                $('div#confirmSuspendModal').modal('show');
            }
        }
        else if (pay_method == 'cash') {
            // Get the element by its ID
            const priceTotalElement = document.getElementById("total_payable");

            // Check if the element exists
            if (priceTotalElement) {
                // Get the text content and replace commas, then parse it as a float
                const priceTotalValue = parseFloat(priceTotalElement.textContent.replace(',', ''));

                // Update the element with the parsed value
                document.getElementById("mytotcash").innerHTML = priceTotalValue;

                // Log the parsed value to the console
                console.log('cashhhh Price Total Value:', priceTotalValue);

                // Show the modal and focus on the input
                $('div#cashModal').modal('show');
                $('#amountGiven').focus();
            } else {
                // Log an error message if the element is not found
                console.error('Element with ID "total_payable" not found.');
            }
        }
        else {
            pos_form_obj.submit();
            $('#myStaff').text('Select service staff');
            $('#myTable').text('Select Table');
        }
    });

    $('div#card_details_modal').on('shown.bs.modal', function (e) {
        $('input#card_number').focus();
    });

    $('div#confirmSuspendModal').on('shown.bs.modal', function (e) {
        $(this)
            .find('textarea')
            .focus();
    });

    //on save card details
    $('button#pos-save-card').click(function () {
        $('input#card_number_0').val($('#card_number').val());
        $('input#card_holder_name_0').val($('#card_holder_name').val());
        $('input#card_transaction_number_0').val($('#card_transaction_number').val());
        $('select#card_type_0').val($('#card_type').val());
        $('input#card_month_0').val($('#card_month').val());
        $('input#card_year_0').val($('#card_year').val());
        $('input#card_security_0').val($('#card_security').val());

        $('div#card_details_modal').modal('hide');
        pos_form_obj.submit();
        $('#myStaff').text('Select service staff');
        $('#myTable').text('Select Table');
    });

    // new code


    function captureTableData() {
        let tableRows = document.querySelectorAll("#pos_table tbody tr");
        let data = [];
        tableRows.forEach(row => {
            let product = row.querySelector("td:nth-child(1)").innerText.trim();
            let quantityInput = row.querySelector("td:nth-child(2) .input_quantity");
            let quantity = quantityInput ? parseFloat(quantityInput.value.trim()) : 0;
            let priceInput = row.querySelector("td:nth-child(3) input");
            let price = priceInput ? parseFloat(priceInput.value.trim()) : 0;
            let subtotalText = row.querySelector("td:nth-child(4)").innerText.trim();
            let subtotal = subtotalText ? parseFloat(subtotalText) : 0;
            data.push({
                product,
                quantity,
                price,
                subtotal
            });
            console.log(quantityInput);
        });
        return data;
    }

    try {
        document.getElementById("compareButton").addEventListener("click", function () {
            console.log("comapre");
            let currentData = captureTableData();
            let differences = compareData(initialData, currentData);
            showDifferencesModal(differences);
        });
    } catch (error) {
        console.log(error);
    }

    function compareData(initialData, currentData) {
        let differences = [];
        let productsAdded = 0;
        let productsRemoved = 0;
        let productsIncreased = 0;
        let productsDecreased = 0;

        let initialProducts = initialData.map(item => item.product);
        let currentProducts = currentData.map(item => item.product);

        // Check for removed and altered products
        initialData.forEach(initial => {
            let current = currentData.find(item => item.product === initial.product);
            let diff = {};
            if (current) {
                if (initial.quantity !== current.quantity) {
                    diff.product = initial.product;
                    diff.quantityChange = current.quantity - initial.quantity;
                    differences.push(diff);
                    if (diff.quantityChange > 0) {
                        productsIncreased++;
                    } else {
                        productsDecreased++;
                    }
                }
            } else {
                diff.removedProduct = initial.product;
                differences.push(diff);
                productsRemoved++;
            }
        });

        // Check for new products
        currentData.forEach(current => {
            let initial = initialData.find(item => item.product === current.product);
            if (!initial) {
                differences.push({
                    newProduct: current.product
                });
                productsAdded++;
            }
        });

        differences.summary = {
            productsAdded,
            productsRemoved,
            productsIncreased,
            productsDecreased
        };

        return differences;
    }

    function showDifferencesModal(differences) {
        let modalContent = document.getElementById("differencesModalContent");
        modalContent.innerHTML = "";

        let summary = differences.summary;
        // modalContent.innerHTML +=
        //     `<div><p>Number of products added: ${summary.productsAdded}</p></div>`;
        modalContent.innerHTML +=
            `<div><p><b>Number of products removed: ${summary.productsRemoved}</b></p></div>`;
        // modalContent.innerHTML +=
        //     `<div><p>Number of products whose quantity increased: ${summary.productsIncreased}</p></div>`;
        modalContent.innerHTML +=
            `<div><p><b>Number of products whose quantity decreased: ${summary.productsDecreased}</b></p></div>`;

        if (differences.length === 0) {
            modalContent.innerHTML = "<p>No changes detected.</p>";
        } else {
            differences.forEach(diff => {
                if (diff.newProduct) {
                    // modalContent.innerHTML +=
                    //     `<div><p>New product added: ${diff.newProduct}</p></div>`;
                } else if (diff.removedProduct) {
                    modalContent.innerHTML +=
                        `<div><p><b>Product removed:</b> ${diff.removedProduct}</p></div>`;
                } else if (diff.product && diff.quantityChange !== undefined) {
                    let quantityChange;
                    if (diff.quantityChange > 0) {
                        // quantityChange = `increased by ${diff.quantityChange}`;
                    } else {
                        quantityChange = `<b>decreased by ${Math.abs(diff.quantityChange)}</b>`;
                    }

                    modalContent.innerHTML += `<div><p>Product ${diff.product} quantity ${quantityChange}</p></div>`;

                }
            });


        }

        $("#differencesModal").modal("show");
    }

    try {
        document.getElementById('submitPassword').addEventListener('click', function () {
            const dummyPassword = 'Less@9092'; // Dummy password
            const enteredPassword = document.getElementById('passwordInput').value;

            if (enteredPassword === dummyPassword) {
                // alert('Password is correct!');
                $('div#confirmSuspendModal').modal('show');
                enteredPassword.value = '';
                // Perform additional actions or close the modal as needed
                // For example, closing the modal:
                $('#differencesModal').modal('hide');
            } else {
                document.getElementById('passwordMessage').style.display = 'block';
            }
        });
    } catch (error) {
        console.log(error);
    }
    //

    $('button#pos-suspend').click(function () {
        $('input#is_suspend').val(1);
        $('div#confirmSuspendModal').modal('hide');
        // pos_form_obj.submit();
        var data = $(pos_form_obj).serialize();
        data = data + '&payment_status=due';
        data = data + '&status=final';
        const buttons = document.querySelectorAll('button');

        // Disable each button
        buttons.forEach(button => {
            button.disabled = true;
        });
        $.ajax({
            type: pos_form_obj.attr('method'), // Get the method from the form (POST/GET)
            url: pos_form_obj.attr('action'), // Get the action URL from the form
            data: data, // Serialize the form data
            success: function (response) {
                console.log('Form submission successful:', response);

                enable_pos_form_actions();
                if (response.success == 1) {
                    try {
                        var htmlContent = '<!DOCTYPE html>';
                        htmlContent += '<html lang="en">';
                        htmlContent += '<head>';
                        htmlContent += '<meta charset="UTF-8">';
                        htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
                        htmlContent += '<title>Print KOT</title>';
                        htmlContent += '<style>';
                        htmlContent += '.myStyle { display: flex; justify-content: space-between; }';
                        htmlContent += 'body { font-size:18px;font-family: emoji; }';
                        htmlContent += '.myhr { border: 0; height: 3px; background: black; }';
                        htmlContent += '.container { display: flex; justify-content: space-between; align-items: center; width: 90%; margin: 0 auto; }';
                        htmlContent += '.item { flex: 3; }';
                        htmlContent += '.quantity { flex: 1; }';
                        htmlContent += '</style>';
                        htmlContent += '</head>';
                        htmlContent += '<body>';
    
                        var currentDate = new Date(); // Get the current date and time
                        var formattedDateTime = currentDate.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true // Set to false for 24-hour format
                        });
    
                        // Parse the string to create a Date object
                        var dateObj = new Date(response.transaction.created_at);
    
                        // Format the date and time
                        var formattedDateTime2 = dateObj.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true // Set to false for 24-hour format
                        });
    
                        // General details
                        htmlContent += '<center style="border: 2px solid black;border-radius: 4px;">KOT</center>';
                        htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Print Date & Time:</span><span>' + formattedDateTime + '</span></div>';
                        htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Order Date & Time:</span><span>' + formattedDateTime2 + '</span></div>';
                        htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Invoice:</span><span>' + response.transaction.invoice_no + '</span></div>';
                        htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Order Type:</span><span>' + response.service_type + '</span></div>';
                        htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Server:</span><span>' + response.waiter + '</span></div>';
                        htmlContent += '<div style="display: flex; justify-content: center;font-size:20px;"><span>Table:&nbsp;&nbsp;</span><span>' + response.table_name + ' </span></div>';
    
                        htmlContent += '<hr class="myhr">';
                        var isFirstIteration = true;
                        // Item details
                        htmlContent += '<div class="container" style="border-top: 2px solid black; border-bottom: 2px solid black;font-size:16px;"><div class="quantity" style="text-align: center;">QTY</div><div class="item">Item</div></div>';
                        if ((response.newData.item_details).length > 0) {
                            (response.newData.item_details).forEach(function (item) {
                                if (isFirstIteration) {
                                    htmlContent += '<div class="container" style="font-size:14px;"><div class="quantity" style="text-align: center;">' + item.quantity + '</div><div class="item">' + item.product_name + '</div></div>';
                                    isFirstIteration = false;
                                }
                                else {
                                    htmlContent += '<div class="container" style="border-top: 1px solid black;font-size:14px;"><div class="quantity" style="text-align: center;">' + item.quantity + '</div><div class="item">' + item.product_name + '</div></div>';
                                }
                                if (item.note != null && item.note != "") {
                                    htmlContent += '<div class="container" style="font-size:14px;"><span><b>Note: </b>' + item.note + '</span></div>';
                                }
                            });
                        } else {
                            htmlContent += '<p>No items found</p>';
                        }
    
                        if (response.newData.transaction_note != null && response.newData.transaction_note != "") {
                            htmlContent += '<hr class="myhr">';
                            htmlContent += '<div class="myStyle"><span>Order Note:</span><span style="style="font-size:14px;">' + response.newData.transaction_note + '</span></div>';
                        }
                        htmlContent += '<hr class="myhr">';
                        htmlContent += '<div class="myStyle" style="border-top: 2px solid black;font-size:12px;"><span>COUNTER:</span><span>' + response.sales_person.last_name + '</span></div>';
                        htmlContent += '<div class="myStyle" style="font-size:12px;"><span>USER:</span><span>' + response.sales_person.first_name + '</span></div>';
    
                        htmlContent += '</body>';
                        htmlContent += '</html>';
    
                        var printWindow = window.open('', '_blank');
                        printWindow.document.open();
                        printWindow.document.write(htmlContent);
                        printWindow.document.close();
                        printWindow.print();
                        printWindow.close();
                    } catch (error) {
                        console.log(error);
                    }
    
                    $('input#is_suspend').val(0);
                    $('#myStaff').text('Select service staff');
                    $('#myTable').text('Select Table');
                    // Remove onbeforeunload event listener if present
                    window.onbeforeunload = null;
                    window.location.replace("/pos/create");
                } else {
                    buttons.forEach(button => {
                        button.disabled = false;
                    });
                    toastr.error(response.msg);
                }

            },
            error: function (xhr, status, error) {
                console.error('Form submission failed:', status, error);
                buttons.forEach(button => {
                    button.disabled = false;
                });
                $('input#is_suspend').val(0);
                $('#myStaff').text('Select service staff');
                $('#myTable').text('Select Table');
                // window.location.href = "/pos/create";
                // Remove onbeforeunload event listener if present
                // window.onbeforeunload = null;
                // window.location.replace("/pos/create");
            }
        });

    });

    $('#my-pos-cash').click(function () {
        $('div#cashModal').modal('hide');
        pos_form_obj.submit();
        $('#myStaff').text('Select service staff');
        $('#myTable').text('Select Table');
    });

    //fix select2 input issue on modal
    $('#modal_payment')
        .find('.select2')
        .each(function () {
            $(this).select2({
                dropdownParent: $('#modal_payment'),
            });
        });

    $('button#add-payment-row').click(function () {
        var row_index = $('#payment_row_index').val();
        var location_id = $('input#location_id').val();
        $.ajax({
            method: 'POST',
            url: '/sells/pos/get_payment_row',
            data: { row_index: row_index, location_id: location_id },
            dataType: 'html',
            success: function (result) {
                if (result) {
                    var appended = $('#payment_rows_div').append(result);

                    var total_payable = __read_number($('input#final_total_input'));
                    var total_paying = __read_number($('input#total_paying_input'));
                    var b_due = total_payable - total_paying;
                    $(appended)
                        .find('input.payment-amount')
                        .focus();
                    $(appended)
                        .find('input.payment-amount')
                        .last()
                        .val(__currency_trans_from_en(b_due, false))
                        .change()
                        .select();
                    __select2($(appended).find('.select2'));
                    $(appended).find('#method_' + row_index).change();
                    $('#payment_row_index').val(parseInt(row_index) + 1);
                }
            },
        });
    });

    $(document).on('click', '.remove_payment_row', function () {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(willDelete => {
            if (willDelete) {
                $(this)
                    .closest('.payment_row')
                    .remove();
                calculate_balance_due();
            }
        });
    });

    pos_form_validator = pos_form_obj.validate({
        submitHandler: function (form) {
            // var total_payble = __read_number($('input#final_total_input'));
            // var total_paying = __read_number($('input#total_paying_input'));
            var cnf = true;

            //Ignore if the difference is less than 0.5
            if ($('input#in_balance_due').val() >= 0.5) {
                cnf = confirm(LANG.paid_amount_is_less_than_payable);
                // if( total_payble > total_paying ){
                // 	cnf = confirm( LANG.paid_amount_is_less_than_payable );
                // } else if(total_payble < total_paying) {
                // 	alert( LANG.paid_amount_is_more_than_payable );
                // 	cnf = false;
                // }
            }

            var total_advance_payments = 0;
            $('#payment_rows_div').find('select.payment_types_dropdown').each(function () {
                if ($(this).val() == 'advance') {
                    total_advance_payments++
                };
            });

            if (total_advance_payments > 1) {
                alert(LANG.advance_payment_cannot_be_more_than_once);
                return false;
            }

            var is_msp_valid = true;
            //Validate minimum selling price if hidden
            $('.pos_unit_price_inc_tax').each(function () {
                if (!$(this).is(":visible") && $(this).data('rule-min-value')) {
                    var val = __read_number($(this));
                    var error_msg_td = $(this).closest('tr').find('.pos_line_total_text').closest('td');
                    if (val > $(this).data('rule-min-value')) {
                        is_msp_valid = false;
                        error_msg_td.append('<label class="error">' + $(this).data('msg-min-value') + '</label>');
                    } else {
                        error_msg_td.find('label.error').remove();
                    }
                }
            });

            if (!is_msp_valid) {
                return false;
            }

            if (cnf) {
                disable_pos_form_actions();

                var data = $(form).serialize();
                data = data + '&status=final';
                var url = $(form).attr('action');
                $.ajax({
                    method: 'POST',
                    url: url,
                    data: data,
                    dataType: 'json',
                    success: function (result) {
                        if (result.success == 1) {
                            if (result.whatsapp_link) {
                                window.open(result.whatsapp_link);
                            }
                            $('#modal_payment').modal('hide');
                            toastr.success(result.msg);

                            reset_pos_form();

                            //Check if enabled or not
                            if (result.receipt.is_enabled) {
                                pos_print(result.receipt);
                            }
                        } else {
                            toastr.error(result.msg);
                        }

                        enable_pos_form_actions();
                    },
                });
            }
            return false;
        },
    });

    $(document).on('change', '.payment-amount', function () {
        calculate_balance_due();
    });

    //Update discount
    $('button#posEditDiscountModalUpdate').click(function () {

        //if discount amount is not valid return false
        if (!$("#discount_amount_modal").valid()) {
            return false;
        }
        //Close modal
        $('div#posEditDiscountModal').modal('hide');

        //Update values
        $('input#discount_type').val($('select#discount_type_modal').val());
        __write_number($('input#discount_amount'), __read_number($('input#discount_amount_modal')));

        if ($('#reward_point_enabled').length) {
            var reward_validation = isValidatRewardPoint();
            if (!reward_validation['is_valid']) {
                toastr.error(reward_validation['msg']);
                $('#rp_redeemed_modal').val(0);
                $('#rp_redeemed_modal').change();
            }
            updateRedeemedAmount();
        }

        pos_total_row();
    });

    // $('.clickable').click(function() {
    //     console.log("Span tag clicked!");
    //     // $('div#table_modal').modal('hide');
    // });

    //Shipping
    $('button#posShippingModalUpdate').click(function () {
        //Close modal
        $('div#posShippingModal').modal('hide');

        //update shipping details
        $('input#shipping_details').val($('#shipping_details_modal').val());

        $('input#shipping_address').val($('#shipping_address_modal').val());
        $('input#shipping_status').val($('#shipping_status_modal').val());
        $('input#delivered_to').val($('#delivered_to_modal').val());

        //Update shipping charges
        __write_number(
            $('input#shipping_charges'),
            __read_number($('input#shipping_charges_modal'))
        );

        //$('input#shipping_charges').val(__read_number($('input#shipping_charges_modal')));

        pos_total_row();
    });

    $('#posShippingModal').on('shown.bs.modal', function () {
        $('#posShippingModal')
            .find('#shipping_details_modal')
            .filter(':visible:first')
            .focus()
            .select();
        // $('.select2-selection__rendered').css('padding-right', '150px');
    });

    $(document).on('shown.bs.modal', '.row_edit_product_price_model', function () {
        $('.row_edit_product_price_model')
            .find('input')
            .filter(':visible:first')
            .focus()
            .select();
    });

    //Update Order tax
    $('button#posEditOrderTaxModalUpdate').click(function () {
        //Close modal
        $('div#posEditOrderTaxModal').modal('hide');

        var tax_obj = $('select#order_tax_modal');
        var tax_id = tax_obj.val();
        var tax_rate = tax_obj.find(':selected').data('rate');

        $('input#tax_rate_id').val(tax_id);

        __write_number($('input#tax_calculation_amount'), tax_rate);
        pos_total_row();
    });

    $(document).on('click', '.add_new_customer', function () {
        $('#customer_id').select2('close');
        var name = $(this).data('name');
        $('.contact_modal')
            .find('input#name')
            .val(name);
        $('.contact_modal')
            .find('select#contact_type')
            .val('customer')
            .closest('div.contact_type_div')
            .addClass('hide');
        $('.contact_modal').modal('show');
    });
    $('form#quick_add_contact')
        .submit(function (e) {
            e.preventDefault();
        })
        .validate({
            rules: {
                contact_id: {
                    remote: {
                        url: '/contacts/check-contacts-id',
                        type: 'post',
                        data: {
                            contact_id: function () {
                                return $('#contact_id').val();
                            },
                            hidden_id: function () {
                                if ($('#hidden_id').length) {
                                    return $('#hidden_id').val();
                                } else {
                                    return '';
                                }
                            },
                        },
                    },
                },
            },
            messages: {
                contact_id: {
                    remote: LANG.contact_id_already_exists,
                },
            },
            submitHandler: function (form) {
                $.ajax({
                    method: 'POST',
                    url: base_path + '/check-mobile',
                    dataType: 'json',
                    data: {
                        contact_id: function () {
                            return $('#hidden_id').val();
                        },
                        mobile_number: function () {
                            return $('#mobile').val();
                        },
                    },
                    beforeSend: function (xhr) {
                        __disable_submit_button($(form).find('button[type="submit"]'));
                    },
                    success: function (result) {
                        if (result.is_mobile_exists == true) {
                            swal({
                                title: LANG.sure,
                                text: result.msg,
                                icon: 'warning',
                                buttons: true,
                                dangerMode: true,
                            }).then(willContinue => {
                                if (willContinue) {
                                    submitQuickContactForm(form);
                                } else {
                                    $('#mobile').select();
                                }
                            });

                        } else {
                            submitQuickContactForm(form);
                        }
                    },
                });
            },
        });
    $('.contact_modal').on('hidden.bs.modal', function () {
        $('form#quick_add_contact')
            .find('button[type="submit"]')
            .removeAttr('disabled');
        $('form#quick_add_contact')[0].reset();
    });

    //Updates for add sell
    $('select#discount_type, input#discount_amount, input#shipping_charges, \
        input#rp_redeemed_amount').change(function () {
        pos_total_row();
    });
    $('select#tax_rate_id').change(function () {
        var tax_rate = $(this)
            .find(':selected')
            .data('rate');
        __write_number($('input#tax_calculation_amount'), tax_rate);
        pos_total_row();
    });
    //Datetime picker
    $('#transaction_date').datetimepicker({
        format: moment_date_format + ' ' + moment_time_format,
        ignoreReadonly: true,
    });

    //Direct sell submit
    sell_form = $('form#add_sell_form');
    if ($('form#edit_sell_form').length) {
        sell_form = $('form#edit_sell_form');
        pos_total_row();
    }
    sell_form_validator = sell_form.validate();

    $('button#submit-sell, button#save-and-print').click(function (e) {
        // Check if a table is selected
        if ($('#res_table_id').val() === '') {
            // e.preventDefault(); // Prevent form submission
            toastr.warning('Please select a table.');
            return false;
        }

        if ($('input[name="types_of_service_text"]').length === 0) {
            // Check if any service type radio button is selected
            if (!$('input[name="types_of_service_id"]:checked').length) {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Please select an Order Type.');
                return false;
            }
        }
        else {
            if ($('input[name="types_of_service_text"]').val() === '') {
                // e.preventDefault(); // Prevent form submission
                toastr.warning('Service type text cannot be empty.');
                return false;
            }
        }

        //Check if product is present or not.
        if ($('table#pos_table tbody').find('.product_row').length <= 0) {
            toastr.warning(LANG.no_products_added);
            return false;
        }

        var is_msp_valid = true;
        //Validate minimum selling price if hidden
        $('.pos_unit_price_inc_tax').each(function () {
            if (!$(this).is(":visible") && $(this).data('rule-min-value')) {
                var val = __read_number($(this));
                var error_msg_td = $(this).closest('tr').find('.pos_line_total_text').closest('td');
                if (val > $(this).data('rule-min-value')) {
                    is_msp_valid = false;
                    error_msg_td.append('<label class="error">' + $(this).data('msg-min-value') + '</label>');
                } else {
                    error_msg_td.find('label.error').remove();
                }
            }
        });

        if (!is_msp_valid) {
            return false;
        }

        if ($(this).attr('id') == 'save-and-print') {
            $('#is_save_and_print').val(1);
        } else {
            $('#is_save_and_print').val(0);
        }

        if ($('#reward_point_enabled').length) {
            var validate_rp = isValidatRewardPoint();
            if (!validate_rp['is_valid']) {
                toastr.error(validate_rp['msg']);
                return false;
            }
        }

        if ($('.enable_cash_denomination_for_payment_methods').length) {
            var payment_row = $('.enable_cash_denomination_for_payment_methods').closest('.payment_row');
            var is_valid = true;
            var payment_type = payment_row.find('.payment_types_dropdown').val();
            var denomination_for_payment_types = JSON.parse($('.enable_cash_denomination_for_payment_methods').val());
            if (denomination_for_payment_types.includes(payment_type) && payment_row.find('.is_strict').length && payment_row.find('.is_strict').val() === '1') {
                var payment_amount = __read_number(payment_row.find('.payment-amount'));
                var total_denomination = payment_row.find('input.denomination_total_amount').val();
                if (payment_amount != total_denomination) {
                    is_valid = false;
                }
            }

            if (!is_valid) {
                payment_row.find('.cash_denomination_error').removeClass('hide');
                toastr.error(payment_row.find('.cash_denomination_error').text());
                e.preventDefault();
                return false;
            } else {
                payment_row.find('.cash_denomination_error').addClass('hide');
            }
        }

        if (sell_form.valid()) {
            window.onbeforeunload = null;
            $(this).attr('disabled', true);
            sell_form.submit();
        }
    });

    //REPAIR MODULE:check if repair module field is present send data to filter product
    var is_enabled_stock = null;
    if ($("#is_enabled_stock").length) {
        is_enabled_stock = $("#is_enabled_stock").val();
    }

    var device_model_id = null;
    if ($("#repair_model_id").length) {
        device_model_id = $("#repair_model_id").val();
    }

    //Show product list.
    get_product_suggestion_list(
        $('select#product_category').val(),
        $('select#product_brand').val(),
        $('input#location_id').val(),
        null,
        is_enabled_stock,
        device_model_id
    );
    $('select#product_category, select#product_brand, select#select_location_id').on('change', function (e) {
        $('input#suggestion_page').val(1);
        var location_id = $('input#location_id').val();
        if (location_id != '' || location_id != undefined) {
            get_product_suggestion_list(
                $('select#product_category').val(),
                $('select#product_brand').val(),
                $('input#location_id').val(),
                null
            );
        }

        get_featured_products();
    });

    $(document).on('click', 'div.product_box', function () {
        //Check if location is not set then show error message.
        if ($('input#location_id').val() == '') {
            toastr.warning(LANG.select_location);
        } else {
            pos_product_row($(this).data('variation_id'));
        }
    });

    $(document).on('shown.bs.modal', '.row_description_modal', function () {
        $(this)
            .find('textarea')
            .first()
            .focus();
    });

    //Press enter on search product to jump into last quantty and vice-versa
    $('#search_product').keydown(function (e) {
        var key = e.which;
        if (key == 9) {
            // the tab key code
            e.preventDefault();
            if ($('#pos_table tbody tr').length > 0) {
                $('#pos_table tbody tr:last')
                    .find('input.pos_quantity')
                    .focus()
                    .select();
            }
        }
    });
    $('#pos_table').on('keypress', 'input.pos_quantity', function (e) {
        var key = e.which;
        if (key == 13) {
            // the enter key code
            $('#search_product').focus();
        }
    });

    $('#exchange_rate').change(function () {
        var curr_exchange_rate = 1;
        if ($(this).val()) {
            curr_exchange_rate = __read_number($(this));
        }
        var total_payable = __read_number($('input#final_total_input'));
        var shown_total = total_payable * curr_exchange_rate;
        $('span#total_payable').text(__currency_trans_from_en(shown_total, false));
    });

    $('select#price_group').change(function () {
        $('input#hidden_price_group').val($(this).val());
    });

    //Quick add product
    $(document).on('click', 'button.pos_add_quick_product', function () {
        var url = $(this).data('href');
        var container = $(this).data('container');
        $.ajax({
            url: url + '?product_for=pos',
            dataType: 'html',
            success: function (result) {
                $(container)
                    .html(result)
                    .modal('show');
                $('.os_exp_date').datepicker({
                    autoclose: true,
                    format: 'dd-mm-yyyy',
                    clearBtn: true,
                });
            },
        });
    });

    $(document).on('change', 'form#quick_add_product_form input#single_dpp', function () {
        var unit_price = __read_number($(this));
        $('table#quick_product_opening_stock_table tbody tr').each(function () {
            var input = $(this).find('input.unit_price');
            __write_number(input, unit_price);
            input.change();
        });
    });

    $(document).on('quickProductAdded', function (e) {
        //Check if location is not set then show error message.
        if ($('input#location_id').val() == '') {
            toastr.warning(LANG.select_location);
        } else {
            pos_product_row(e.variation.id);
        }
    });

    $('div.view_modal').on('show.bs.modal', function () {
        __currency_convert_recursively($(this));
    });

    $('table#pos_table').on('change', 'select.sub_unit', function () {
        var tr = $(this).closest('tr');
        var base_unit_selling_price = tr.find('input.hidden_base_unit_sell_price').val();

        var selected_option = $(this).find(':selected');

        var multiplier = parseFloat(selected_option.data('multiplier'));

        var allow_decimal = parseInt(selected_option.data('allow_decimal'));

        tr.find('input.base_unit_multiplier').val(multiplier);

        var unit_sp = base_unit_selling_price * multiplier;

        var sp_element = tr.find('input.pos_unit_price');
        __write_number(sp_element, unit_sp);

        sp_element.change();

        var qty_element = tr.find('input.pos_quantity');
        var base_max_avlbl = qty_element.data('qty_available');
        var error_msg_line = 'pos_max_qty_error';

        if (tr.find('select.lot_number').length > 0) {
            var lot_select = tr.find('select.lot_number');
            if (lot_select.val()) {
                base_max_avlbl = lot_select.find(':selected').data('qty_available');
                error_msg_line = 'lot_max_qty_error';
            }
        }

        qty_element.attr('data-decimal', allow_decimal);
        var abs_digit = true;
        if (allow_decimal) {
            abs_digit = false;
        }
        qty_element.rules('add', {
            abs_digit: abs_digit,
        });

        if (base_max_avlbl) {
            var max_avlbl = parseFloat(base_max_avlbl) / multiplier;
            var formated_max_avlbl = __number_f(max_avlbl);
            var unit_name = selected_option.data('unit_name');
            var max_err_msg = __translate(error_msg_line, {
                max_val: formated_max_avlbl,
                unit_name: unit_name,
            });
            qty_element.attr('data-rule-max-value', max_avlbl);
            qty_element.attr('data-msg-max-value', max_err_msg);
            qty_element.rules('add', {
                'max-value': max_avlbl,
                messages: {
                    'max-value': max_err_msg,
                },
            });
            qty_element.trigger('change');
        }
        adjustComboQty(tr);
    });

    //Confirmation before page load.
    window.onbeforeunload = function () {
        if ($('form#edit_pos_sell_form').length == 0) {
            if ($('table#pos_table tbody tr').length > 0) {
                return LANG.sure;
            } else {
                return null;
            }
        }
    }
    $(window).resize(function () {
        var win_height = $(window).height();
        div_height = __calculate_amount('percentage', 63, win_height);
        $('div.pos_product_div').css('min-height', div_height + 'px');
        $('div.pos_product_div').css('max-height', div_height + 'px');
    });

    //Used for weighing scale barcode
    $('#weighing_scale_modal').on('shown.bs.modal', function (e) {

        //Attach the scan event
        onScan.attachTo(document, {
            suffixKeyCodes: [13], // enter-key expected at the end of a scan
            reactToPaste: true, // Compatibility to built-in scanners in paste-mode (as opposed to keyboard-mode)
            onScan: function (sCode, iQty) {
                console.log('Scanned: ' + iQty + 'x ' + sCode);
                $('input#weighing_scale_barcode').val(sCode);
                $('button#weighing_scale_submit').trigger('click');
            },
            onScanError: function (oDebug) {
                console.log(oDebug);
            },
            minLength: 2
            // onKeyDetect: function(iKeyCode){ // output all potentially relevant key events - great for debugging!
            //     console.log('Pressed: ' + iKeyCode);
            // }
        });

        $('input#weighing_scale_barcode').focus();
    });

    $('#weighing_scale_modal').on('hide.bs.modal', function (e) {
        //Detach from the document once modal is closed.
        onScan.detachFrom(document);
    });

    $('button#weighing_scale_submit').click(function () {

        var price_group = '';
        if ($('#price_group').length > 0) {
            price_group = $('#price_group').val();
        }

        if ($('#weighing_scale_barcode').val().length > 0) {
            pos_product_row(null, null, $('#weighing_scale_barcode').val());
            $('#weighing_scale_modal').modal('hide');
            $('input#weighing_scale_barcode').val('');
        } else {
            $('input#weighing_scale_barcode').focus();
        }
    });

    $('#show_featured_products').click(function () {
        if (!$('#featured_products_box').is(':visible')) {
            $('#featured_products_box').fadeIn();
        } else {
            $('#featured_products_box').fadeOut();
        }
    });
    validate_discount_field();
    set_payment_type_dropdown();
    if ($('#__is_mobile').length) {
        $('.pos_form_totals').css('margin-bottom', $('.pos-form-actions').height() - 30);
    }

    setInterval(function () {
        if ($('span.curr_datetime').length) {
            $('span.curr_datetime').html(__current_datetime());
        }
    }, 60000);

    set_search_fields();
});

function set_payment_type_dropdown() {
    var payment_settings = $('#location_id').data('default_payment_accounts');
    payment_settings = payment_settings ? payment_settings : [];
    enabled_payment_types = [];
    for (var key in payment_settings) {
        if (payment_settings[key] && payment_settings[key]['is_enabled']) {
            enabled_payment_types.push(key);
        }
    }
    if (enabled_payment_types.length) {
        $(".payment_types_dropdown > option").each(function () {
            //skip if advance
            if ($(this).val() && $(this).val() != 'advance') {
                if (enabled_payment_types.indexOf($(this).val()) != -1) {
                    $(this).removeClass('hide');
                } else {
                    $(this).addClass('hide');
                }
            }
        });
    }
}

function get_featured_products() {
    var location_id = $('#location_id').val();
    if (location_id && $('#featured_products_box').length > 0) {
        $.ajax({
            method: 'GET',
            url: '/sells/pos/get-featured-products/' + location_id,
            dataType: 'html',
            success: function (result) {
                if (result) {
                    $('#feature_product_div').removeClass('hide');
                    $('#featured_products_box').html(result);
                } else {
                    $('#feature_product_div').addClass('hide');
                    $('#featured_products_box').html('');
                }
            },
        });
    } else {
        $('#feature_product_div').addClass('hide');
        $('#featured_products_box').html('');
    }
}

function get_product_suggestion_list(category_id, brand_id, location_id, url = null, is_enabled_stock = null, repair_model_id = null) {
    if ($('div#product_list_body').length == 0) {
        return false;
    }

    if (url == null) {
        url = '/sells/pos/get-product-suggestion';
    }
    $('#suggestion_page_loader').fadeIn(700);
    var page = $('input#suggestion_page').val();
    if (page == 1) {
        $('div#product_list_body').html('');
    }
    if ($('div#product_list_body').find('input#no_products_found').length > 0) {
        $('#suggestion_page_loader').fadeOut(700);
        return false;
    }
    $.ajax({
        method: 'GET',
        url: url,
        data: {
            category_id: category_id,
            brand_id: brand_id,
            location_id: location_id,
            page: page,
            is_enabled_stock: is_enabled_stock,
            repair_model_id: repair_model_id
        },
        dataType: 'html',
        success: function (result) {
            $('div#product_list_body').append(result);
            $('#suggestion_page_loader').fadeOut(700);
        },
    });
}

//Get recent transactions
function get_recent_transactions(status, element_obj) {
    if (element_obj.length == 0) {
        return false;
    }
    var transaction_sub_type = $("#transaction_sub_type").val();
    $.ajax({
        method: 'GET',
        url: '/sells/pos/get-recent-transactions',
        data: { status: status, transaction_sub_type: transaction_sub_type },
        dataType: 'html',
        success: function (result) {
            element_obj.html(result);
            __currency_convert_recursively(element_obj);
        },
    });
}

function get_staff(status, element_obj) {
    if (element_obj.length == 0) {
        return false;
    }
    // var transaction_sub_type = $("#transaction_sub_type").val();
    $.ajax({
        method: 'GET',
        url: '/modules/data/get-staff',
        data: { location_id: status },
        dataType: 'json',
        success: function (result) {
            displayStaff(result);
        },
    });
}

function displayStaff(staffData) {
    // Assuming tablesData is an array of table numbers
    var container = $('#staff_active');
    container.empty(); // Clear previous content
    staffData.forEach(function (staff) {

        var staffInfo = $('<div>', {
            class: 'grid-staff',
            style: 'background-color: #c6c6c6; color: black; cursor: pointer;',
        });

        var name = $('<strong>', {
            style: 'margin: 5px;'
        }).html('<i class="fa fa-table" aria-hidden="true"></i> ' + staff.first_name);

        staffInfo.append(name);
        container.append(staffInfo);

        staffInfo.on('click', function () {
            $('select[name="res_waiter_id"]').val(staff.id);
            $('#myStaff').text(staff.first_name);
            $('#staff_modal').modal('hide');
        });

    });
}

function get_tables(status, element_obj) {
    if (element_obj.length == 0) {
        return false;
    }
    var transaction_sub_type = $("#transaction_sub_type").val();
    $.ajax({
        method: 'GET',
        url: '/modules/data/get-tables',
        data: { location_id: status },
        dataType: 'json',
        success: function (result) {
            displayTables(result.data);

            // Add event listener to search input
            $('#tableSearch').on('input', function () {
                var searchTerm = $(this).val().toLowerCase();
                var filteredTables = result.data.filter(function (table) {
                    return table.name.toLowerCase().includes(searchTerm) || table.waiter.toLowerCase().includes(searchTerm);
                });
                displayTables(filteredTables);
            });
        },
    });
}

function displayTables(tablesData) {
    // Assuming tablesData is an array of table numbers
    var container = $('#table_active');
    container.empty(); // Clear previous content

    console.log(tablesData);

    var fieldValue = localStorage.getItem('table');
    console.log("asdffgjgjk ", fieldValue);
    tablesData.forEach(function (table) {
        if (fieldValue != null && fieldValue != "" && fieldValue.toLowerCase() !== table.name[0].toLowerCase()) {
            console.log("Skipping table with name:", table.name[0]);
            return; // Use return to skip to the next iteration
        }
        var backgroundColor = table.isActive ? '#f2594e' : '#c6c6c6';
        var textColor = table.isActive ? 'white' : 'black';

        var tableInfo = $('<div>', {
            class: 'grid-item',
            style: 'background-color: ' + backgroundColor + '; color: ' + textColor + ';cursor: pointer;',
        });

        tableInfo.hover(function () {
            $(this).css({
                // CSS properties for hover state
                // Scale to 1.1 times the original size
                'transform': 'scale(1.1)',
                'box-shadow': '0 0 10px rgba(0, 0, 0, 0.5)', // Add a shadow effect
            });
        }, function () {
            $(this).css({
                // CSS properties when not hovered
                // Reset the scale to normal and remove shadow
                'transform': 'scale(1)',
                'box-shadow': 'none',
            });
        });

        var persons = table.transaction != null ? table.transaction.custom_field_4 != null ? table.transaction.custom_field_4 : 0 : 0;

        var name = $('<strong>', {
            style: 'margin: 0px; text-align: center; font-size: 20px;'
        }).text(table.name);
        // var description = $('<br>').add($('<strong>').text('Description: ' + (table.description ? table.description : 'N/A')));
        var serviceStaff = $('<p>', {
            style: 'margin: 2px;'
        }).html('<i class="fa fa-user" aria-hidden="true"></i> ' + table.waiter);
        var myper = $('<p>', {
            style: 'margin: 2px;'
        }).html('No.of persons ' + persons);
        // var serviceStaff = $('<div>', {
        //     style: 'margin: 5px 0px; display: flex; justify-content: space-between; align-items: center;'
        // }).html('<i class="fa fa-user" aria-hidden="true"></i> ' + table.waiter +
        //     '<br/><div>' + persons + ' persons</div>');
        var activeFrom = $('<p>', {
            style: 'margin: 2px;'
        }).html('<i class="fa fa-clock" aria-hidden="true"></i> ' + (table.isActiveFrom ? calculateTimePassed(table.isActiveFrom) : '00:00:00'));
        tableInfo.append(name, myper, serviceStaff, activeFrom);
        container.append(tableInfo);

        if (table.isActive) {
            //myCode start
            // Add print icon for active tables
            var flexContainer = $('<div>', {
                style: 'display: flex; width: 100%;'
            });

            // Create the buttons
            var printButton = $('<button>', {
                class: 'btn btn-warning',
                style: 'cursor: pointer; width: 50%;font-size: 10px;font-weight: bolder;',
                text: 'D-KOT'
            });

            var printButton2 = $('<button>', {
                class: 'btn btn-success',
                style: 'cursor: pointer; width: 50%;font-size: 10px;font-weight: bolder;',
                text: 'PRE-BILL'
            });

            // Append the buttons to the flex container
            flexContainer.append(printButton);
            flexContainer.append(printButton2);

            // Append the flex container to tableInfo or any other container
            tableInfo.append(flexContainer);

            printButton.on('click', function (event) {
                event.stopPropagation(); // Prevent click event from bubbling up to tableInfo
                //
                //     var items = table.itemDetails;
                // var htmlContent = '<div class="print-container">';

                // // Check if items array is not empty
                // if (items.length > 0) {
                //     htmlContent += '<h2>Item Details</h2>';
                //     htmlContent += '<ul>';
                //     // Iterate over each item in the array
                //     items.forEach(function(item) {
                //         htmlContent += '<li>' + item.name + ' - Quantity: ' + item.qty + '</li>';
                //     });
                //     htmlContent += '</ul>';
                // } else {
                //     htmlContent += '<p>No items found</p>';
                // }

                // htmlContent += '</div>';

                // // Create a hidden div to hold the HTML content for printing
                // var printWindow = window.open('', '_blank');
                // printWindow.document.open();
                // printWindow.document.write('<html><head><title>Print Item Details</title><style>body{font-family: Arial, sans-serif;}.print-container{padding: 20px;}.print-container h2{margin-bottom: 10px;}.print-container ul{list-style: none;padding: 0;}.print-container li{margin-bottom: 5px;}</style></head><body>');
                // printWindow.document.write(htmlContent);
                // printWindow.document.write('</body></html>');
                // printWindow.document.close();

                // // Display print dialog box
                // printWindow.print();
                // printWindow.close(); // Close the window after printing


                var items = table.itemDetails;

                var htmlContent = '<!DOCTYPE html>';
                htmlContent += '<html lang="en">';
                htmlContent += '<head>';
                htmlContent += '<meta charset="UTF-8">';
                htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
                htmlContent += '<title>Print KOT</title>';
                htmlContent += '<style>';
                htmlContent += '.myStyle { display: flex; justify-content: space-between; }';
                htmlContent += 'body { font-size:18px;font-family: emoji;font-weight: 800; }';
                htmlContent += '.myhr { border: 0; height: 3px; background: black; }';
                htmlContent += '.container { display: flex; justify-content: space-between; align-items: center; width: 90%; margin: 0 auto; }';
                htmlContent += '.item { flex: 3; }';
                htmlContent += '.quantity { flex: 1; }';
                htmlContent += '</style>';
                htmlContent += '</head>';
                htmlContent += '<body>';

                var currentDate = new Date(); // Get the current date and time
                var formattedDateTime = currentDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true // Set to false for 24-hour format
                });

                // Parse the string to create a Date object
                var dateObj = new Date(table.isActiveFrom);

                // Format the date and time
                var formattedDateTime2 = dateObj.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true // Set to false for 24-hour format
                });

                console.log(table.itemDetails);

                var persons = table.transaction.custom_field_4 == null ? 0 : table.transaction.custom_field_4;

                // General details
                htmlContent += '<center style="border: 2px solid black;border-radius: 4px;">DUPLICATE KOT</center>';
                htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Print Date & Time:</span><span>' + formattedDateTime + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Order Date & Time:</span><span>' + formattedDateTime2 + '</span></div>';
                htmlContent += '<div class="myStyle"><span>Persons:</span><span>' + persons + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Invoice:</span><span>' + table.transaction.invoice_no + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Order Type:</span><span>' + table.service_type + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:10px;"><span>Server:</span><span>' + table.waiter + '</span></div>';
                htmlContent += '<div style="display: flex; justify-content: center;font-size:20px;"><span>Table:&nbsp;&nbsp;</span><span>' + table.name + ' </span></div>';

                htmlContent += '<hr class="myhr">';
                var isFirstIteration = true;
                // Item details
                htmlContent += '<div class="container" style="border-top: 2px solid black; border-bottom: 2px solid black;font-size:16px;"><div class="quantity" style="text-align: center;">QTY</div><div class="item">Item</div></div>';
                if (items.length > 0) {
                    items.sort((a, b) => {
                        if (a.brand_id === null) return 1;
                        if (b.brand_id === null) return -1;
                        return a.brand_id - b.brand_id;
                    });


                    var lastDisplayedBrand = null;

                    items.forEach(function (item, index) {
                        // Convert unit_price to a float
                        var unitPrice = parseFloat(item.unit_price);

                        // Calculate the subtotal
                        var subtotal = item.qty * unitPrice;

                        // Determine brand name or default to "Others"
                        var brandName = item.brand_name ? item.brand_name : "Others";

                        // Display brand only if it's different from the last displayed brand
                        if (brandName !== lastDisplayedBrand) {
                            if (lastDisplayedBrand !== null) {
                                htmlContent += '</div>'; // Close the previous brand's product list
                            }
                            htmlContent += '<div class="container" style="border-top: 2px solid black; border-bottom: 2px solid black; margin: 10px 0px 30px 30px; font-size: 14px;">';
                            htmlContent += '<div class="quantity" style="text-align: center; font-size: 22px;"><b><u>' + brandName + '</u></b></div>';
                            htmlContent += '</div>';
                            htmlContent += '<div class="product-list">'; // Start a new product list for the current brand
                            lastDisplayedBrand = brandName; // Update last displayed brand
                        }

                        // Build HTML for the current product
                        htmlContent += '<div class="container" style="font-size: 14px;">';
                        htmlContent += '<div class="quantity" style="text-align: center;">' + item.qty + '</div>';
                        htmlContent += '<div class="item">' + item.name + '</div>';
                        // htmlContent += '<div class="unit-price" style="text-align: center;">' + Math.round(unitPrice) + '</div>';
                        // htmlContent += '<div class="subtotal" style="text-align: center;">' + Math.round(subtotal) + '</div>';
                        htmlContent += '</div>';

                        // Optionally add a note if it exists
                        if (item.note != null && item.note != "") {
                            htmlContent += '<div class="container" style="font-size: 14px;">';
                            htmlContent += '<span><b>Note: </b>' + item.note + '</span>';
                            htmlContent += '</div>';
                        }
                    });

                    // Close the last product list
                    if (lastDisplayedBrand !== null) {
                        htmlContent += '</div>';
                    }
                } else {
                    htmlContent += '<p>No items found</p>';
                }

                if (table.transaction.additional_notes != null && table.transaction.additional_notes != "") {
                    htmlContent += '<hr class="myhr">';
                    htmlContent += '<div class="myStyle"><span>Order Note:</span><span style="style="font-size:14px;">' + table.transaction.additional_notes + '</span></div>';
                }
                htmlContent += '<hr class="myhr">';
                htmlContent += '<div class="myStyle" style="border-top: 2px solid black;font-size:12px;"><span>COUNTER:</span><span>' + table.sales_person.last_name + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:12px;"><span>USER:</span><span>' + table.sales_person.first_name + '</span></div>';

                htmlContent += '</body>';
                htmlContent += '</html>';

                var printWindow = window.open('', '_blank');
                printWindow.document.open();
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();

            });

            printButton2.on('click', function (event) {
                event.stopPropagation(); // Prevent click event from bubbling up to tableInfo
                // Check if the modal already exists and remove it to prevent duplicates
                if ($('#taxModal').length) {
                    $('#taxModal').remove();
                }

                var modalHtml = `
        <div class="modal fade" id="taxModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title" id="exampleModalLabel"><center><b><u>Choose Payment Method</u></b></center></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body text-center">
                <button style="width:49%;" id="cashButton" class="btn btn-success btn-lg"><i class="fas fa-money-bill-wave"></i> Cash</button>
                <button style="width:49%;" id="cardButton" class="btn btn-info btn-lg"><i class="fas fa-credit-card"></i> Card</button>
              </div>
            </div>
          </div>
        </div>
      `;

                $('body').append(modalHtml);

                $('#taxModal').modal('show'); // Show the modal using Bootstrap's modal plugin

                $('#cashButton').one('click', function () {
                    $('#taxModal').modal('hide');
                    printReceipt(0.15, "Cash Tax 15%"); // Apply 8% tax for cash
                });

                $('#cardButton').one('click', function () {
                    $('#taxModal').modal('hide');
                    printReceipt(0.08, "Credit Tax 8%"); // Apply 15% tax for card
                });
            });

            function printReceipt(taxRate, msg = "Tax") {
                var items = table.itemDetails;
                console.log(table);

                var htmlContent = '<!DOCTYPE html>';
                htmlContent += '<html lang="en">';
                htmlContent += '<head>';
                htmlContent += '<meta charset="UTF-8">';
                htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
                htmlContent += '<title>Print KOT</title>';
                htmlContent += '<style>';
                htmlContent += '.myStyle { display: flex; justify-content: space-between; }';
                htmlContent += 'body { font-size:18px;font-family: emoji; }';
                htmlContent += '.myhr { border: 0; height: 3px; background: black; }';
                htmlContent += '.container { display: flex; justify-content: space-between; align-items: center; width: 90%; margin: 0 auto; }';
                htmlContent += '.item { flex: 3; }';
                htmlContent += '.quantity { flex: 1; }';
                htmlContent += '</style>';
                htmlContent += '</head>';
                htmlContent += '<body>';

                var currentDate = new Date(); // Get the current date and time
                var formattedDateTime = currentDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true // Set to false for 24-hour format
                });

                // Parse the string to create a Date object
                var dateObj = new Date(table.isActiveFrom);

                // Format the date and time
                var formattedDateTime2 = dateObj.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true // Set to false for 24-hour format
                });

                var persons = table.transaction.custom_field_4 == null ? 0 : table.transaction.custom_field_4;

                // General details
                htmlContent += '<center style="border: 4px solid black;border-radius: 4px;padding:10px 0px;font-size:22px;"><b>Order Summary - ' + table.name + '</b></center>';
                htmlContent += '<br/>';
                htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Print Date & Time:</span><span>' + formattedDateTime + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Order Date & Time:</span><span>' + formattedDateTime2 + '</span></div>';
                htmlContent += '<div class="myStyle"><span>Persons:</span><span>' + persons + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Invoice:</span><span>' + table.transaction.invoice_no + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Order Type:</span><span>' + table.service_type + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Server:</span><span>' + table.waiter + '</span></div>';
                if (table.transaction.shipping_address != null) {
                    htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Address:</span><span>' + table.transaction.shipping_address + '</span></div>';
                }
                if (table.customer.contact_id != null && table.transaction.shipping_charges) {
                    htmlContent += '<div class="myStyle" style="font-size:15px;"><span>Contact No:</span><span>' + table.customer.contact_id + '</span></div>';
                }

                htmlContent += '<hr class="myhr">';
                // Table headers
                htmlContent += '<table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;border-bottom:2px solid black;">';
                htmlContent += '<thead>';
                htmlContent += '<tr>';
                htmlContent += '<th style="border: 1px solid #000; padding: 5px;">#</th>';
                htmlContent += '<th style="border: 1px solid #000; padding: 5px;">Product</th>';
                htmlContent += '<th style="border: 1px solid #000; padding: 5px;">Qty</th>';
                htmlContent += '<th style="border: 1px solid #000; padding: 5px;">Unit Price</th>';
                htmlContent += '<th style="border: 1px solid #000; padding: 5px;">Subtotal</th>';
                htmlContent += '</tr>';
                htmlContent += '</thead>';
                htmlContent += '<tbody>';

                // Loop through the items and add rows
                var item_details = table.transaction.sell_lines;
                var ttootal = 0;

                if (item_details.length > 0) {
                    // Sort item_details by brand_id
                    item_details.sort((a, b) => {
                        if (a.product.brand_id === null) return 1;
                        if (b.product.brand_id === null) return -1;
                        return a.product.brand_id - b.product.brand_id;
                    });

                    // Iterate through sorted item_details
                    var lastDisplayedBrand = null;

                    // Iterate through sorted item_details
                    item_details.forEach(function (item, index) {
                        // Convert unit_price to a float
                        var unitPrice = parseFloat(item.unit_price);

                        // Calculate the subtotal
                        var subtotal = item.quantity * unitPrice;

                        // Add subtotal to total
                        ttootal += subtotal;

                        // Determine brand name or default to "Others"
                        var brandName = item.product.brand ? item.product.brand.name : "Others";

                        // Display brand only if it's different from the last displayed brand
                        // if (brandName !== lastDisplayedBrand) {
                        //     htmlContent += '<tr>';
                        //     htmlContent += '<td colspan="5" style="padding: 10px; text-align: center; background-color: #f0f0f0;font-size:22px;"><b><u>' + brandName + '</u></b></td>';
                        //     htmlContent += '</tr>';
                        //     lastDisplayedBrand = brandName; // Update last displayed brand
                        // }

                        // Build HTML row for item
                        htmlContent += '<tr>';
                        htmlContent += '<td style="padding: 5px;text-align: center;">' + (index + 1) + '</td>';
                        htmlContent += '<td style="padding: 5px;">' + item.product.name + '</td>';
                        htmlContent += '<td style="padding: 5px;text-align: center;">' + item.quantity + '</td>';
                        htmlContent += '<td style="padding: 5px;text-align: right;">' + Math.round(unitPrice) + '</td>';
                        htmlContent += '<td style="padding: 5px;text-align: right;">' + Math.round(subtotal) + '</td>';
                        htmlContent += '</tr>';
                    });
                }

                htmlContent += '</tbody>';
                htmlContent += '</table>';
                htmlContent += '<br/>';
                var grandTotal = ttootal + (ttootal * taxRate); // Apply the tax rate to the total
                htmlContent += '<div class="myStyle"><span>Sub-Total: </span><span>' + ttootal.toFixed(2) + '</span></div>';
                htmlContent += '<div class="myStyle"><span>' + msg + ': </span><span>' + (ttootal * taxRate).toFixed(2) + '</span></div>';
                if (table.transaction.shipping_charges != null && table.transaction.shipping_charges > 0) {
                    htmlContent += '<div class="myStyle"><span>S.Charges: </span><span>' + parseFloat(table.transaction.shipping_charges).toFixed(2) + '</span></div>';
                }
                if (parseFloat(table.transaction.discount_amount) > 0.0) {
                    var sign = "Rs"
                    var discounted_amount = parseFloat(table.transaction.discount_amount)
                    if (table.transaction.discount_type === "percentage") {
                        sign = "%";
                        discounted_amount = (parseFloat(table.transaction.discount_amount) / 100) * (parseFloat(table.transaction.total_before_tax));
                    }

                    
                    htmlContent += '<div class="myStyle"><span>Discount ' + parseFloat(table.transaction.discount_amount).toFixed(2) + '' + sign + ': </span><span>' + discounted_amount.toFixed(2) + '</span></div>';
                }
                discounted_amount = discounted_amount??0;
            console.log(discounted_amount);
                if (table.transaction.shipping_charges != null) {
                    htmlContent += '<div class="myStyle"><span>Total: </span><span>' + (grandTotal + parseFloat(table.transaction.shipping_charges) - discounted_amount).toFixed(2) + '</span></div>';
                } else {
                    htmlContent += '<div class="myStyle"><span>Total: </span><span>' + (grandTotal.toFixed(2) - discounted_amount) + '</span></div>';
                }

                

                htmlContent += '<hr class="myhr">';
                htmlContent += '<div class="myStyle" style="border-top: 2px solid black;font-size:12px;"><span>COUNTER:</span><span>' + table.sales_person.last_name + '</span></div>';
                htmlContent += '<div class="myStyle" style="font-size:12px;"><span>USER:</span><span>' + table.sales_person.first_name + '</span></div>';

                htmlContent += '</body>';
                htmlContent += '</html>';

                var printWindow = window.open('', '_blank');
                printWindow.document.open();
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
            }

            //myCode end
            tableInfo.on('click', function () {
                // Get URL from data attribute
                // var url = $(this).data('url');
                window.location.href = '/pos/' + table.transactionId + '/edit';
                // if (url) {
                //     // Navigate to specific URL
                //     window.location.href = url;
                // }
            });
        } else if (!table.isActive) {
            tableInfo.on('click', function () {
                let currentURL = window.location.href;
                let parts = currentURL.split('/');
                let lastPart = parts[parts.length - 1];

                console.log(lastPart);
                console.log("current url", currentURL);
                if (lastPart.toLocaleLowerCase()=="edit"&&confirm("Are you sure you want to select this table?")) {
                    $('select[name="res_table_id"]').val(table.id);
                    $('#table_modal').modal('hide');
                    $('#myTable').text(table.name);
                } else if(lastPart.toLocaleLowerCase()=="create") {
                    $('select[name="res_table_id"]').val(table.id);
                    $('#table_modal').modal('hide');
                    $('#myTable').text(table.name);
                    // Optionally handle if the user cancels the action
                }
                else{
                    $('#table_modal').modal('hide');
                }
            });

        }
    });
}

//myCode
// Array to keep track of the keys being pressed
let keys = [];
console.log("ok");

// Event listener for keydown event
document.addEventListener('keydown', function (event) {
    // Add the pressed key to the array
    keys.push(event.key);

    // Check the length of the keys array
    if (keys.length > 3) {
        // Remove the first element if array length is greater than 3
        keys.shift();
    }

    // Check if the keys "a", "s", and "d" are pressed in sequence
    if (keys.join('') === 'asd') {
        // console.log("hmmm");
        // Get the checkbox element
        let checkbox = document.getElementById('zone');
        // Toggle the checkbox state
        checkbox.checked = !checkbox.checked;

        // console.log(window.location.origin);
        // Clear the keys array after toggling
        keys = [];
    }
    else {
        // console.log("opppps");
    }
});


function setTable(tables) {
    if (tables.isActive) {
        window.location.href = `${tables.transactionId}/edit`;
    } else {
        $('select[name="res_table_id"]').val(tables.id);
    }
}

function calculateTimePassed(startTime) {
    // Parse the start time string into a Date object
    var startDate = new Date(startTime);
    var currentDate = new Date();
    var timeDifference = currentDate - startDate;

    var secondsPassed = Math.floor(timeDifference / 1000);
    var minutesPassed = Math.floor(secondsPassed / 60);
    var hoursPassed = Math.floor(minutesPassed / 60);

    // Calculate remaining minutes and seconds
    var remainingMinutes = minutesPassed % 60;
    var remainingSeconds = secondsPassed % 60;

    var formattedHours = hoursPassed < 10 ? '0' + hoursPassed : hoursPassed;
    var formattedMinutes = remainingMinutes < 10 ? '0' + remainingMinutes : remainingMinutes;
    var formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    // Construct the formatted string
    var formattedTimePassed = formattedHours + ":" + formattedMinutes + ":" + formattedSeconds;
    return `${formattedTimePassed}`;
}

//variation_id is null when weighing_scale_barcode is used.
function pos_product_row(variation_id = null, purchase_line_id = null, weighing_scale_barcode = null, quantity = 1) {

    //Get item addition method
    var item_addtn_method = 0;
    var add_via_ajax = true;

    if (variation_id != null && $('#item_addition_method').length) {
        item_addtn_method = $('#item_addition_method').val();
    }

    if (item_addtn_method == 0) {
        add_via_ajax = true;
    } else {
        var is_added = false;

        //Search for variation id in each row of pos table
        $('#pos_table tbody')
            .find('tr')
            .each(function () {
                var row_v_id = $(this)
                    .find('.row_variation_id')
                    .val();
                var enable_sr_no = $(this)
                    .find('.enable_sr_no')
                    .val();
                var modifiers_exist = false;
                if ($(this).find('input.modifiers_exist').length > 0) {
                    modifiers_exist = true;
                }

                if (
                    row_v_id == variation_id &&
                    enable_sr_no !== '1' &&
                    !modifiers_exist &&
                    !is_added
                ) {
                    add_via_ajax = false;
                    is_added = true;

                    //Increment product quantity
                    qty_element = $(this).find('.pos_quantity');
                    var qty = __read_number(qty_element);
                    __write_number(qty_element, qty + 1);
                    qty_element.change();

                    round_row_to_iraqi_dinnar($(this));

                    $('input#search_product')
                        .focus()
                        .select();
                }
            });
    }

    if (add_via_ajax) {
        var product_row = $('input#product_row_count').val();
        var location_id = $('input#location_id').val();
        var customer_id = $('select#customer_id').val();
        var is_direct_sell = false;
        if (
            $('input[name="is_direct_sale"]').length > 0 &&
            $('input[name="is_direct_sale"]').val() == 1
        ) {
            is_direct_sell = true;
        }

        var disable_qty_alert = false;

        if ($('#disable_qty_alert').length) {
            disable_qty_alert = true;
        }

        var is_sales_order = $('#sale_type').length && $('#sale_type').val() == 'sales_order' ? true : false;

        var price_group = '';
        if ($('#price_group').length > 0) {
            price_group = parseInt($('#price_group').val());
        }

        //If default price group present
        if ($('#default_price_group').length > 0 &&
            price_group === '') {
            price_group = $('#default_price_group').val();
        }

        //If types of service selected give more priority
        if ($('#types_of_service_price_group').length > 0 &&
            $('#types_of_service_price_group').val()) {
            price_group = $('#types_of_service_price_group').val();
        }

        var is_draft = false;
        if ($('input#status') && ($('input#status').val() == 'quotation' ||
            $('input#status').val() == 'draft')) {
            is_draft = true;
        }

        $.ajax({
            method: 'GET',
            url: '/sells/pos/get_product_row/' + variation_id + '/' + location_id,
            async: false,
            data: {
                product_row: product_row,
                customer_id: customer_id,
                is_direct_sell: is_direct_sell,
                price_group: price_group,
                purchase_line_id: purchase_line_id,
                weighing_scale_barcode: weighing_scale_barcode,
                quantity: quantity,
                is_sales_order: is_sales_order,
                disable_qty_alert: disable_qty_alert,
                is_draft: is_draft
            },
            dataType: 'json',
            success: function (result) {
                if (result.success) {
                    $('table#pos_table tbody')
                        .append(result.html_content)
                        .find('input.pos_quantity');
                    //increment row count
                    $('input#product_row_count').val(parseInt(product_row) + 1);
                    var this_row = $('table#pos_table tbody')
                        .find('tr')
                        .last();
                    pos_each_row(this_row);

                    //For initial discount if present
                    var line_total = __read_number(this_row.find('input.pos_line_total'));
                    this_row.find('span.pos_line_total_text').text(line_total);

                    pos_total_row();

                    //Check if multipler is present then multiply it when a new row is added.
                    if (__getUnitMultiplier(this_row) > 1) {
                        this_row.find('select.sub_unit').trigger('change');
                    }

                    if (result.enable_sr_no == '1') {
                        var new_row = $('table#pos_table tbody')
                            .find('tr')
                            .last();
                        new_row.find('.row_edit_product_price_model').modal('show');
                    }

                    round_row_to_iraqi_dinnar(this_row);
                    __currency_convert_recursively(this_row);

                    $('input#search_product')
                        .focus()
                        .select();

                    //Used in restaurant module
                    if (result.html_modifier) {
                        $('table#pos_table tbody')
                            .find('tr')
                            .last()
                            .find('td:first')
                            .append(result.html_modifier);
                    }

                    //scroll bottom of items list
                    $(".pos_product_div").animate({ scrollTop: $('.pos_product_div').prop("scrollHeight") }, 1000);
                } else {
                    toastr.error(result.msg);
                    $('input#search_product')
                        .focus()
                        .select();
                }
            },
        });
    }
}

//Update values for each row
function pos_each_row(row_obj) {
    var unit_price = __read_number(row_obj.find('input.pos_unit_price'));

    var discounted_unit_price = calculate_discounted_unit_price(row_obj);
    var tax_rate = row_obj
        .find('select.tax_id')
        .find(':selected')
        .data('rate');

    var unit_price_inc_tax =
        discounted_unit_price + __calculate_amount('percentage', tax_rate, discounted_unit_price);
    __write_number(row_obj.find('input.pos_unit_price_inc_tax'), unit_price_inc_tax);

    var discount = __read_number(row_obj.find('input.row_discount_amount'));

    if (discount > 0) {
        var qty = __read_number(row_obj.find('input.pos_quantity'));
        var line_total = qty * unit_price_inc_tax;
        __write_number(row_obj.find('input.pos_line_total'), line_total);
    }

    //var unit_price_inc_tax = __read_number(row_obj.find('input.pos_unit_price_inc_tax'));

    __write_number(row_obj.find('input.item_tax'), unit_price_inc_tax - discounted_unit_price);
}

function pos_total_row() {
    var total_quantity = 0;
    var price_total = get_subtotal();
    $('table#pos_table tbody tr').each(function () {
        total_quantity = total_quantity + __read_number($(this).find('input.pos_quantity'));
    });

    //updating shipping charges
    $('span#shipping_charges_amount').text(
        __currency_trans_from_en(__read_number($('input#shipping_charges_modal')), false)
    );

    $('span.total_quantity').each(function () {
        $(this).html(__number_f(total_quantity));
    });

    //$('span.unit_price_total').html(unit_price_total);
    $('span.price_total').html(__currency_trans_from_en(price_total, false));
    calculate_billing_details(price_total);
}

function get_subtotal() {
    var price_total = 0;

    $('table#pos_table tbody tr').each(function () {
        price_total = price_total + __read_number($(this).find('input.pos_line_total'));
    });

    //Go through the modifier prices.
    $('input.modifiers_price').each(function () {
        var modifier_price = __read_number($(this));
        var modifier_quantity = $(this).closest('.product_modifier').find('.modifiers_quantity').val();
        var modifier_subtotal = modifier_price * modifier_quantity;
        price_total = price_total + modifier_subtotal;
    });

    return price_total;
}

function calculate_billing_details(price_total) {
    var discount = pos_discount(price_total);
    if ($('#reward_point_enabled').length) {
        total_customer_reward = $('#rp_redeemed_amount').val();
        discount = parseFloat(discount) + parseFloat(total_customer_reward);

        if ($('input[name="is_direct_sale"]').length <= 0) {
            $('span#total_discount').text(__currency_trans_from_en(discount, false));
        }
    }

    var order_tax = pos_order_tax(price_total, discount);

    //Add shipping charges.
    var shipping_charges = __read_number($('input#shipping_charges'));

    var additional_expense = 0;
    //calculate additional expenses
    if ($('input#additional_expense_value_1').length > 0) {
        additional_expense += __read_number($('input#additional_expense_value_1'));
    }
    if ($('input#additional_expense_value_2').length > 0) {
        additional_expense += __read_number($('input#additional_expense_value_2'))
    }
    if ($('input#additional_expense_value_3').length > 0) {
        additional_expense += __read_number($('input#additional_expense_value_3'))
    }
    if ($('input#additional_expense_value_4').length > 0) {
        additional_expense += __read_number($('input#additional_expense_value_4'))
    }

    //Add packaging charge
    var packing_charge = 0;
    if ($('#types_of_service_id').length > 0 &&
        $('#types_of_service_id').val()) {
        packing_charge = __calculate_amount($('#packing_charge_type').val(),
            __read_number($('input#packing_charge')), price_total);

        $('#packing_charge_text').text(__currency_trans_from_en(packing_charge, false));
    }

    var total_payable = price_total + order_tax - discount + shipping_charges + packing_charge + additional_expense;

    var rounding_multiple = $('#amount_rounding_method').val() ? parseFloat($('#amount_rounding_method').val()) : 0;
    var round_off_data = __round(total_payable, rounding_multiple);
    var total_payable_rounded = round_off_data.number;

    var round_off_amount = round_off_data.diff;
    if (round_off_amount != 0) {
        $('span#round_off_text').text(__currency_trans_from_en(round_off_amount, false));
    } else {
        $('span#round_off_text').text(0);
    }
    $('input#round_off_amount').val(round_off_amount);

    __write_number($('input#final_total_input'), total_payable_rounded);
    var curr_exchange_rate = 1;
    if ($('#exchange_rate').length > 0 && $('#exchange_rate').val()) {
        curr_exchange_rate = __read_number($('#exchange_rate'));
    }
    var shown_total = total_payable_rounded * curr_exchange_rate;
    $('span#total_payable').text(__currency_trans_from_en(shown_total, false));

    $('span.total_payable_span').text(__currency_trans_from_en(total_payable_rounded, true));

    //Check if edit form then don't update price.
    if ($('form#edit_pos_sell_form').length == 0 && $('form#edit_sell_form').length == 0) {
        __write_number($('.payment-amount').first(), total_payable_rounded);
    }

    $(document).trigger('invoice_total_calculated');

    calculate_balance_due();
}

function pos_discount(total_amount) {
    var calculation_type = $('#discount_type').val();
    var calculation_amount = __read_number($('#discount_amount'));

    var discount = __calculate_amount(calculation_type, calculation_amount, total_amount);

    $('span#total_discount').text(__currency_trans_from_en(discount, false));

    return discount;
}

function pos_order_tax(price_total, discount) {
    var tax_rate_id = $('#tax_rate_id').val();
    var calculation_type = 'percentage';
    var calculation_amount = __read_number($('#tax_calculation_amount'));
    var total_amount = price_total;

    if (tax_rate_id) {
        var order_tax = __calculate_amount(calculation_type, calculation_amount, total_amount);
    } else {
        var order_tax = 0;
    }

    $('span#order_tax').text(__currency_trans_from_en(order_tax, false));

    return order_tax;
}

function calculate_balance_due() {
    var total_payable = __read_number($('#final_total_input'));
    var total_paying = 0;
    $('#payment_rows_div')
        .find('.payment-amount')
        .each(function () {
            if (parseFloat($(this).val())) {
                total_paying += __read_number($(this));
            }
        });
    var bal_due = total_payable - total_paying;
    var change_return = 0;

    //change_return
    if (bal_due < 0 || Math.abs(bal_due) < 0.05) {
        __write_number($('input#change_return'), bal_due * -1);
        $('span.change_return_span').text(__currency_trans_from_en(bal_due * -1, true));
        change_return = bal_due * -1;
        bal_due = 0;
    } else {
        __write_number($('input#change_return'), 0);
        $('span.change_return_span').text(__currency_trans_from_en(0, true));
        change_return = 0;

    }

    if (change_return !== 0) {
        $('#change_return_payment_data').removeClass('hide');
    } else {
        $('#change_return_payment_data').addClass('hide');
    }

    __write_number($('input#total_paying_input'), total_paying);
    $('span.total_paying').text(__currency_trans_from_en(total_paying, true));

    __write_number($('input#in_balance_due'), bal_due);
    $('span.balance_due').text(__currency_trans_from_en(bal_due, true));

    __highlight(bal_due * -1, $('span.balance_due'));
    __highlight(change_return * -1, $('span.change_return_span'));
}

function isValidPosForm() {
    flag = true;
    $('span.error').remove();

    if ($('select#customer_id').val() == null) {
        flag = false;
        error = '<span class="error">' + LANG.required + '</span>';
        $(error).insertAfter($('select#customer_id').parent('div'));
    }

    if ($('tr.product_row').length == 0) {
        flag = false;
        error = '<span class="error">' + LANG.no_products + '</span>';
        $(error).insertAfter($('input#search_product').parent('div'));
    }

    return flag;
}

function reset_pos_form() {

    //If on edit page then redirect to Add POS page
    if ($('form#edit_pos_sell_form').length > 0) {
        setTimeout(function () {
            window.location = $("input#pos_redirect_url").val();
        }, 4000);
        return true;
    }

    //reset all repair defects tags
    if ($("#repair_defects").length > 0) {
        tagify_repair_defects.removeAllTags();
    }

    if (pos_form_obj[0]) {
        pos_form_obj[0].reset();
    }
    if (sell_form[0]) {
        sell_form[0].reset();
    }
    set_default_customer();
    set_location();

    $('tr.product_row').remove();
    $('span.total_quantity, span.price_total, span#total_discount, span#order_tax, span#total_payable, span#shipping_charges_amount').text(0);
    $('span.total_payable_span', 'span.total_paying', 'span.balance_due').text(0);

    $('#modal_payment').find('.remove_payment_row').each(function () {
        $(this).closest('.payment_row').remove();
    });

    if ($('#is_credit_sale').length) {
        $('#is_credit_sale').val(0);
    }

    //Reset discount
    __write_number($('input#discount_amount'), $('input#discount_amount').data('default'));
    $('input#discount_type').val($('input#discount_type').data('default'));

    //Reset tax rate
    $('input#tax_rate_id').val($('input#tax_rate_id').data('default'));
    __write_number($('input#tax_calculation_amount'), $('input#tax_calculation_amount').data('default'));

    $('select.payment_types_dropdown').val('cash').trigger('change');
    $('#price_group').trigger('change');

    //Reset shipping
    __write_number($('input#shipping_charges'), $('input#shipping_charges').data('default'));
    $('input#shipping_details').val($('input#shipping_details').data('default'));
    $('input#shipping_address, input#shipping_status, input#delivered_to').val('');
    if ($('input#is_recurring').length > 0) {
        $('input#is_recurring').iCheck('update');
    };
    if ($('input#is_kitchen_order').length > 0) {
        $('input#is_kitchen_order').iCheck('update');
    };
    if ($('#invoice_layout_id').length > 0) {
        $('#invoice_layout_id').trigger('change');
    };
    $('span#round_off_text').text(0);

    //repair module extra  fields reset
    if ($('#repair_device_id').length > 0) {
        $('#repair_device_id').val('').trigger('change');
    }

    //Status is hidden in sales order
    if ($('#status').length > 0 && $('#status').is(":visible")) {
        $('#status').val('').trigger('change');
    }
    if ($('#transaction_date').length > 0) {
        $('#transaction_date').data("DateTimePicker").date(moment());
    }
    if ($('.paid_on').length > 0) {
        $('.paid_on').data("DateTimePicker").date(moment());
    }
    if ($('#commission_agent').length > 0) {
        $('#commission_agent').val('').trigger('change');
    }

    //reset contact due
    $('.contact_due_text').find('span').text('');
    $('.contact_due_text').addClass('hide');

    $(document).trigger('sell_form_reset');
}

function set_default_customer() {
    var default_customer_id = $('#default_customer_id').val();
    var default_customer_name = $('#default_customer_name').val();
    var default_customer_balance = $('#default_customer_balance').val();
    var default_customer_address = $('#default_customer_address').val();
    var exists = default_customer_id ? $('select#customer_id option[value=' + default_customer_id + ']').length : 0;
    if (exists == 0 && default_customer_id) {
        $('select#customer_id').append(
            $('<option>', { value: default_customer_id, text: default_customer_name })
        );
    }
    $('#advance_balance_text').text(__currency_trans_from_en(default_customer_balance), true);
    $('#advance_balance').val(default_customer_balance);
    $('#shipping_address_modal').val(default_customer_address);
    if (default_customer_address) {
        $('#shipping_address').val(default_customer_address);
    }
    $('select#customer_id')
        .val(default_customer_id)
        .trigger('change');

    if ($('#default_selling_price_group').length) {
        $('#price_group').val($('#default_selling_price_group').val());
        $('#price_group').change();
    }

    //initialize tags input (tagify)
    if ($("textarea#repair_defects").length > 0 && !customer_set) {
        let suggestions = [];
        if ($("input#pos_repair_defects_suggestion").length > 0 && $("input#pos_repair_defects_suggestion").val().length > 2) {
            suggestions = JSON.parse($("input#pos_repair_defects_suggestion").val());
        }
        let repair_defects = document.querySelector('textarea#repair_defects');
        tagify_repair_defects = new Tagify(repair_defects, {
            whitelist: suggestions,
            maxTags: 100,
            dropdown: {
                maxItems: 100,           // <- mixumum allowed rendered suggestions
                classname: "tags-look", // <- custom classname for this dropdown, so it could be targeted
                enabled: 0,             // <- show suggestions on focus
                closeOnSelect: false    // <- do not hide the suggestions dropdown once an item has been selected
            }
        });
    }

    customer_set = true;
}

//Set the location and initialize printer
function set_location() {
    if ($('select#select_location_id').length == 1) {
        $('input#location_id').val($('select#select_location_id').val());
        $('input#location_id').data(
            'receipt_printer_type',
            $('select#select_location_id')
                .find(':selected')
                .data('receipt_printer_type')
        );
        $('input#location_id').data(
            'default_payment_accounts',
            $('select#select_location_id')
                .find(':selected')
                .data('default_payment_accounts')
        );

        $('input#location_id').attr(
            'data-default_price_group',
            $('select#select_location_id')
                .find(':selected')
                .data('default_price_group')
        );
    }

    if ($('input#location_id').val()) {
        $('input#search_product')
            .prop('disabled', false)
            .focus();
    } else {
        $('input#search_product').prop('disabled', true);
    }

    initialize_printer();
}

function initialize_printer() {
    if ($('input#location_id').data('receipt_printer_type') == 'printer') {
        initializeSocket();
    }
}

$('body').on('click', 'label', function (e) {
    var field_id = $(this).attr('for');
    if (field_id) {
        if ($('#' + field_id).hasClass('select2')) {
            $('#' + field_id).select2('open');
            return false;
        }
    }
});

$('body').on('focus', 'select', function (e) {
    var field_id = $(this).attr('id');
    if (field_id) {
        if ($('#' + field_id).hasClass('select2')) {
            $('#' + field_id).select2('open');
            return false;
        }
    }
});

function round_row_to_iraqi_dinnar(row) {
    if (iraqi_selling_price_adjustment) {
        var element = row.find('input.pos_unit_price_inc_tax');
        var unit_price = round_to_iraqi_dinnar(__read_number(element));
        __write_number(element, unit_price);
        element.change();
    }
}

function pos_print(receipt) {
    //If printer type then connect with websocket
    if (receipt.print_type == 'printer') {
        var content = receipt;
        content.type = 'print-receipt';

        //Check if ready or not, then print.
        if (socket != null && socket.readyState == 1) {
            socket.send(JSON.stringify(content));
        } else {
            initializeSocket();
            setTimeout(function () {
                socket.send(JSON.stringify(content));
            }, 700);
        }

    } else if (receipt.html_content != '') {
        var title = document.title;
        if (typeof receipt.print_title != 'undefined') {
            document.title = receipt.print_title;
        }

        //If printer type browser then print content
        $('#receipt_section').html(receipt.html_content);
        __currency_convert_recursively($('#receipt_section'));
        __print_receipt('receipt_section');

        setTimeout(function () {
            document.title = title;
        }, 1200);
    }
}

function calculate_discounted_unit_price(row) {
    var this_unit_price = __read_number(row.find('input.pos_unit_price'));
    var row_discounted_unit_price = this_unit_price;
    var row_discount_type = row.find('select.row_discount_type').val();
    var row_discount_amount = __read_number(row.find('input.row_discount_amount'));
    if (row_discount_amount) {
        if (row_discount_type == 'fixed') {
            row_discounted_unit_price = this_unit_price - row_discount_amount;
        } else {
            row_discounted_unit_price = __substract_percent(this_unit_price, row_discount_amount);
        }
    }

    return row_discounted_unit_price;
}

function get_unit_price_from_discounted_unit_price(row, discounted_unit_price) {
    var this_unit_price = discounted_unit_price;
    var row_discount_type = row.find('select.row_discount_type').val();
    var row_discount_amount = __read_number(row.find('input.row_discount_amount'));
    if (row_discount_amount) {
        if (row_discount_type == 'fixed') {
            this_unit_price = discounted_unit_price + row_discount_amount;
        } else {
            this_unit_price = __get_principle(discounted_unit_price, row_discount_amount, true);
        }
    }

    return this_unit_price;
}

//Update quantity if line subtotal changes
$('table#pos_table tbody').on('change', 'input.pos_line_total', function () {
    var subtotal = __read_number($(this));
    var tr = $(this).parents('tr');
    var quantity_element = tr.find('input.pos_quantity');
    var unit_price_inc_tax = __read_number(tr.find('input.pos_unit_price_inc_tax'));
    var quantity = subtotal / unit_price_inc_tax;
    __write_number(quantity_element, quantity);

    if (sell_form_validator) {
        sell_form_validator.element(quantity_element);
    }
    if (pos_form_validator) {
        pos_form_validator.element(quantity_element);
    }
    tr.find('span.pos_line_total_text').text(__currency_trans_from_en(subtotal, true));

    pos_total_row();
});

$('div#product_list_body').on('scroll', function () {
    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
        var page = parseInt($('#suggestion_page').val());
        page += 1;
        $('#suggestion_page').val(page);
        var location_id = $('input#location_id').val();
        var category_id = $('select#product_category').val();
        var brand_id = $('select#product_brand').val();

        var is_enabled_stock = null;
        if ($("#is_enabled_stock").length) {
            is_enabled_stock = $("#is_enabled_stock").val();
        }

        var device_model_id = null;
        if ($("#repair_model_id").length) {
            device_model_id = $("#repair_model_id").val();
        }

        get_product_suggestion_list(category_id, brand_id, location_id, null, is_enabled_stock, device_model_id);
    }
});

$(document).on('ifChecked', '#is_recurring', function () {
    $('#recurringInvoiceModal').modal('show');
});

$(document).on('shown.bs.modal', '#recurringInvoiceModal', function () {
    $('input#recur_interval').focus();
});

$(document).on('click', '#select_all_service_staff', function () {
    var val = $('#res_waiter_id').val();
    $('#pos_table tbody')
        .find('select.order_line_service_staff')
        .each(function () {
            $(this)
                .val(val)
                .change();
        });
});

$(document).on('click', '.print-invoice-link', function (e) {
    e.preventDefault();
    $.ajax({
        url: $(this).attr('href') + "?check_location=true",
        dataType: 'json',
        success: function (result) {
            if (result.success == 1) {
                //Check if enabled or not
                if (result.receipt.is_enabled) {
                    pos_print(result.receipt);
                }
            } else {
                toastr.error(result.msg);
            }

        },
    });
});

function getCustomerRewardPoints() {
    if ($('#reward_point_enabled').length <= 0) {
        return false;
    }
    var is_edit = $('form#edit_sell_form').length ||
        $('form#edit_pos_sell_form').length ? true : false;
    if (is_edit && !customer_set) {
        return false;
    }

    var customer_id = $('#customer_id').val();

    $.ajax({
        method: 'POST',
        url: '/sells/pos/get-reward-details',
        data: {
            customer_id: customer_id
        },
        dataType: 'json',
        success: function (result) {
            $('#available_rp').text(result.points);
            $('#rp_redeemed_modal').data('max_points', result.points);
            updateRedeemedAmount();
            $('#rp_redeemed_amount').change()
        },
    });
}

function updateRedeemedAmount(argument) {
    var points = $('#rp_redeemed_modal').val().trim();
    points = points == '' ? 0 : parseInt(points);
    var amount_per_unit_point = parseFloat($('#rp_redeemed_modal').data('amount_per_unit_point'));
    var redeemed_amount = points * amount_per_unit_point;
    $('#rp_redeemed_amount_text').text(__currency_trans_from_en(redeemed_amount, true));
    $('#rp_redeemed').val(points);
    $('#rp_redeemed_amount').val(redeemed_amount);
}

$(document).on('change', 'select#customer_id', function () {
    var default_customer_id = $('#default_customer_id').val();
    if ($(this).val() == default_customer_id) {
        //Disable reward points for walkin customers
        if ($('#rp_redeemed_modal').length) {
            $('#rp_redeemed_modal').val('');
            $('#rp_redeemed_modal').change();
            $('#rp_redeemed_modal').attr('disabled', true);
            $('#available_rp').text('');
            updateRedeemedAmount();
            pos_total_row();
        }
    } else {
        if ($('#rp_redeemed_modal').length) {
            $('#rp_redeemed_modal').removeAttr('disabled');
        }
        getCustomerRewardPoints();
    }

    get_sales_orders();
});

$(document).on('change', '#rp_redeemed_modal', function () {
    var points = $(this).val().trim();
    points = points == '' ? 0 : parseInt(points);
    var amount_per_unit_point = parseFloat($(this).data('amount_per_unit_point'));
    var redeemed_amount = points * amount_per_unit_point;
    $('#rp_redeemed_amount_text').text(__currency_trans_from_en(redeemed_amount, true));
    var reward_validation = isValidatRewardPoint();
    if (!reward_validation['is_valid']) {
        toastr.error(reward_validation['msg']);
        $('#rp_redeemed_modal').select();
    }
});

$(document).on('change', '.direct_sell_rp_input', function () {
    updateRedeemedAmount();
    pos_total_row();
});

function isValidatRewardPoint() {
    var element = $('#rp_redeemed_modal');
    var points = element.val().trim();
    points = points == '' ? 0 : parseInt(points);

    var max_points = parseInt(element.data('max_points'));
    var is_valid = true;
    var msg = '';

    if (points == 0) {
        return {
            is_valid: is_valid,
            msg: msg
        }
    }

    var rp_name = $('input#rp_name').val();
    if (points > max_points) {
        is_valid = false;
        msg = __translate('max_rp_reached_error', { max_points: max_points, rp_name: rp_name });
    }

    var min_order_total_required = parseFloat(element.data('min_order_total'));

    var order_total = __read_number($('#final_total_input'));

    if (order_total < min_order_total_required) {
        is_valid = false;
        msg = __translate('min_order_total_error', { min_order: __currency_trans_from_en(min_order_total_required, true), rp_name: rp_name });
    }

    var output = {
        is_valid: is_valid,
        msg: msg,
    }

    return output;
}

function adjustComboQty(tr) {
    if (tr.find('input.product_type').val() == 'combo') {
        var qty = __read_number(tr.find('input.pos_quantity'));
        var multiplier = __getUnitMultiplier(tr);

        tr.find('input.combo_product_qty').each(function () {
            $(this).val($(this).data('unit_quantity') * qty * multiplier);
        });
    }
}

$(document).on('change', '#types_of_service_id', function () {
    var types_of_service_id = $(this).val();
    var location_id = $('#location_id').val();

    if (types_of_service_id) {
        $.ajax({
            method: 'POST',
            url: '/sells/pos/get-types-of-service-details',
            data: {
                types_of_service_id: types_of_service_id,
                location_id: location_id
            },
            dataType: 'json',
            success: function (result) {
                //reset form if price group is changed
                var prev_price_group = $('#types_of_service_price_group').val();
                if (result.price_group_id) {
                    $('#types_of_service_price_group').val(result.price_group_id);
                    $('#price_group_text').removeClass('hide');
                    $('#price_group_text span').text(result.price_group_name);
                } else {
                    $('#types_of_service_price_group').val('');
                    $('#price_group_text').addClass('hide');
                    $('#price_group_text span').text('');
                }
                $('#types_of_service_id').val(types_of_service_id);
                $('.types_of_service_modal').html(result.modal_html);

                if (prev_price_group != result.price_group_id) {
                    if ($('form#edit_pos_sell_form').length > 0) {
                        $('table#pos_table tbody').html('');
                        pos_total_row();
                    } else {
                        reset_pos_form();
                    }
                } else {
                    pos_total_row();
                }

                $('.types_of_service_modal').modal('show');
            },
        });
    } else {
        $('.types_of_service_modal').html('');
        $('#types_of_service_price_group').val('');
        $('#price_group_text').addClass('hide');
        $('#price_group_text span').text('');
        $('#packing_charge_text').text('');
        if ($('form#edit_pos_sell_form').length > 0) {
            $('table#pos_table tbody').html('');
            pos_total_row();
        } else {
            reset_pos_form();
        }
    }
});

$(document).on('change', 'input#packing_charge, #additional_expense_value_1, #additional_expense_value_2, \
        #additional_expense_value_3, #additional_expense_value_4', function () {
    pos_total_row();
});

$(document).on('click', '.service_modal_btn', function (e) {
    if ($('#types_of_service_id').val()) {
        $('.types_of_service_modal').modal('show');
    }
});

$(document).on('change', '.payment_types_dropdown', function (e) {
    var default_accounts = $('select#select_location_id').length ?
        $('select#select_location_id')
            .find(':selected')
            .data('default_payment_accounts') : $('#location_id').data('default_payment_accounts');
    var payment_type = $(this).val();
    var payment_row = $(this).closest('.payment_row');
    if (payment_type && payment_type != 'advance') {
        var default_account = default_accounts && default_accounts[payment_type]['account'] ?
            default_accounts[payment_type]['account'] : '';
        var row_index = payment_row.find('.payment_row_index').val();

        var account_dropdown = payment_row.find('select#account_' + row_index);
        if (account_dropdown.length && default_accounts) {
            account_dropdown.val(default_account);
            account_dropdown.change();
        }
    }

    //Validate max amount and disable account if advance 
    amount_element = payment_row.find('.payment-amount');
    account_dropdown = payment_row.find('.account-dropdown');
    if (payment_type == 'advance') {
        max_value = $('#advance_balance').val();
        msg = $('#advance_balance').data('error-msg');
        amount_element.rules('add', {
            'max-value': max_value,
            messages: {
                'max-value': msg,
            },
        });
        if (account_dropdown) {
            account_dropdown.prop('disabled', true);
            account_dropdown.closest('.form-group').addClass('hide');
        }
    } else {
        amount_element.rules("remove", "max-value");
        if (account_dropdown) {
            account_dropdown.prop('disabled', false);
            account_dropdown.closest('.form-group').removeClass('hide');
        }
    }
});
$(document).on('show.bs.modal', '#table_modal', function () {
    var location_id = $('input#location_id').val();
    get_tables(location_id, $('div#table_active'));
});

$(document).on('show.bs.modal', '#staff_modal', function () {
    var location_id = $('input#location_id').val();
    get_staff(location_id, $('div#staff_active'));
});

$(document).on('show.bs.modal', '#recent_transactions_modal', function () {
    get_recent_transactions('final', $('div#tab_final'));
});
$(document).on('shown.bs.tab', 'a[href="#tab_quotation"]', function () {
    get_recent_transactions('quotation', $('div#tab_quotation'));
});
$(document).on('shown.bs.tab', 'a[href="#tab_draft"]', function () {
    get_recent_transactions('draft', $('div#tab_draft'));
});

function disable_pos_form_actions() {
    if (!window.navigator.onLine) {
        return false;
    }

    $('div.pos-processing').show();
    $('#pos-save').attr('disabled', 'true');
    $('div.pos-form-actions').find('button').attr('disabled', 'true');
}

function enable_pos_form_actions() {
    $('div.pos-processing').hide();
    $('#pos-save').removeAttr('disabled');
    $('div.pos-form-actions').find('button').removeAttr('disabled');
}

$(document).on('change', '#recur_interval_type', function () {
    if ($(this).val() == 'months') {
        $('.subscription_repeat_on_div').removeClass('hide');
    } else {
        $('.subscription_repeat_on_div').addClass('hide');
    }
});

function validate_discount_field() {
    discount_element = $('#discount_amount_modal');
    discount_type_element = $('#discount_type_modal');

    if ($('#add_sell_form').length || $('#edit_sell_form').length) {
        discount_element = $('#discount_amount');
        discount_type_element = $('#discount_type');
    }
    var max_value = parseFloat(discount_element.data('max-discount'));
    if (discount_element.val() != '' && !isNaN(max_value)) {
        if (discount_type_element.val() == 'fixed') {
            var subtotal = get_subtotal();
            //get max discount amount
            max_value = __calculate_amount('percentage', max_value, subtotal)
        }

        discount_element.rules('add', {
            'max-value': max_value,
            messages: {
                'max-value': discount_element.data('max-discount-error_msg'),
            },
        });
    } else {
        discount_element.rules("remove", "max-value");
    }
    discount_element.trigger('change');
}

$(document).on('change', '#discount_type_modal, #discount_type', function () {
    validate_discount_field();
});

function update_shipping_address(data) {
    if ($('#shipping_address_div').length) {
        var shipping_address = '';
        if (data.supplier_business_name) {
            shipping_address += data.supplier_business_name;
        }
        if (data.name) {
            shipping_address += ',<br>' + data.name;
        }
        if (data.text) {
            shipping_address += ',<br>' + data.text;
        }
        shipping_address += ',<br>' + data.shipping_address;
        $('#shipping_address_div').html(shipping_address);
    }
    if ($('#billing_address_div').length) {
        var address = [];
        if (data.supplier_business_name) {
            address.push(data.supplier_business_name);
        }
        if (data.name) {
            address.push('<br>' + data.name);
        }
        if (data.text) {
            address.push('<br>' + data.text);
        }
        if (data.address_line_1) {
            address.push('<br>' + data.address_line_1);
        }
        if (data.address_line_2) {
            address.push('<br>' + data.address_line_2);
        }
        if (data.city) {
            address.push('<br>' + data.city);
        }
        if (data.state) {
            address.push(data.state);
        }
        if (data.country) {
            address.push(data.country);
        }
        if (data.zip_code) {
            address.push('<br>' + data.zip_code);
        }
        var billing_address = address.join(', ');
        $('#billing_address_div').html(billing_address);
    }

    if ($('#shipping_custom_field_1').length) {
        let shipping_custom_field_1 = data.shipping_custom_field_details != null ? data.shipping_custom_field_details.shipping_custom_field_1 : '';
        $('#shipping_custom_field_1').val(shipping_custom_field_1);
    }

    if ($('#shipping_custom_field_2').length) {
        let shipping_custom_field_2 = data.shipping_custom_field_details != null ? data.shipping_custom_field_details.shipping_custom_field_2 : '';
        $('#shipping_custom_field_2').val(shipping_custom_field_2);
    }

    if ($('#shipping_custom_field_3').length) {
        let shipping_custom_field_3 = data.shipping_custom_field_details != null ? data.shipping_custom_field_details.shipping_custom_field_3 : '';
        $('#shipping_custom_field_3').val(shipping_custom_field_3);
    }

    if ($('#shipping_custom_field_4').length) {
        let shipping_custom_field_4 = data.shipping_custom_field_details != null ? data.shipping_custom_field_details.shipping_custom_field_4 : '';
        $('#shipping_custom_field_4').val(shipping_custom_field_4);
    }

    if ($('#shipping_custom_field_5').length) {
        let shipping_custom_field_5 = data.shipping_custom_field_details != null ? data.shipping_custom_field_details.shipping_custom_field_5 : '';
        $('#shipping_custom_field_5').val(shipping_custom_field_5);
    }

    //update export fields
    if (data.is_export) {
        $('#is_export').prop('checked', true);
        $('div.export_div').show();
        if ($('#export_custom_field_1').length) {
            $('#export_custom_field_1').val(data.export_custom_field_1);
        }
        if ($('#export_custom_field_2').length) {
            $('#export_custom_field_2').val(data.export_custom_field_2);
        }
        if ($('#export_custom_field_3').length) {
            $('#export_custom_field_3').val(data.export_custom_field_3);
        }
        if ($('#export_custom_field_4').length) {
            $('#export_custom_field_4').val(data.export_custom_field_4);
        }
        if ($('#export_custom_field_5').length) {
            $('#export_custom_field_5').val(data.export_custom_field_5);
        }
        if ($('#export_custom_field_6').length) {
            $('#export_custom_field_6').val(data.export_custom_field_6);
        }
    } else {
        $('#export_custom_field_1, #export_custom_field_2, #export_custom_field_3, #export_custom_field_4, #export_custom_field_5, #export_custom_field_6').val('');
        $('#is_export').prop('checked', false);
        $('div.export_div').hide();
    }

    $('#shipping_address_modal').val(data.shipping_address);
    $('#shipping_address').val(data.shipping_address);
}

function get_sales_orders() {
    if ($('#sales_order_ids').length) {
        if ($('#sales_order_ids').hasClass('not_loaded')) {
            $('#sales_order_ids').removeClass('not_loaded');
            return false;
        }
        var customer_id = $('select#customer_id').val();
        var location_id = $('input#location_id').val();
        $.ajax({
            url: '/get-sales-orders/' + customer_id + '?location_id=' + location_id,
            dataType: 'json',
            success: function (data) {
                $('#sales_order_ids').select2('destroy').empty().select2({ data: data });
                $('table#pos_table tbody').find('tr').each(function () {
                    if (typeof ($(this).data('so_id')) !== 'undefined') {
                        $(this).remove();
                    }
                });
                pos_total_row();
            },
        });
    }
}

$("#sales_order_ids").on("select2:select", function (e) {
    var sales_order_id = e.params.data.id;
    var product_row = $('input#product_row_count').val();
    var location_id = $('input#location_id').val();
    $.ajax({
        method: 'GET',
        url: '/get-sales-order-lines',
        async: false,
        data: {
            product_row: product_row,
            sales_order_id: sales_order_id
        },
        dataType: 'json',
        success: function (result) {
            if (result.html) {
                var html = result.html;
                $(html).find('tr').each(function () {
                    $('table#pos_table tbody')
                        .append($(this))
                        .find('input.pos_quantity');

                    var this_row = $('table#pos_table tbody')
                        .find('tr')
                        .last();
                    pos_each_row(this_row);

                    product_row = parseInt(product_row) + 1;

                    //For initial discount if present
                    var line_total = __read_number(this_row.find('input.pos_line_total'));
                    this_row.find('span.pos_line_total_text').text(line_total);

                    //Check if multipler is present then multiply it when a new row is added.
                    if (__getUnitMultiplier(this_row) > 1) {
                        this_row.find('select.sub_unit').trigger('change');
                    }

                    round_row_to_iraqi_dinnar(this_row);
                    __currency_convert_recursively(this_row);
                });

                set_so_values(result.sales_order);

                //increment row count
                $('input#product_row_count').val(product_row);

                pos_total_row();

            } else {
                toastr.error(result.msg);
                $('input#search_product')
                    .focus()
                    .select();
            }
        },
    });
});

function set_so_values(so) {
    $('textarea[name="sale_note"]').val(so.additional_notes);
    if ($('#shipping_details').is(':visible')) {
        $('#shipping_details').val(so.shipping_details);
    }
    $('#shipping_address').val(so.shipping_address);
    $('#delivered_to').val(so.delivered_to);
    $('#shipping_charges').val(__number_f(so.shipping_charges));
    $('#shipping_status').val(so.shipping_status);
    if ($('#shipping_custom_field_1').length) {
        $('#shipping_custom_field_1').val(so.shipping_custom_field_1);
    }
    if ($('#shipping_custom_field_2').length) {
        $('#shipping_custom_field_2').val(so.shipping_custom_field_2);
    }
    if ($('#shipping_custom_field_3').length) {
        $('#shipping_custom_field_3').val(so.shipping_custom_field_3);
    }
    if ($('#shipping_custom_field_4').length) {
        $('#shipping_custom_field_4').val(so.shipping_custom_field_4);
    }
    if ($('#shipping_custom_field_5').length) {
        $('#shipping_custom_field_5').val(so.shipping_custom_field_5);
    }
}

$("#sales_order_ids").on("select2:unselect", function (e) {
    var sales_order_id = e.params.data.id;
    $('table#pos_table tbody').find('tr').each(function () {
        if (typeof ($(this).data('so_id')) !== 'undefined'
            && $(this).data('so_id') == sales_order_id) {
            $(this).remove();
            pos_total_row();
        }
    });
});

$(document).on('click', '#add_expense', function () {
    $.ajax({
        url: '/expenses/create',
        data: {
            location_id: $('#select_location_id').val()
        },
        dataType: 'html',
        success: function (result) {
            $('#expense_modal').html(result);
            $('#expense_modal').modal('show');
        },
    });
});

$(document).on('shown.bs.modal', '#expense_modal', function () {
    $('#expense_transaction_date').datetimepicker({
        format: moment_date_format + ' ' + moment_time_format,
        ignoreReadonly: true,
    });
    $('#expense_modal .paid_on').datetimepicker({
        format: moment_date_format + ' ' + moment_time_format,
        ignoreReadonly: true,
    });
    $(this).find('.select2').select2();
    $('#add_expense_modal_form').validate();
});

$(document).on('hidden.bs.modal', '#expense_modal', function () {
    $(this).html('');
});

$(document).on('submit', 'form#add_expense_modal_form', function (e) {
    e.preventDefault();
    var data = $(this).serialize();

    $.ajax({
        method: 'POST',
        url: $(this).attr('action'),
        dataType: 'json',
        data: data,
        success: function (result) {
            if (result.success == true) {
                $('#expense_modal').modal('hide');
                toastr.success(result.msg);
            } else {
                toastr.error(result.msg);
            }
        },
    });
});

function get_contact_due(id) {
    $.ajax({
        method: 'get',
        url: /get-contact-due/ + id,
        dataType: 'text',
        success: function (result) {
            if (result != '') {
                $('.contact_due_text').find('span').text(result);
                $('.contact_due_text').removeClass('hide');
            } else {
                $('.contact_due_text').find('span').text('');
                $('.contact_due_text').addClass('hide');
            }
        },
    });
}

function submitQuickContactForm(form) {
    var data = $(form).serialize();
    $.ajax({
        method: 'POST',
        url: $(form).attr('action'),
        dataType: 'json',
        data: data,
        beforeSend: function (xhr) {
            __disable_submit_button($(form).find('button[type="submit"]'));
        },
        success: function (result) {
            if (result.success == true) {
                var name = result.data.name;

                if (result.data.supplier_business_name) {
                    name += result.data.supplier_business_name;
                }

                $('select#customer_id').append(
                    $('<option>', { value: result.data.id, text: name })
                );
                $('select#customer_id')
                    .val(result.data.id)
                    .trigger('change');
                $('div.contact_modal').modal('hide');
                update_shipping_address(result.data)
                toastr.success(result.msg);
            } else {
                toastr.error(result.msg);
            }
        },
    });
}

$(document).on('click', '#send_for_sell_return', function (e) {
    var invoice_no = $('#send_for_sell_return_invoice_no').val();

    if (invoice_no) {
        $.ajax({
            method: 'get',
            url: /validate-invoice-to-return/ + encodeURI(invoice_no),
            dataType: 'json',
            success: function (result) {
                if (result.success == true) {
                    window.location = result.redirect_url;
                } else {
                    toastr.error(result.msg);
                }
            },
        });
    }
})

$(document).on('ifChanged', 'input[name="search_fields[]"]', function (event) {
    var search_fields = [];
    $('input[name="search_fields[]"]:checked').each(function () {
        search_fields.push($(this).val());
    });

    localStorage.setItem('pos_search_fields', search_fields);
});

function set_search_fields() {
    if ($('input[name="search_fields[]"]').length == 0) {
        return false;
    }

    var pos_search_fields = localStorage.getItem('pos_search_fields');

    if (pos_search_fields === null) {
        pos_search_fields = ['name', 'sku', 'lot'];
    }

    $('input[name="search_fields[]"]').each(function () {
        if (pos_search_fields.indexOf($(this).val()) >= 0) {
            $(this).iCheck('check');
        } else {
            $(this).iCheck('uncheck');
        }
    });
}

$(document).on('click', '#show_service_staff_availability', function () {
    loadServiceStaffAvailability();
})
$(document).on('click', '#refresh_service_staff_availability_status', function () {
    loadServiceStaffAvailability(false);
})
$(document).on('click', 'button.pause_resume_timer', function (e) {
    $('.view_modal').find('.overlay').removeClass('hide');
    $.ajax({
        method: 'get',
        url: $(this).attr('data-href'),
        dataType: 'json',
        success: function (result) {
            loadServiceStaffAvailability(false);
        },
    });
})

$(document).on('click', '.mark_as_available', function (e) {
    e.preventDefault()
    $('.view_modal').find('.overlay').removeClass('hide');
    $.ajax({
        method: 'get',
        url: $(this).attr('href'),
        dataType: 'json',
        success: function (result) {
            loadServiceStaffAvailability(false);
        },
    });
})
var service_staff_availability_interval = null;

function loadServiceStaffAvailability(show = true) {
    var location_id = $('[name="location_id"]').val();
    $.ajax({
        method: 'get',
        url: $('#show_service_staff_availability').attr('data-href'),
        dataType: 'html',
        data: { location_id: location_id },
        success: function (result) {
            $('.view_modal').html(result);
            if (show) {
                $('.view_modal').modal('show')

                //auto refresh service staff availabilty if modal is open
                service_staff_availability_interval = setInterval(function () {
                    loadServiceStaffAvailability(false);
                }, 60000);
            }
        },
    });
}

$(document).on('hidden.bs.modal', '.view_modal', function () {
    if (service_staff_availability_interval !== null) {
        clearInterval(service_staff_availability_interval);
    }
    service_staff_availability_interval = null;
});


$(document).on('change', '#res_waiter_id', function (e) {
    var is_enable = $(this).find('option:selected').data('is_enable');

    if (is_enable) {
        swal({
            text: LANG.enter_pin_here,
            buttons: true,
            dangerMode: true,
            content: {
                element: "input",
                attributes: {
                    placeholder: LANG.enter_pin_here,
                    type: "password",
                },
            },
        })
            .then((inputValue) => {
                if (inputValue !== null) {
                    $.ajax({
                        method: 'get',
                        url: '/modules/data/check-staff-pin',
                        dataType: 'json',
                        data: {
                            service_staff_pin: inputValue,
                            user_id: $("#res_waiter_id").val(),
                        },
                        success: (result) => {

                            if (result == false) {
                                toastr.error(LANG.authentication_failed);
                                $("#res_waiter_id").val('');
                            } else {
                                // AJAX request succeeded, resolve
                                toastr.success(LANG.authentication_successfull);
                            }
                        },
                    });
                } else {
                    // Handle the "Cancel" action
                    $("#res_waiter_id").val('');
                }
            });

    }
})
