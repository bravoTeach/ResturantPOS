<?php

namespace App\Http\Controllers\Restaurant;

use App\Restaurant\ResTable;
use App\Http\Resources\ResTableResource;
use App\Transaction;
use App\User;
use App\Utils\Util;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DataController extends Controller
{
    /**
     * All Utils instance.
     */
    protected $commonUtil;

    public function __construct(Util $commonUtil)
    {
        $this->commonUtil = $commonUtil;
    }

    /**
     * Show the restaurant module related details in pos screen.
     *
     * @return \Illuminate\Http\Response
     */
    public function getPosDetails(Request $request)
    {
        if (request()->ajax()) {
            $business_id = $request->session()->get('user.business_id');
            $location_id = $request->get('location_id');
            if (! empty($location_id)) {
                $transaction_id = $request->get('transaction_id', null);
                if (! empty($transaction_id)) {
                    $transaction = Transaction::find($transaction_id);
                    $view_data = ['res_table_id' => $transaction->res_table_id,
                        'res_waiter_id' => $transaction->res_waiter_id,
                    ];
                } else {
                    $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
                }

                $waiters_enabled = false;
                $tables_enabled = false;
                $waiters = null;
                $tables = null;
                if ($this->commonUtil->isModuleEnabled('service_staff')) {
                    $waiters_enabled = true;
                    $waiters = $this->commonUtil->getServiceStaff($business_id, $location_id, false);
                }
                if ($this->commonUtil->isModuleEnabled('tables')) {
                    $tables_enabled = true;
                    $tables = ResTable::where('business_id', $business_id)
                            ->where('location_id', $location_id)
                            ->orderBy('name', 'asc')
                            ->pluck('name', 'id');
                }
            } else {
                $tables = [];
                $waiters = [];
                $waiters_enabled = $this->commonUtil->isModuleEnabled('service_staff') ? true : false;
                $tables_enabled = $this->commonUtil->isModuleEnabled('tables') ? true : false;
                $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
            }

            $pos_settings = json_decode($request->session()->get('business.pos_settings'), true);

            $is_service_staff_required = (! empty($pos_settings['is_service_staff_required']) && $pos_settings['is_service_staff_required'] == 1) ? true : false;

            return view('restaurant.partials.pos_table_dropdown')
                    ->with(compact('tables', 'waiters', 'view_data', 'waiters_enabled', 'tables_enabled', 'is_service_staff_required'));
        }
    }

    public function getTables(Request $request)
{
    if (request()->ajax()) {
        $business_id = $request->session()->get('user.business_id');
        $location_id = $request->get('location_id');
        
        if (!empty($location_id)) {
            $transaction_id = $request->get('transaction_id', null);
            if (!empty($transaction_id)) {
                $transaction = Transaction::find($transaction_id);
                $view_data = [
                    'res_table_id' => $transaction->res_table_id,
                    'res_waiter_id' => $transaction->res_waiter_id,
                ];
            } else {
                $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
            }

            $waiters_enabled = false;
            $tables_enabled = false;
            $waiters = null;
            $tables = null;
            
            if ($this->commonUtil->isModuleEnabled('service_staff')) {
                $waiters_enabled = true;
                $waiters = $this->commonUtil->getServiceStaff($business_id, $location_id, false);
            }
            
            if ($this->commonUtil->isModuleEnabled('tables')) {
                $tables_enabled = true;
                $tables = ResTable::where('business_id', $business_id)
                                  ->where('location_id', $location_id)
                                  ->get();

                // Custom sorting function
                $tables = $tables->sort(function ($a, $b) {
                    $regex = '/^([a-zA-Z]+)(\d+)?([a-zA-Z]+)?(\d+)?/';
                    preg_match($regex, $a->name, $aMatches);
                    preg_match($regex, $b->name, $bMatches);

                    $alphaComparison = strcmp($aMatches[1], $bMatches[1]);

                    if ($alphaComparison === 0) {
                        $aNumeric = isset($aMatches[2]) ? intval($aMatches[2]) : 0;
                        $bNumeric = isset($bMatches[2]) ? intval($bMatches[2]) : 0;
                        if ($aNumeric != $bNumeric) {
                            return $aNumeric - $bNumeric;
                        }
                        $aExtraAlpha = isset($aMatches[3]) ? $aMatches[3] : '';
                        $bExtraAlpha = isset($bMatches[3]) ? $bMatches[3] : '';
                        return strcmp($aExtraAlpha, $bExtraAlpha);
                    }

                    return $alphaComparison;
                })->values(); // Reindex the collection
            } else {
                $tables = [];
                $waiters = [];
            }
        } else {
            $tables = [];
            $waiters = [];
            $waiters_enabled = $this->commonUtil->isModuleEnabled('service_staff') ? true : false;
            $tables_enabled = $this->commonUtil->isModuleEnabled('tables') ? true : false;
            $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
        }

        $pos_settings = json_decode($request->session()->get('business.pos_settings'), true);

        $is_service_staff_required = (!empty($pos_settings['is_service_staff_required']) && $pos_settings['is_service_staff_required'] == 1) ? true : false;

        return ResTableResource::collection($tables);
    }
}


        public function getServiceStaff(Request $request)
    {
        if (request()->ajax()) {
            $business_id = $request->session()->get('user.business_id');
            $location_id = $request->get('location_id');
            if (! empty($location_id)) {
                $transaction_id = $request->get('transaction_id', null);
                if (! empty($transaction_id)) {
                    $transaction = Transaction::find($transaction_id);
                    $view_data = ['res_table_id' => $transaction->res_table_id,
                        'res_waiter_id' => $transaction->res_waiter_id,
                    ];
                } else {
                    $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
                }

                $waiters_enabled = false;
                $tables_enabled = false;
                $waiters = null;
                $tables = null;
                if ($this->commonUtil->isModuleEnabled('service_staff')) {
                    $waiters_enabled = true;
                    $waiters = $this->commonUtil->getServiceStaff($business_id, $location_id, false);
                }
                if ($this->commonUtil->isModuleEnabled('tables')) {
                    $tables_enabled = true;
                    $tables = ResTable::where('business_id', $business_id)
                            ->where('location_id', $location_id)
                            ->orderBy('name', 'asc')
                            ->get();
                            // ->pluck('name', 'id');
                }
            } else {
                $tables = [];
                $waiters = [];
                $waiters_enabled = $this->commonUtil->isModuleEnabled('service_staff') ? true : false;
                $tables_enabled = $this->commonUtil->isModuleEnabled('tables') ? true : false;
                $view_data = ['res_table_id' => null, 'res_waiter_id' => null];
            }

            $pos_settings = json_decode($request->session()->get('business.pos_settings'), true);

            $is_service_staff_required = (! empty($pos_settings['is_service_staff_required']) && $pos_settings['is_service_staff_required'] == 1) ? true : false;

            return $waiters;

        }
    }

    /**
     * Save the pos screen details.
     *
     * @return null
     */
    public function sellPosStore($input)
    {
        $table_id = request()->get('res_table_id');
        $res_waiter_id = request()->get('res_waiter_id');

        Transaction::where('id', $input['transaction_id'])
            ->where('type', 'sell')
            ->where('business_id', $input['business_id'])
            ->update(['res_table_id' => $table_id,
                'res_waiter_id' => $res_waiter_id, ]);
    }

    public function checkStaffPin(Request $request){
        $service_staff_pin = $request->get('service_staff_pin');
        $user_id = $request->get('user_id');

        $business_id = $request->session()->get('user.business_id');
        $query = User::where('service_staff_pin', $service_staff_pin)->where('id', $user_id)->where('business_id', $business_id);

        $exists = $query->exists();
        if ($exists) {
            echo 'true';
            exit;
        } else {
            echo 'false';
            exit;
        }
    }
}
