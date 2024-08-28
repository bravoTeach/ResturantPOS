<?php

namespace App\Http\Resources;

use App\Printer;
use App\Http\Resources\SellLineResources;

use Illuminate\Http\Resources\Json\JsonResource;

class ResTableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request): array
    {
        $transaction = null;
        if($this->transactions){
            $filteredTransaction = $this->transactions->filter(function ($transaction) {
                return $transaction->payment_status === 'due';
            });

            if ($filteredTransaction->isNotEmpty()) {
                // Retrieve the first transaction ID
                $transaction = $filteredTransaction->first();
                // Load sell_lines with product relationship
                $transaction->load('sell_lines.product.brand');
                // $transaction->load('sell_lines.product.brand');
            }

        }
        return [
            "id"             => $this->id,
            "business_id"    => $this->business_id,
            "location_id"    => $this->location_id,
            "name"           => $this->name,
            "isActive"       => count($filteredTransaction?? []) > 0 ? true : false,
            "isActiveFrom"   => $filteredTransaction->first()->created_at ?? null,
            "service_type"   => $transaction ? $transaction->types_of_service ? $transaction->types_of_service->name : null : null,
            "transactionId"  => $transaction ? $transaction->id: null,
            "transaction"    => $transaction,
            "itemDetails"    => $transaction ? SellLineResources::collection($transaction->sell_lines): null,
            "sales_person"   => $transaction ? $transaction->sales_person : null,
            "customer"       => $transaction ? $transaction->contact : null,
            "waiter"         => $transaction ? $transaction->service_staff ? $transaction->service_staff->first_name : "" : "",
        ];
    }
}
