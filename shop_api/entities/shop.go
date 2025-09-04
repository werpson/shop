package entities

type Shop struct {
	ID        int    `json:"shop_id"`
	Shop_name string `json:"shop_name"`
	Password  string `json:"password"`
	Image     string `json:"image"`
}
