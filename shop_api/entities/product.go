package entities

type Product struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Detail   string `json:"detail"`
	Quantity int    `json:"quantity"`
	Price    int    `json:"price"`
	Type     string `json:"type"`
	Shop_id  int    `json:"shop_id"`
	Image    string `json:"image"`
	Status   string `json:"status"`
	BarCode  string `json:"barcode"`
}
