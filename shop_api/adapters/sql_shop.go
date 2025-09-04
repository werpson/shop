package adapters

import (
	"database/sql"

	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type SQLShopRepository struct {
	db *sql.DB
}

func NewSQLShopRepository(db *sql.DB) usecases.ShopRepository {
	return &SQLShopRepository{db: db}
}

func (r *SQLShopRepository) Select(shop entities.Shop) ([]entities.Shop, error) {
	rows, err := r.db.Query("SELECT shop_id, shop_name, img FROM shops")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shops []entities.Shop
	for rows.Next() {
		var shop entities.Shop
		if err := rows.Scan(&shop.ID, &shop.Shop_name, &shop.Image); err != nil {
			return nil, err
		}
		shops = append(shops, shop)
	}

	return shops, nil
}

func (r *SQLShopRepository) Insert(shop entities.Shop) error {
	_, err := r.db.Exec("INSERT INTO shops (shop_name, password, img) VALUES ($1, $2, $3)", shop.Shop_name, shop.Password, shop.Image)
	return err
}

func (r *SQLShopRepository) Update(shop entities.Shop) error {
	_, err := r.db.Exec("UPDATE shops SET shop_name = $1, password = $2 WHERE id = $3", shop.Shop_name, shop.Password, shop.ID)
	return err
}

func (r *SQLShopRepository) Delete(shopID int) error {
	_, err := r.db.Exec("DELETE FROM shops WHERE shop_id = $1", shopID)
	return err
}

func (r *SQLShopRepository) Login(shop entities.Shop) (usecases.AuthShopRepository, error) {
	var authShop usecases.AuthShopRepository
	err := r.db.QueryRow("SELECT shop_id, shop_name FROM shops WHERE shop_id = $1 AND password = $2", shop.ID, shop.Password).Scan(&authShop.Shop.ID, &authShop.Shop.Shop_name)
	if err != nil {
		if err == sql.ErrNoRows {
			return usecases.AuthShopRepository{}, nil // No matching shop found
		}
		return usecases.AuthShopRepository{}, err // Other error
	}
	return authShop, nil
}
