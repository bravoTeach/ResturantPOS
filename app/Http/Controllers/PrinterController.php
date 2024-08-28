<?php

namespace App\Http\Controllers;

use App\Printer;
use Datatables;
use Illuminate\Http\Request;
use App\Transaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\View;

class PrinterController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        if (request()->ajax()) {
            $business_id = request()->session()->get('user.business_id');

            $printer = Printer::where('business_id', $business_id)
                        ->select(['name', 'connection_type',
                            'capability_profile', 'char_per_line', 'ip_address', 'port', 'path', 'id', ]);

            return Datatables::of($printer)
                ->editColumn('capability_profile', function ($row) {
                    return Printer::capability_profile_srt($row->capability_profile);
                })
                ->editColumn('connection_type', function ($row) {
                    return Printer::connection_type_str($row->connection_type);
                })
                ->addColumn(
                    'action',
                    '@can("printer.update")
                    <a href="{{action(\'App\Http\Controllers\PrinterController@edit\', [$id])}}" class="btn btn-xs btn-primary"><i class="glyphicon glyphicon-edit"></i> @lang("messages.edit")</a>
                        &nbsp;
                    @endcan
                    @can("printer.delete")
                        <button data-href="{{action(\'App\Http\Controllers\PrinterController@destroy\', [$id])}}" class="btn btn-xs btn-danger delete_printer_button"><i class="glyphicon glyphicon-trash"></i> @lang("messages.delete")</button>
                    @endcan'
                )
                ->removeColumn('id')
                ->rawColumns([7])
                ->make(false);
        }

        return view('printer.index');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        $capability_profiles = Printer::capability_profiles();
        $connection_types = Printer::connection_types();

        return view('printer.create')
            ->with(compact('capability_profiles', 'connection_types'));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            $business_id = $request->session()->get('user.business_id');
            $input = $request->only(['name', 'connection_type', 'capability_profile', 'ip_address', 'port', 'path', 'char_per_line']);

            $input['business_id'] = $business_id;
            $input['created_by'] = $request->session()->get('user.id');

            if ($input['connection_type'] == 'network') {
                $input['path'] = '';
            } elseif (in_array($input['connection_type'], ['windows', 'linux'])) {
                $input['ip_address'] = '';
                $input['port'] = '';
            }

            $printer = new Printer;
            $printer->fill($input)->save();

            $output = ['success' => 1,
                'msg' => __('printer.added_success'),
            ];
        } catch (\Exception $e) {
            \Log::emergency('File:'.$e->getFile().'Line:'.$e->getLine().'Message:'.$e->getMessage());

            $output = ['success' => false,
                'msg' => __('messages.something_went_wrong'),
            ];
        }

        return redirect('printers')->with('status', $output);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        $business_id = request()->session()->get('user.business_id');
        $printer = Printer::where('business_id', $business_id)->find($id);

        $capability_profiles = Printer::capability_profiles();
        $connection_types = Printer::connection_types();

        return view('printer.edit')
            ->with(compact('printer', 'capability_profiles', 'connection_types'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            $input = $request->only(['name', 'connection_type', 'capability_profile', 'ip_address', 'port', 'path', 'char_per_line']);
            $business_id = $request->session()->get('user.business_id');

            $printer = Printer::where('business_id', $business_id)->findOrFail($id);

            if ($input['connection_type'] == 'network') {
                $input['path'] = '';
            } elseif (in_array($input['connection_type'], ['windows', 'linux'])) {
                $input['ip_address'] = '';
                $input['port'] = '';
            }

            $printer->fill($input)->save();

            $output = ['success' => true,
                'msg' => __('printer.updated_success'),
            ];
        } catch (\Exception $e) {
            \Log::emergency('File:'.$e->getFile().'Line:'.$e->getLine().'Message:'.$e->getMessage());

            $output = ['success' => false,
                'msg' => __('messages.something_went_wrong'),
            ];
        }

        return redirect('printers')->with('status', $output);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        if (! auth()->user()->can('access_printers')) {
            abort(403, 'Unauthorized action.');
        }

        if (request()->ajax()) {
            try {
                $business_id = request()->user()->business_id;

                $printer = Printer::where('business_id', $business_id)->findOrFail($id);
                $printer->delete();

                $output = ['success' => true,
                    'msg' => __('printer.deleted_success'),
                ];
            } catch (\Exception $e) {
                \Log::emergency('File:'.$e->getFile().'Line:'.$e->getLine().'Message:'.$e->getMessage());

                $output = ['success' => false,
                    'msg' => __('messages.something_went_wrong'),
                ];
            }

            return $output;
        }
    }

    public static function printKitchen($transaction_id, $msg, $myItem = [])
    {
        try {
            // Retrieve the transaction
            $transaction = Transaction::findOrFail($transaction_id);
            $transaction->load('sell_lines.product.brand');

            // Initialize an array to store item details
            $itemDetails = [];
            $allItemDetails = []; //make just for chking....

            if (!empty($myItem)) {
                $itemDetails = $myItem;
                $allItemDetails = $myItem;
            } else {
                // Loop through each sell line associated with the transaction
                foreach ($transaction->sell_lines as $sellLine) {
                    // Get the product name
                    $productId = $sellLine->product_id;
                    $productName = $sellLine->product->name;
                    $brandId = $sellLine->product->brand_id;
                    $brandName = $sellLine->product->brand_id != null ? $sellLine->product->brand->name : "Others";

                    // Get the department name
                    $departmentName = $sellLine->product->product_custom_field1;

                    // Get the quantity
                    $quantity = $sellLine->quantity;

                    // Add item details to the array
                    // $itemDetails[] = [
                    //     'product_id' => $productId,
                    //     'product_name' => $productName,
                    //     'department' => $departmentName,
                    //     'quantity' => $quantity,
                    // ];
                    $allItemDetails[] = [
                        'product_id' => $productId,
                        'brand_id' => $brandId,
                        'brand' => $brandName,
                        'product_name' => $productName,
                        'department' => $departmentName,
                        'quantity' => $quantity,
                        'note' => $sellLine->sell_line_note != null ? $sellLine->sell_line_note : ""
                    ];

                    if ($sellLine->created_at == $sellLine->updated_at) {

                        // Add item details to the array
                        $itemDetails[] = [
                            'product_id' => $productId,
                            'brand_id' => $brandId,
                            'brand' => $brandName,
                            'product_name' => $productName,
                            'department' => $departmentName,
                            'quantity' => $quantity,
                            'note' => $sellLine->sell_line_note != null ? $sellLine->sell_line_note : ""
                        ];
                    }
                }
            }


            // Convert the array to a collection, sort by brand_id, and convert back to array
            $allItemDetails = collect($allItemDetails)->sort(function ($a, $b) {
                if (is_null($a['brand_id']))
                    return 1;
                if (is_null($b['brand_id']))
                    return -1;
                return $a['brand_id'] <=> $b['brand_id'];
            })->values()->all();

            // Convert the array to a collection, sort by brand_id, and convert back to array
            $itemDetails = collect($itemDetails)->sort(function ($a, $b) {
                if (is_null($a['brand_id']))
                    return 1;
                if (is_null($b['brand_id']))
                    return -1;
                return $a['brand_id'] <=> $b['brand_id'];
            })->values()->all();

            // Get the table name associated with the transaction, if any
            $transaction_note = $transaction->additional_notes;
            $tableName = $transaction->table->name ?? "";
            $persons = $transaction->custom_field_4 == null ? 0 : $transaction->custom_field_4;
            $typeofservice = $transaction->types_of_service != null ? $transaction->types_of_service->name : "";
            $staff_first = $transaction->service_staff != null ? $transaction->service_staff->first_name : "";
            $staff_last = $transaction->service_staff != null ? $transaction->service_staff->last_name : "";
            $business_id = request()->session()->get('user.business_id');
            $final = $tableName == "" ? $typeofservice : $tableName;

            // Fetch all network printers
            $networkPrinters = Printer::where('business_id', $business_id)
                ->where('connection_type', 'network')
                ->get();

            // Array to store printer information
            $printerStatus = [];

            // Try to print "Hello, World!" on each network printer
            foreach ($networkPrinters as $printer) {
                $arrayOfString = [];
                $ipAddress = $printer->ip_address;
                $port = $printer->port;
                $currentDateTime = now()->toDateTimeString(); // Get current datetime

                // Get the current date
                $currentDate = Carbon::now()->toDateString();

                // Get the current time
                $currentTime = Carbon::now()->toTimeString();


                try {
                    if (!empty($itemDetails)) {
                        // Check if the printer is reachable
                        $socket = @fsockopen($ipAddress, $port, $errorCode, $errorMessage, 10);
                        // $terminalWidth = 30;

                        // Calculate the padding needed to center the text
                        // $paddingLength = floor(($terminalWidth - strlen($item['product_name'])) / 2);
                        if ($socket) {
                            $printingItems = "";
                            // ESC/POS commands for formatting
                            $boldOn = "\x1B\x45\x01"; // Turn bold on
                            $boldOff = "\x1B\x45\x00"; // Turn bold off
                            $doubleSizeOn = "\x1B\x21\x30"; // Double font size
                            $doubleSizeOff = "\x1B\x21\x00"; // Normal font size
                            $tripleSizeOn = "\x1D\x21\x22"; // Triple font size (width and height)
                            $tripleSizeOff = "\x1D\x21\x00"; // Normal font size
                            $onePointFiveSizeOn = "\x1B\x21\x21"; // Example command for 1.5x
                            $onePointFiveSizeOff = "\x1B\x21\x00"; // Normal font size
                            $onePointFiveSizeOnBrand = "\x1E\x21\x21"; // Example command for 1.5x
                            $onePointFiveSizeOffBrand = "\x1E\x21\x00"; // Normal font size
                            $currentBrand = null;
                            foreach ($itemDetails as $item) {
                                if ($item['department'] == $printer->id) {
                                    // Check if the brand has changed
                                    if ($item['brand'] !== $currentBrand) {
                                        // Add a separation line
                                        $printingItems .= $boldOn . "\x1B\x61\x01" . "----------------------------------\n";
                                        $printingItems .= "\x1B\x61\x01" . "\x1D\x21\x11" . "  " . $item['brand'] . "\x1D\x21\x00" . "\n";
                                        $printingItems .= "\x1B\x61\x01" . "----------------------------------\n" . $boldOff;
                                        $printingItems .= "\x1B\x61\x00"; // Left alignment


                                        $currentBrand = $item['brand']; // Update the current brand
                                    }

                                    // Print the item details
                                    // Split the product name into lines without breaking words
                                    $product_name_lines = [];
                                    $words = explode(' ', $item['product_name']);
                                    $current_line = '';

                                    foreach ($words as $word) {
                                        // Check if adding the word to the current line exceeds the maximum length
                                        if (strlen($current_line . ' ' . $word) <= 26) {
                                            if ($current_line !== '') {
                                                $current_line .= ' ';
                                            }
                                            $current_line .= $word;
                                        } else {
                                            // Add the current line to the array of lines
                                            $product_name_lines[] = $current_line;
                                            // Start a new line with the current word
                                            $current_line = $word;
                                        }
                                    }

                                    // Add the last line
                                    if ($current_line !== '') {
                                        $product_name_lines[] = $current_line;
                                    }

                                    // Now use $product_name_lines as needed
                                    $printingItems .= $boldOn . $onePointFiveSizeOn . "  " . $item['quantity'] . "\t" . $product_name_lines[0] . $onePointFiveSizeOff . $boldOff . "\n";

                                    for ($i = 1; $i < count($product_name_lines); $i++) {
                                        $printingItems .= "\t" . $onePointFiveSizeOn . $product_name_lines[$i] . $onePointFiveSizeOff . "\n";
                                    }

                                    // Print the note if it exists
                                    if ($item['note'] != "") {
                                        $printingItems .= $boldOn . "  Note:-" . $item['note'] . $boldOff . "\n";
                                    }

                                }
                            }

                            if ($printingItems != "") {
                                // Printer is reachable, attempt printing
                                fclose($socket);
                                // Send print job to the printer
                                $message = "__________________________________________\n";
                                $message .= $boldOn . $doubleSizeOn . "\x1B\x61\x01" . $printer->name . $doubleSizeOff . $boldOff . "\n";
                                $message .= "\x1B\x61\x00"; // Left alignment
                                $message .= "__________________________________________\n";
                                $message .= $boldOn . "  Date Time: \t $currentDate  $currentTime" . $boldOff . "\n";
                                $message .= $boldOn . "  Order Type:  $typeofservice" . $boldOff . "\n";
                                $message .= $boldOn . "  Order No: \t $transaction->invoice_no" . $boldOff . "\n";
                                $message .= "  \x1B\x45 Persons: \t $persons\x1B\x46\n";
                                $message .= $boldOn . "  Server: \t $staff_first $staff_last" . $boldOff . "\n";

                                $message .= "__________________________________________\n";
                                $message .= "  QTY\tITEM\n";
                                $message .= "__________________________________________\n";
                                if ($transaction_note != null && $transaction_note != "") {
                                    $message .= "$printingItems\n\n";
                                    $message .= "____________________________________________\n";
                                    $message .= $boldOn . $doubleSizeOn . "\x1B\x61\x01" . $msg . " - " . $doubleSizeOff . $doubleSizeOn . $final . $doubleSizeOff . $boldOff . "\n";
                                    $message .= "\x1B\x61\x00"; // Left alignment
                                    $message .= "__________________________________________\n";
                                    $message .= $boldOn . "  Order Note: $transaction_note" . $boldOff . "\n\n\n\n\n\n\n\n\n\n\n";
                                } else {
                                    $message .= "$printingItems\n";
                                    $message .= "______________________________________\n";
                                    $message .= $boldOn . $doubleSizeOn . "\x1B\x61\x01" . $msg . " - " . $doubleSizeOff . $doubleSizeOn . $final . $doubleSizeOff . $boldOff . "\n";
                                    $message .= "\x1B\x61\x00"; // Left alignment
                                    $message .= "\n\n\n\n\n\n\n\n\n\n\n"; // Left alignment
                                }
                                // ESC/POS cut command (ESC i)
                                $cutCommand = "\x1B\x69";

                                $message .= $cutCommand;
                                $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
                                if ($socket === false) {
                                    \Log::error("Error creating socket");
                                    continue; // Skip this printer and move to the next one
                                }
                                $result = socket_connect($socket, $ipAddress, $port);
                                if ($result === false) {
                                    \Log::error("Error connecting to printer");
                                    continue; // Skip this printer and move to the next one
                                }
                                socket_write($socket, $message, strlen($message));




                                // Add paper cutting command here
                                $cutCommand = "\x1B" . "d" . "\x01"; // ESC d 1 (Cut paper)
                                socket_write($socket, $cutCommand, strlen($cutCommand));



                                socket_close($socket);
                                \Log::info("Printing at $currentDateTime on printer: $ipAddress:$port");
                                $jsonString = json_encode($arrayOfString);
                                // Add printer information with datetime to the array
                                $printerStatus[] = [
                                    'printer_id' => $printer->id,
                                    'printer_name' => $printer->name,
                                    'ip_address' => $ipAddress,
                                    'port' => $port,
                                    'datetime' => $currentDateTime,
                                    'status' => 'Printer is reachable',
                                    'success' => false,
                                    'order_type' => $typeofservice,
                                    'order_no' => $transaction->invoice_no,
                                    'table' => $tableName,
                                    'server' => "$staff_first $staff_last",
                                    'items' => $jsonString, // Assuming $printingItems contains the item details
                                ];
                            } else {
                                \Log::info("Printing at $currentDateTime on printer: $ipAddress:$port");

                                // Add printer information with datetime to the array
                                $printerStatus[] = [
                                    'printer_id' => $printer->id,
                                    'printer_name' => $printer->name,
                                    'ip_address' => $ipAddress,
                                    'port' => $port,
                                    'datetime' => $currentDateTime,
                                    'status' => 'Printer is reachable',
                                    'success' => false,
                                ];
                            }
                            $printingItems = "";


                        } else {
                            // Printer is unreachable
                            \Log::error("Printer unreachable: $ipAddress:$port - $errorMessage");

                            // Add printer information with error status to the array
                            $printerStatus[] = [
                                'printer_id' => $printer->id,
                                'printer_name' => $printer->name,
                                'ip_address' => $ipAddress,
                                'port' => $port,
                                'datetime' => $currentDateTime, // Add datetime even if printer is unreachable
                                'status' => 'Error: Printer unreachable',
                                'success' => false,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    // Handle any other errors that occur during printing
                    \Log::error("Error printing on printer: $ipAddress:$port - " . $e->getMessage());

                    // Add printer information with error status to the array
                    $printerStatus[] = [
                        'printer_name' => $printer->name,
                        'ip_address' => $ipAddress,
                        'port' => $port,
                        'datetime' => $currentDateTime, // Add datetime even if error occurs
                        'status' => 'Error: ' . $e->getMessage(),
                    ];
                }
            }

            return [
                'all_item_details' => $allItemDetails,
                'item_details' => $itemDetails,
                'table_name' => $tableName,
                'persons' => $persons,
                'printer_details' => $printerStatus
            ];
        } catch (\Exception $e) {
            // Log the error or handle it as per your application's requirements
            \Log::error('Error fetching item details: ' . $e->getMessage());

            // Return an error message
            return [
                'error' => 'Error fetching item details: ' . $e->getMessage(),
            ];
        }
    }

public function connectToNetworkPrinters()
{
    // if (!auth()->user()->can('access_printers')) {
    //     abort(403, 'Unauthorized action.');
    // }

    $business_id = request()->session()->get('user.business_id');

    // Fetch all network printers
    $networkPrinters = Printer::where('business_id', $business_id)
        ->where('connection_type', 'network')
        ->get();

    // Array to store printer information
    $printerStatus = [];

    // Try to print "Hello, World!" on each network printer
    foreach ($networkPrinters as $printer) {
        $ipAddress = $printer->ip_address;
        $port = $printer->port;
        $currentDateTime = now()->toDateTimeString(); // Get current datetime
    
        try {
            // Check if the printer is reachable
            $socket = @fsockopen($ipAddress, $port, $errorCode, $errorMessage, 10);
    
            if ($socket) {
                // Printer is reachable, attempt printing
                fclose($socket);
                
                // Send print job to the printer
                $message = "Hello, World!,It's a great day!!!\n"; // Message to print
                $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
                if ($socket === false) {
                    \Log::error("Error creating socket");
                    continue; // Skip this printer and move to the next one
                }
                $result = socket_connect($socket, $ipAddress, $port);
                if ($result === false) {
                    \Log::error("Error connecting to printer");
                    continue; // Skip this printer and move to the next one
                }
                socket_write($socket, $message, strlen($message));
                socket_close($socket);
    
                \Log::info("Printing at $currentDateTime on printer: $ipAddress:$port");
    
                // Add printer information with datetime to the array
                $printerStatus[] = [
                    'printer_name' => $printer->name,
                    'ip_address' => $ipAddress,
                    'port' => $port,
                    'datetime' => $currentDateTime,
                    'status' => 'Printed successfully',
                ];
            } else {
                // Printer is unreachable
                \Log::error("Printer unreachable: $ipAddress:$port - $errorMessage");
    
                // Add printer information with error status to the array
                $printerStatus[] = [
                    'printer_name' => $printer->name,
                    'ip_address' => $ipAddress,
                    'port' => $port,
                    'datetime' => $currentDateTime, // Add datetime even if printer is unreachable
                    'status' => 'Error: Printer unreachable',
                ];
            }
        } catch (\Exception $e) {
            // Handle any other errors that occur during printing
            \Log::error("Error printing on printer: $ipAddress:$port - " . $e->getMessage());
    
            // Add printer information with error status to the array
            $printerStatus[] = [
                'printer_name' => $printer->name,
                'ip_address' => $ipAddress,
                'port' => $port,
                'datetime' => $currentDateTime, // Add datetime even if error occurs
                'status' => 'Error: ' . $e->getMessage(),
            ];
        }
    }    

    // Pass printer information to the view and render it
    return View::make('printer.printer')->with('printerStatus', $printerStatus);
}
}
