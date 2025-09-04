package usecases

import (
	"github.com/werpson/shop/entities"
)

type ProductRepository interface {
	Select(product entities.Product) ([]entities.Product, error)
	Insert(product entities.Product, product_history entities.ProductHistory) error
	Update(product entities.Product, product_history entities.ProductHistory) error
	Delete(product entities.Product, product_history entities.ProductHistory) error
}
