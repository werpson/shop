package adapters

import (
	"database/sql"

	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type SqlProductHistoryRepository struct {
	db *sql.DB
}

func NewSqlProductHistoryRepository(db *sql.DB) usecases.ProductHistoryRepository {
	return &SqlProductHistoryRepository{db: db}
}

func (r *SqlProductHistoryRepository) Select(productHistory entities.ProductHistory, product entities.Product, user entities.User, month int, year int) ([]entities.ProductHistory, []entities.Product, []entities.User, error) {
	// Build query and args for filtering by month/year
	baseQuery := `SELECT 
       product_history.history_id, product_history.product_id, product_history.method, product_history.by, product_history.date,
       product_history.old_name, product_history.old_detail, product_history.old_quantity, product_history.old_price, product_history.old_type, product_history.old_img,
       product_history.new_name, product_history.new_detail, product_history.new_quantity, product_history.new_price, product_history.new_type, product_history.new_img,
       product_history.new_status, product_history.old_status, products.*, users.user_id, users.f_name, users.l_name
       FROM product_history
       LEFT JOIN products ON product_history.product_id = products.product_id 
       LEFT JOIN users ON product_history.by = users.user_id 
       WHERE products.shop_id = $1`

	args := []interface{}{product.Shop_id}

	if month != 0 && year != 0 {
		baseQuery += " AND EXTRACT(MONTH FROM product_history.date) = $2 AND EXTRACT(YEAR FROM product_history.date) = $3"
		args = append(args, month, year)
	}

	baseQuery += " ORDER BY date DESC"

	rows, err := r.db.Query(baseQuery, args...)
	if err != nil {
		return nil, nil, nil, err
	}
	defer rows.Close()

	var histories []entities.ProductHistory
	var products []entities.Product
	var users []entities.User
	for rows.Next() {
		var history entities.ProductHistory
		var p entities.Product
		var u entities.User
		// รองรับ null ด้วย sql.NullString, sql.NullInt64
		var (
			oldName, oldDetail, oldType, oldImage, newName, newDetail, newType, newImage, oldStatus, newStatus sql.NullString
			oldQuantity, oldPrice, newQuantity, newPrice                                                       sql.NullInt64
		)
		if err := rows.Scan(
			&history.ID,
			&history.ProductID,
			&history.Method,
			&history.By,
			&history.Date,
			&oldName,
			&oldDetail,
			&oldQuantity,
			&oldPrice,
			&oldType,
			&oldImage,
			&newName,
			&newDetail,   // new_detail (string)
			&newQuantity, // new_quantity (int)
			&newPrice,    // new_price (int)
			&newType,
			&newImage,
			&oldStatus,
			&newStatus,
			// product fields
			&p.ID,
			&p.Name,
			&p.Detail,
			&p.Price,
			&p.Quantity,
			&p.Type,
			&p.Shop_id,
			&p.Image,
			&p.Status,
			&p.BarCode,
			// user fields
			&u.ID,
			&u.F_name,
			&u.L_name,
		); err != nil {
			return nil, nil, nil, err
		}
		// map null fields
		if oldName.Valid {
			history.Old_Name = oldName.String
		}
		if oldDetail.Valid {
			history.Old_Detail = oldDetail.String
		}
		if oldQuantity.Valid {
			history.Old_Quantity = int(oldQuantity.Int64)
		}
		if oldPrice.Valid {
			history.Old_Price = int(oldPrice.Int64)
		}
		if oldType.Valid {
			history.Old_Type = oldType.String
		}
		if oldImage.Valid {
			history.Old_Image = oldImage.String
		}
		if newName.Valid {
			history.New_Name = newName.String
		}
		if newDetail.Valid {
			history.New_Detail = newDetail.String
		}
		if newQuantity.Valid {
			history.New_Quantity = int(newQuantity.Int64)
		}
		if newPrice.Valid {
			history.New_Price = int(newPrice.Int64)
		}
		if newType.Valid {
			history.New_Type = newType.String
		}
		if newImage.Valid {
			history.New_Image = newImage.String
		}
		if oldStatus.Valid {
			history.Old_Status = oldStatus.String
		}
		if newStatus.Valid {
			history.New_Status = newStatus.String
		}

		histories = append(histories, history)
		products = append(products, p)
		users = append(users, u)
	}

	// Assuming we want to return the product as well
	return histories, products, users, nil
}

func (r *SqlProductHistoryRepository) SelectTopOut(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error) {
	query := `
    SELECT 
        products.product_id, products.product_name, products.product_detail, products.product_quantity, products.product_price, products.product_type, products.shop_id, products.img,
        MAX(product_history.date) AS last_date,
        MIN(product_history.date) AS first_date,
        SUM(COALESCE(old_quantity,0) - COALESCE(new_quantity,0)) AS total_out
    FROM products
    LEFT JOIN product_history ON products.product_id = product_history.product_id AND product_history.method = 'u' AND product_history.new_status = 'a'
    WHERE COALESCE(old_quantity,0) > COALESCE(new_quantity,0) AND products.shop_id = $1
    `
	args := []interface{}{product.Shop_id}

	if month != 0 && year != 0 {
		query += " AND EXTRACT(MONTH FROM product_history.date) = $2 AND EXTRACT(YEAR FROM product_history.date) = $3"
		args = append(args, month, year)
	}

	query += `
    GROUP BY products.product_id, products.product_name, products.product_detail, products.product_quantity, products.product_price, products.product_type, products.shop_id, products.img
    ORDER BY total_out DESC
    `

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var products []entities.Product
	var histories []entities.ProductHistory
	for rows.Next() {
		var p entities.Product
		var h entities.ProductHistory
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Detail,
			&p.Quantity,
			&p.Price,
			&p.Type,
			&p.Shop_id,
			&p.Image,
			&h.LastDate,  // last_date
			&h.FirstDate, // first_date
			&h.TotalOut,
		); err != nil {
			return nil, nil, err
		}
		h.ProductID = p.ID
		products = append(products, p)
		histories = append(histories, h)
	}

	return products, histories, nil
}

func (r *SqlProductHistoryRepository) SelectTopIn(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error) {
	query := `
    SELECT 
        products.product_id, products.product_name, products.product_detail, products.product_quantity, products.product_price, products.product_type, products.shop_id, products.img,
        MAX(product_history.date) AS last_date,
		MIN(product_history.date) AS first_date,
        SUM(COALESCE(new_quantity,0) - COALESCE(old_quantity,0)) AS total_in
    FROM products
    LEFT JOIN product_history ON products.product_id = product_history.product_id AND (product_history.method = 'u' OR product_history.method = 'c') AND product_history.new_status = 'a'
    WHERE (COALESCE(old_quantity,0) < COALESCE(new_quantity,0)) AND products.shop_id = $1
    `
	args := []interface{}{product.Shop_id}

	if month != 0 && year != 0 {
		query += " AND EXTRACT(MONTH FROM product_history.date) = $2 AND EXTRACT(YEAR FROM product_history.date) = $3"
		args = append(args, month, year)
	}

	query += `
    GROUP BY products.product_id, products.product_name, products.product_detail, products.product_quantity, products.product_price, products.product_type, products.shop_id, products.img
    ORDER BY total_in DESC
    `

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var products []entities.Product
	var histories []entities.ProductHistory
	for rows.Next() {
		var p entities.Product
		var h entities.ProductHistory
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Detail,
			&p.Quantity,
			&p.Price,
			&p.Type,
			&p.Shop_id,
			&p.Image,
			&h.LastDate,  // last_date
			&h.FirstDate, // first_date
			&h.TotalIn,   // total_in
		); err != nil {
			return nil, nil, err
		}
		h.ProductID = p.ID
		products = append(products, p)
		histories = append(histories, h)
	}

	return products, histories, nil
}
