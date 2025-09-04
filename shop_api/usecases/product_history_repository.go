package usecases

import (
	"github.com/werpson/shop/entities"
)

type ProductHistoryRepository interface {
	Select(productHistory entities.ProductHistory, product entities.Product, user entities.User, month int, year int) ([]entities.ProductHistory, []entities.Product, []entities.User, error)
	SelectTopOut(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error)
	SelectTopIn(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error)
}
