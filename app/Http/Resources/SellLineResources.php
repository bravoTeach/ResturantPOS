<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SellLineResources extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            "id"            => $this->product->id,
            "name"          => $this->product->name,
            "brand_id"          => $this->product->brand_id,
            "brand_name"          => $this->product->brand_id!=null?$this->product->brand->name:"Others",
            "note"          => $this->sell_line_note,
            "print_status"  => $this->res_line_order_status,
            "qty"           => $this->quantity,        
        ];
    }
}
