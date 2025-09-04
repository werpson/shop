package entities

import "time"

type User struct {
	ID         int       `json:"id"`
	Username   string    `json:"username"`
	Password   string    `json:"password"`
	F_name     string    `json:"first_name"`
	L_name     string    `json:"last_name"`
	Permission string    `json:"permission"`
	Status     string    `json:"status"`
	C_by       int       `json:"create_by"`
	C_date     time.Time `json:"create_date"`
	E_by       int       `json:"edit_by"`
	E_date     time.Time `json:"edit_date"`
	Shop_id    int       `json:"shop_id"`
	Image      string    `json:"image"`
}
