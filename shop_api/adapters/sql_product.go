package adapters

import (
	"database/sql"
	"time"

	_ "github.com/lib/pq"

	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type SqlProductRepository struct {
	db *sql.DB
}

func NewSqlProductRepository(db *sql.DB) usecases.ProductRepository {
	return &SqlProductRepository{db: db}
}

func (r *SqlProductRepository) Select(product entities.Product) ([]entities.Product, error) {

	rows, err := r.db.Query("SELECT * FROM products WHERE shop_id = $1", product.Shop_id)

	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var products []entities.Product

	for rows.Next() {
		var p entities.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Detail, &p.Price, &p.Quantity, &p.Type, &p.Shop_id, &p.Image, &p.Status, &p.BarCode); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, nil
}

func (r *SqlProductRepository) Insert(product entities.Product, product_history entities.ProductHistory) error {
	var productID int
	err := r.db.QueryRow("INSERT INTO products (product_name, product_detail, product_quantity, product_price, product_type, shop_id, img, status, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING product_id",
		product.Name, product.Detail, product.Quantity, product.Price, product.Type, product.Shop_id, product.Image, "a", product.BarCode).Scan(&productID)

	if err != nil {
		return err
	}

	// Insert product history after product is inserted
	_, err = r.db.Exec("INSERT INTO product_history (product_id, method, by, new_name, new_detail, new_quantity, new_price, new_type, new_img, date, new_status) VALUES ($1, 'c', $2, $3, $4, $5, $6, $7, $8, $9, $10)",
		productID,
		product_history.By,
		product.Name,
		product.Detail,
		product.Quantity,
		product.Price,
		product.Type,
		product.Image,
		time.Now(),
		"a",
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *SqlProductRepository) Update(product entities.Product, product_history entities.ProductHistory) error {
	var oldName, oldDetail, oldType, oldImage, oldStatus string
	var oldQuantity, oldPrice int

	err := r.db.QueryRow("SELECT product_name, product_detail, product_quantity, product_price, product_type, img, status FROM products WHERE product_id = $1", product.ID).Scan(
		&oldName, &oldDetail, &oldQuantity, &oldPrice, &oldType, &oldImage, &oldStatus,
	)

	if err != nil {
		return err
	}

	if product.Image == "" {
		product.Image = oldImage
	}
	_, err = r.db.Exec("UPDATE products SET product_name = $1, product_detail = $2, product_quantity = $3, product_price = $4, product_type = $5, img = $6, status = $7 WHERE product_id = $8",
		product.Name, product.Detail, product.Quantity, product.Price, product.Type, product.Image, "a", product.ID)

	if err != nil {
		return err
	}

	var newName, newDetail, newType, newImage, newStatus string
	var newQuantity, newPrice int
	err = r.db.QueryRow("SELECT product_name, product_detail, product_quantity, product_price, product_type, img, status FROM products WHERE product_id = $1", product.ID).Scan(
		&newName, &newDetail, &newQuantity, &newPrice, &newType, &newImage, &newStatus,
	)

	if err != nil {
		return err
	}

	// แล้วค่อย assign กลับเข้า product_history
	product_history.Old_Name = oldName
	product_history.Old_Detail = oldDetail
	product_history.Old_Quantity = oldQuantity
	product_history.Old_Price = oldPrice
	product_history.Old_Type = oldType
	product_history.Old_Image = oldImage
	product_history.New_Name = newName
	product_history.New_Detail = newDetail
	product_history.New_Quantity = newQuantity
	product_history.New_Price = newPrice
	product_history.New_Type = newType
	product_history.New_Image = newImage
	product_history.Old_Status = oldStatus
	product_history.New_Status = newStatus

	_, err = r.db.Exec("INSERT INTO product_history (product_id, method, by, old_name, old_detail, old_quantity, old_price, old_type, old_img, new_name, new_detail, new_quantity, new_price, new_type, new_img, date, old_status, new_status) VALUES ($1, 'u', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
		product.ID,
		product_history.By,
		product_history.Old_Name,
		product_history.Old_Detail,
		product_history.Old_Quantity,
		product_history.Old_Price,
		product_history.Old_Type,
		product_history.Old_Image,
		product_history.New_Name,
		product_history.New_Detail,
		product_history.New_Quantity,
		product_history.New_Price,
		product_history.New_Type,
		product_history.New_Image,
		time.Now(),
		product_history.Old_Status,
		product_history.New_Status,
	)

	return err
}

func (r *SqlProductRepository) Delete(product entities.Product, product_history entities.ProductHistory) error {
	var oldName, oldDetail, oldType, oldImage, oldStatus string
	var oldQuantity, oldPrice int

	err := r.db.QueryRow("SELECT product_name, product_detail, product_quantity, product_price, product_type, img, status FROM products WHERE product_id = $1", product.ID).Scan(
		&oldName, &oldDetail, &oldQuantity, &oldPrice, &oldType, &oldImage, &oldStatus,
	)
	if err != nil {
		return err
	}

	_, err = r.db.Exec("UPDATE products SET product_quantity = 0, status = 'u' WHERE product_id = $1", product.ID)
	if err != nil {
		return err
	}

	var newName, newDetail, newType, newImage, newStatus string
	var newQuantity, newPrice int
	err = r.db.QueryRow("SELECT product_name, product_detail, product_quantity, product_price, product_type, img, status FROM products WHERE product_id = $1", product.ID).Scan(
		&newName, &newDetail, &newQuantity, &newPrice, &newType, &newImage, &newStatus,
	)
	if err != nil {
		return err
	}

	product_history.Old_Name = oldName
	product_history.Old_Detail = oldDetail
	product_history.Old_Quantity = oldQuantity
	product_history.Old_Price = oldPrice
	product_history.Old_Type = oldType
	product_history.Old_Image = oldImage
	product_history.New_Name = newName
	product_history.New_Detail = newDetail
	product_history.New_Quantity = newQuantity
	product_history.New_Price = newPrice
	product_history.New_Type = newType
	product_history.New_Image = newImage
	product_history.Old_Status = oldStatus
	product_history.New_Status = newStatus

	_, err = r.db.Exec("INSERT INTO product_history (product_id, method, by, old_name, old_detail, old_quantity, old_price, old_type, old_img, new_name, new_detail, new_quantity, new_price, new_type, new_img, date, old_status, new_status) VALUES ($1, 'd', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
		product.ID,
		product_history.By,
		product_history.Old_Name,
		product_history.Old_Detail,
		product_history.Old_Quantity,
		product_history.Old_Price,
		product_history.Old_Type,
		product_history.Old_Image,
		product_history.New_Name,
		product_history.New_Detail,
		product_history.New_Quantity,
		product_history.New_Price,
		product_history.New_Type,
		product_history.New_Image,
		time.Now(),
		product_history.Old_Status,
		product_history.New_Status,
	)

	return err
}
