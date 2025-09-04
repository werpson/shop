package entities

type ProductHistory struct {
	ID           int    `json:"id"`
	ProductID    int    `json:"product_id"`
	Method       string `json:"method"` // 'c' for create, 'u' for update, 'd' for delete
	By           int    `json:"by"`     // User ID who performed the action
	Date         string `json:"date"`   // ISO 8601 format
	Old_Name     string `json:"old_name"`
	Old_Detail   string `json:"old_detail"`
	Old_Quantity int    `json:"old_quantity"`
	Old_Price    int    `json:"old_price"`
	Old_Type     string `json:"old_type"`
	Old_Image    string `json:"old_image"`
	New_Name     string `json:"new_name"`
	New_Detail   string `json:"new_detail"`
	New_Quantity int    `json:"new_quantity"`
	New_Price    int    `json:"new_price"`
	New_Type     string `json:"new_type"`
	New_Image    string `json:"new_image"`
	FirstDate    string `json:"first_date,omitempty"` // First date of change for 'd' method
	LastDate     string `json:"last_date,omitempty"`  // Last date of change for 'c' method
	TotalOut     int    `json:"total_out,omitempty"`  // Total quantity out for 'd' method
	TotalIn      int    `json:"total_in,omitempty"`   // Total quantity in for 'c' method
	Old_Status   string `json:"old_status"`
	New_Status   string `json:"new_status"`
}
